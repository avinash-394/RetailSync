const db = require('../database/db');

// GET /api/suppliers
function getSuppliers(req, res) {
  try {
    const suppliers = db.query(`
      SELECT
        s.*,
        COUNT(DISTINCT p.id) AS products_count,
        COALESCE(SUM(pur.total_amount), 0) AS total_purchased_amount,
        COUNT(DISTINCT pur.id) AS purchase_orders_count
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      LEFT JOIN purchases pur ON s.id = pur.supplier_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    return res.json({ success: true, suppliers });
  } catch (err) {
    console.error('getSuppliers error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving suppliers.' });
  }
}

// GET /api/suppliers/:id
function getSupplierById(req, res) {
  try {
    const { id } = req.params;
    const supplier = db.get('SELECT * FROM suppliers WHERE id = ?', [Number(id)]);

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const products = db.query(
      `SELECT id, sku, name, brand, cost_price, selling_price, quantity, status
       FROM products WHERE supplier_id = ? ORDER BY name ASC`,
      [Number(id)]
    );

    const purchases = db.query(
      `SELECT id, po_number, purchase_date, total_amount, status
       FROM purchases WHERE supplier_id = ? ORDER BY purchase_date DESC LIMIT 10`,
      [Number(id)]
    );

    return res.json({
      success: true,
      supplier: {
        ...supplier,
        products,
        purchases
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving supplier details.' });
  }
}

// POST /api/suppliers
function createSupplier(req, res) {
  try {
    const { name, contact_person, email, phone, address, status = 'ACTIVE' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier company name is required.' });
    }

    const result = db.run(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        contact_person ? contact_person.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        status || 'ACTIVE'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      supplierId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create supplier.' });
  }
}

// PUT /api/suppliers/:id
function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, status } = req.body;

    const existing = db.get('SELECT id FROM suppliers WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    db.run(
      `UPDATE suppliers SET
        name = COALESCE(?, name),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        contact_person ? contact_person.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        status || null,
        Number(id)
      ]
    );

    return res.json({ success: true, message: 'Supplier updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update supplier.' });
  }
}

// DELETE /api/suppliers/:id
function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT id, name FROM suppliers WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    // Set supplier_id to NULL on products before deleting to preserve products
    db.run('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?', [Number(id)]);
    db.run('DELETE FROM suppliers WHERE id = ?', [Number(id)]);

    return res.json({ success: true, message: `Supplier '${existing.name}' deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete supplier.' });
  }
}

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
