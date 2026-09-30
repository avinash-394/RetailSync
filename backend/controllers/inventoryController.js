const db = require('../database/db');
const { calculateStatus } = require('./productController');

// GET /api/inventory/overview
function getInventoryOverview(req, res) {
  try {
    const stats = db.get(`
      SELECT
        COUNT(*) AS total_skus,
        COALESCE(SUM(quantity), 0) AS total_units,
        COALESCE(SUM(quantity * cost_price), 0) AS total_inventory_cost,
        COALESCE(SUM(quantity * selling_price), 0) AS total_retail_value,
        SUM(CASE WHEN status = 'LOW_STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count,
        SUM(CASE WHEN status = 'IN_STOCK' THEN 1 ELSE 0 END) AS healthy_stock_count
      FROM products
    `);

    return res.json({
      success: true,
      stats: {
        totalSkus: stats.total_skus,
        totalUnits: stats.total_units,
        totalCostValue: Number(stats.total_inventory_cost.toFixed(2)),
        totalRetailValue: Number(stats.total_retail_value.toFixed(2)),
        potentialProfit: Number((stats.total_retail_value - stats.total_inventory_cost).toFixed(2)),
        lowStockCount: stats.low_stock_count,
        outOfStockCount: stats.out_of_stock_count,
        healthyStockCount: stats.healthy_stock_count
      }
    });
  } catch (err) {
    console.error('getInventoryOverview error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving inventory stats.' });
  }
}

// POST /api/inventory/adjust
// Stock-in or Stock-out adjustment with audit logging
function adjustStock(req, res) {
  try {
    const { product_id, type, quantity, reason, notes } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, adjustment type (ADJUSTMENT_IN or ADJUSTMENT_OUT), and quantity are required.'
      });
    }

    const adjustQty = Number(quantity);
    if (isNaN(adjustQty) || adjustQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    }

    const product = db.get('SELECT * FROM products WHERE id = ?', [Number(product_id)]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let qtyChange = 0;
    let newQty = 0;

    if (type === 'ADJUSTMENT_IN' || type === 'RETURN') {
      qtyChange = adjustQty;
      newQty = product.quantity + adjustQty;
    } else if (type === 'ADJUSTMENT_OUT' || type === 'DAMAGE' || type === 'EXPIRED') {
      if (product.quantity < adjustQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Current stock is ${product.quantity}, cannot deduct ${adjustQty}.`
        });
      }
      qtyChange = -adjustQty;
      newQty = product.quantity - adjustQty;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type.' });
    }

    const newStatus = calculateStatus(newQty, product.min_threshold);
    const refId = `ADJ-${Date.now().toString().slice(-6)}`;

    // Perform DB updates
    db.run(
      `UPDATE products SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newQty, newStatus, product.id]
    );

    db.run(
      `INSERT INTO inventory_transactions (
        product_id, user_id, type, quantity_change, previous_stock, new_stock, reference_id, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        req.user?.id || null,
        type.startsWith('ADJUSTMENT') ? type : `ADJUSTMENT_${type === 'DAMAGE' || type === 'EXPIRED' ? 'OUT' : 'IN'}`,
        qtyChange,
        product.quantity,
        newQty,
        refId,
        reason ? `${reason}${notes ? ' - ' + notes : ''}` : notes || 'Manual Stock Adjustment'
      ]
    );

    return res.json({
      success: true,
      message: `Stock successfully adjusted for '${product.name}'.`,
      previousStock: product.quantity,
      newStock: newQty,
      status: newStatus
    });
  } catch (err) {
    console.error('adjustStock error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust stock.' });
  }
}

// GET /api/inventory/transactions
function getTransactions(req, res) {
  try {
    const {
      product_id,
      type,
      page = 1,
      limit = 50
    } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (product_id) {
      conditions.push('it.product_id = ?');
      params.push(Number(product_id));
    }

    if (type) {
      conditions.push('it.type = ?');
      params.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = db.get(
      `SELECT COUNT(*) as total FROM inventory_transactions it WHERE ${whereClause}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    const offset = (Number(page) - 1) * Number(limit);

    const querySql = `
      SELECT
        it.*,
        p.name AS product_name,
        p.sku AS product_sku,
        u.name AS user_name
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      WHERE ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = db.query(querySql, [...params, Number(limit), offset]);

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      transactions
    });
  } catch (err) {
    console.error('getTransactions error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving inventory transactions.' });
  }
}

module.exports = {
  getInventoryOverview,
  adjustStock,
  getTransactions
};
