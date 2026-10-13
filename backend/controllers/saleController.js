const db = require('../database/db');
const { calculateStatus } = require('./productController');

// GET /api/sales
function getSales(req, res) {
  try {
    const { page = 1, limit = 50, q, payment_method, start_date, end_date } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (q) {
      conditions.push('(s.invoice_number LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (payment_method) {
      conditions.push('s.payment_method = ?');
      params.push(payment_method);
    }

    if (start_date) {
      conditions.push('date(s.sale_date) >= date(?)');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('date(s.sale_date) <= date(?)');
      params.push(end_date);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = db.get(`SELECT COUNT(*) as total FROM sales s WHERE ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    const offset = (Number(page) - 1) * Number(limit);

    const sales = db.query(
      `SELECT
        s.*,
        u.name AS cashier_name,
        COUNT(si.id) AS item_count,
        COALESCE(SUM(si.quantity), 0) AS total_units_sold
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE ${whereClause}
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      sales
    });
  } catch (err) {
    console.error('getSales error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving sales.' });
  }
}

// GET /api/sales/:id (Invoice / Receipt view)
function getSaleById(req, res) {
  try {
    const { id } = req.params;

    const sale = db.get(
      `SELECT
        s.*,
        u.name AS cashier_name,
        u.email AS cashier_email
      FROM sales s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?`,
      [Number(id)]
    );

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found.' });
    }

    const items = db.query(
      `SELECT
        si.*,
        pr.name AS product_name,
        pr.sku AS product_sku,
        pr.unit AS product_unit
      FROM sale_items si
      JOIN products pr ON si.product_id = pr.id
      WHERE si.sale_id = ?`,
      [Number(id)]
    );

    return res.json({
      success: true,
      sale: {
        ...sale,
        items,
        storeInfo: {
          name: 'Apex Retail Mart',
          address: '42 Tech Park Avenue, Knowledge City, Bangalore, India',
          phone: '+91 98765 43210',
          gstin: '29ABCDE1234F1Z5',
          email: 'support@apexretail.in'
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving sale invoice.' });
  }
}

// POST /api/sales (New Checkout / Sale)
function createSale(req, res) {
  try {
    const {
      customer_name = 'Walk-in Customer',
      customer_phone,
      payment_method = 'CASH',
      discount_amount = 0,
      tax_amount = 0,
      items,
      notes,
      sale_date
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product item is required to complete a sale.'
      });
    }

    // Validate inventory and prepare items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.get('SELECT * FROM products WHERE id = ?', [Number(item.product_id)]);
      if (!prod) {
        return res.status(404).json({
          success: false,
          message: `Product ID ${item.product_id} not found.`
        });
      }

      const requestedQty = Number(item.quantity);
      if (requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product ${prod.name}.`
        });
      }

      // Strict stock availability check
      if (prod.quantity < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${prod.name}'. In stock: ${prod.quantity}, Requested: ${requestedQty}.`
        });
      }

      const unitPrice = Number(item.unit_price !== undefined ? item.unit_price : prod.selling_price);
      const itemSubtotal = Number((requestedQty * unitPrice).toFixed(2));
      subtotal += itemSubtotal;

      validatedItems.push({
        product: prod,
        quantity: requestedQty,
        unitPrice,
        subtotal: itemSubtotal
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const discount = Math.max(0, Number(discount_amount) || 0);
    const tax = Math.max(0, Number(tax_amount) || 0);
    const totalAmount = Number(Math.max(0, subtotal - discount + tax).toFixed(2));

    // Generate Invoice Number (e.g. INV-2026-XXXX)
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}${randomSuffix}`;
    const userId = req.user?.id || 1;

    // Insert Sale record
    const insertSale = db.run(
      `INSERT INTO sales (
        invoice_number, user_id, customer_name, customer_phone,
        sale_date, subtotal, tax_amount, discount_amount, total_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        userId,
        customer_name.trim(),
        customer_phone ? customer_phone.trim() : null,
        sale_date || null,
        subtotal,
        tax,
        discount,
        totalAmount,
        payment_method.toUpperCase(),
        notes || null
      ]
    );

    const saleId = Number(insertSale.lastInsertRowid);

    // Process line items, stock decrements, and transaction logging
    for (const item of validatedItems) {
      // 1. Insert line item
      db.run(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product.id, item.quantity, item.unitPrice, item.subtotal]
      );

      // 2. Decrement stock
      const newStock = item.product.quantity - item.quantity;
      const newStatus = calculateStatus(newStock, item.product.min_threshold);

      db.run(
        `UPDATE products SET
          quantity = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStock, newStatus, item.product.id]
      );

      // 3. Record in audit trail
      db.run(
        `INSERT INTO inventory_transactions (
          product_id, user_id, type, quantity_change, previous_stock, new_stock, reference_id, reason
        ) VALUES (?, ?, 'SALE', ?, ?, ?, ?, ?)`,
        [
          item.product.id,
          userId,
          -item.quantity,
          item.product.quantity,
          newStock,
          invoiceNumber,
          `Customer Sale to ${customer_name}`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Sale completed successfully. Invoice: ${invoiceNumber}`,
      saleId,
      invoiceNumber,
      totalAmount
    });
  } catch (err) {
    console.error('createSale error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record sale.' });
  }
}

// DELETE /api/sales/all (Admin only)
function deleteAllSales(req, res) {
  try {
    db.exec(`
      DELETE FROM sale_items;
      DELETE FROM sales;
      DELETE FROM inventory_transactions WHERE type = 'SALE';
    `);
    return res.json({ success: true, message: 'All sales transactions and invoices deleted successfully.' });
  } catch (err) {
    console.error('deleteAllSales error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete all sales.' });
  }
}

module.exports = {
  getSales,
  getSaleById,
  createSale,
  deleteAllSales
};

