const db = require('../database/db');
const { calculateStatus } = require('./productController');

// GET /api/purchases
function getPurchases(req, res) {
  try {
    const { page = 1, limit = 50, supplier_id, status } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (supplier_id) {
      conditions.push('p.supplier_id = ?');
      params.push(Number(supplier_id));
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = db.get(`SELECT COUNT(*) as total FROM purchases p WHERE ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    const offset = (Number(page) - 1) * Number(limit);

    const purchases = db.query(
      `SELECT
        p.*,
        s.name AS supplier_name,
        u.name AS user_name,
        COUNT(pi.id) AS item_count,
        COALESCE(SUM(pi.quantity), 0) AS total_units_received
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.purchase_date DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      purchases
    });
  } catch (err) {
    console.error('getPurchases error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving purchases.' });
  }
}

// GET /api/purchases/:id
function getPurchaseById(req, res) {
  try {
    const { id } = req.params;

    const purchase = db.get(
      `SELECT
        p.*,
        s.name AS supplier_name,
        s.contact_person AS supplier_contact,
        s.email AS supplier_email,
        s.phone AS supplier_phone,
        s.address AS supplier_address,
        u.name AS created_by_user
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [Number(id)]
    );

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found.' });
    }

    const items = db.query(
      `SELECT
        pi.*,
        pr.name AS product_name,
        pr.sku AS product_sku,
        pr.unit AS product_unit
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?`,
      [Number(id)]
    );

    return res.json({
      success: true,
      purchase: {
        ...purchase,
        items
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving purchase record.' });
  }
}

// POST /api/purchases
function createPurchase(req, res) {
  try {
    const { supplier_id, items, notes, purchase_date } = req.body;

    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID and at least one item are required.'
      });
    }

    const supplier = db.get('SELECT id, name FROM suppliers WHERE id = ?', [Number(supplier_id)]);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    // Generate PO Number (e.g., PO-2026-XXXX)
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const poNumber = `PO-${new Date().getFullYear()}-${timestamp}${randomSuffix}`;

    // Calculate total amount and validate line items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.get('SELECT * FROM products WHERE id = ?', [Number(item.product_id)]);
      if (!prod) {
        return res.status(404).json({
          success: false,
          message: `Product ID ${item.product_id} not found.`
        });
      }

      const qty = Number(item.quantity);
      const unitCost = Number(item.unit_cost !== undefined ? item.unit_cost : prod.cost_price);

      if (qty <= 0 || unitCost < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity or cost for product ${prod.name}.`
        });
      }

      const subtotal = Number((qty * unitCost).toFixed(2));
      totalAmount += subtotal;

      validatedItems.push({
        product: prod,
        quantity: qty,
        unitCost,
        subtotal
      });
    }

    totalAmount = Number(totalAmount.toFixed(2));
    const userId = req.user?.id || 1;

    // Execute atomic purchase creation
    const insertPurchase = db.run(
      `INSERT INTO purchases (po_number, supplier_id, user_id, purchase_date, total_amount, status, notes)
       VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, 'COMPLETED', ?)`,
      [poNumber, Number(supplier_id), userId, purchase_date || null, totalAmount, notes || null]
    );

    const purchaseId = Number(insertPurchase.lastInsertRowid);

    // Process line items, stock increments, and transaction logging
    for (const item of validatedItems) {
      // 1. Insert line item
      db.run(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, item.product.id, item.quantity, item.unitCost, item.subtotal]
      );

      // 2. Increment stock and update cost price if new
      const newStock = item.product.quantity + item.quantity;
      const newStatus = calculateStatus(newStock, item.product.min_threshold);

      db.run(
        `UPDATE products SET
          quantity = ?,
          cost_price = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStock, item.unitCost, newStatus, item.product.id]
      );

      // 3. Record in audit trail
      db.run(
        `INSERT INTO inventory_transactions (
          product_id, user_id, type, quantity_change, previous_stock, new_stock, reference_id, reason
        ) VALUES (?, ?, 'PURCHASE', ?, ?, ?, ?, ?)`,
        [
          item.product.id,
          userId,
          item.quantity,
          item.product.quantity,
          newStock,
          poNumber,
          `Inbound Purchase from ${supplier.name}`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Purchase order ${poNumber} created and inventory updated successfully.`,
      purchaseId,
      poNumber,
      totalAmount
    });
  } catch (err) {
    console.error('createPurchase error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create purchase order.' });
  }
}

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase
};
