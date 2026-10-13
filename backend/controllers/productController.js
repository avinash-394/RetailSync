const db = require('../database/db');

// Helper to determine stock status
function calculateStatus(quantity, minThreshold) {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

// GET /api/products
function getProducts(req, res) {
  try {
    const {
      q = '',
      category_id,
      status,
      sort_by = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (q) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)');
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(Number(category_id));
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Count total matches
    const countRow = db.get(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    // Sorting column validation to prevent injection
    const allowedSortColumns = {
      name: 'p.name',
      sku: 'p.sku',
      selling_price: 'p.selling_price',
      cost_price: 'p.cost_price',
      quantity: 'p.quantity',
      status: 'p.status',
      created_at: 'p.created_at'
    };
    const sortCol = allowedSortColumns[sort_by] || 'p.created_at';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Number(page) - 1) * Number(limit);

    const querySql = `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.brand,
        p.unit,
        p.cost_price,
        p.selling_price,
        p.quantity,
        p.min_threshold,
        p.lead_time_days,
        p.status,
        p.created_at,
        p.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        s.id AS supplier_id,
        s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const products = db.query(querySql, [...params, Number(limit), offset]);

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving products.' });
  }
}

// GET /api/products/:id
function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = db.get(
      `SELECT
        p.*,
        c.name AS category_name,
        s.name AS supplier_name,
        s.email AS supplier_email,
        s.phone AS supplier_phone
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?`,
      [Number(id)]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Also fetch last 10 inventory transactions for this product
    const transactions = db.query(
      `SELECT it.*, u.name as user_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.user_id = u.id
       WHERE it.product_id = ?
       ORDER BY it.created_at DESC
       LIMIT 10`,
      [Number(id)]
    );

    return res.json({
      success: true,
      product: {
        ...product,
        transactions
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving product.' });
  }
}

// POST /api/products
function createProduct(req, res) {
  try {
    const {
      sku,
      name,
      category_id,
      supplier_id,
      brand,
      unit = 'pcs',
      cost_price = 0,
      selling_price = 0,
      quantity = 0,
      min_threshold = 10,
      lead_time_days = 5
    } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ success: false, message: 'SKU and Product Name are required.' });
    }

    const existingSku = db.get('SELECT id FROM products WHERE sku = ?', [sku.trim().toUpperCase()]);
    if (existingSku) {
      return res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
    }

    const qty = Math.max(0, Number(quantity) || 0);
    const minThresh = Math.max(0, Number(min_threshold) || 10);
    const status = calculateStatus(qty, minThresh);

    const result = db.run(
      `INSERT INTO products (
        sku, name, category_id, supplier_id, brand, unit,
        cost_price, selling_price, quantity, min_threshold, lead_time_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku.trim().toUpperCase(),
        name.trim(),
        category_id ? Number(category_id) : null,
        supplier_id ? Number(supplier_id) : null,
        brand ? brand.trim() : null,
        unit ? unit.trim() : 'pcs',
        Number(cost_price) || 0,
        Number(selling_price) || 0,
        qty,
        minThresh,
        Number(lead_time_days) || 5,
        status
      ]
    );

    const newProductId = Number(result.lastInsertRowid);

    // If initial stock was provided, record opening stock transaction
    if (qty > 0) {
      db.run(
        `INSERT INTO inventory_transactions (
          product_id, user_id, type, quantity_change, previous_stock, new_stock, reference_id, reason
        ) VALUES (?, ?, 'ADJUSTMENT_IN', ?, 0, ?, 'INITIAL-STOCK', 'Opening Stock Entry')`,
        [newProductId, req.user?.id || null, qty, qty]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      productId: newProductId
    });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
}

// PUT /api/products/:id
function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      category_id,
      supplier_id,
      brand,
      unit,
      cost_price,
      selling_price,
      min_threshold,
      lead_time_days
    } = req.body;

    const existing = db.get('SELECT * FROM products WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check SKU collision if SKU changed
    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const duplicate = db.get('SELECT id FROM products WHERE sku = ? AND id != ?', [
        sku.trim().toUpperCase(),
        Number(id)
      ]);
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'SKU already in use by another product.' });
      }
    }

    const minThresh = min_threshold !== undefined ? Number(min_threshold) : existing.min_threshold;
    const newStatus = calculateStatus(existing.quantity, minThresh);

    db.run(
      `UPDATE products SET
        sku = ?,
        name = ?,
        category_id = ?,
        supplier_id = ?,
        brand = ?,
        unit = ?,
        cost_price = ?,
        selling_price = ?,
        min_threshold = ?,
        lead_time_days = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        sku ? sku.trim().toUpperCase() : existing.sku,
        name ? name.trim() : existing.name,
        category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id,
        supplier_id !== undefined ? (supplier_id ? Number(supplier_id) : null) : existing.supplier_id,
        brand !== undefined ? (brand ? brand.trim() : null) : existing.brand,
        unit !== undefined ? unit.trim() : existing.unit,
        cost_price !== undefined ? Number(cost_price) : existing.cost_price,
        selling_price !== undefined ? Number(selling_price) : existing.selling_price,
        minThresh,
        lead_time_days !== undefined ? Number(lead_time_days) : existing.lead_time_days,
        newStatus,
        Number(id)
      ]
    );

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
}

// DELETE /api/products/:id
function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT id, name FROM products WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.run('DELETE FROM products WHERE id = ?', [Number(id)]);
    return res.json({ success: true, message: `Product '${existing.name}' deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
}

// GET /api/products/categories
function getCategories(req, res) {
  try {
    const categories = db.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving categories.' });
  }
}

// POST /api/products/categories
function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = db.get('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists.' });
    }

    const result = db.run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name.trim(), description ? description.trim() : null]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created.',
      categoryId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
}

// DELETE /api/products/all (Admin only)
function deleteAllProducts(req, res) {
  try {
    db.exec(`
      DELETE FROM inventory_transactions;
      DELETE FROM sale_items;
      DELETE FROM purchase_items;
      DELETE FROM products;
    `);
    return res.json({ success: true, message: 'All products and associated line items deleted successfully.' });
  } catch (err) {
    console.error('deleteAllProducts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete all products.' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  getCategories,
  createCategory,
  calculateStatus
};

