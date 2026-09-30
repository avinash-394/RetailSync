const db = require('../database/db');

// GET /api/reports/dashboard
function getDashboardStats(req, res) {
  try {
    // 1. Core inventory figures
    const inventoryStats = db.get(`
      SELECT
        COUNT(*) AS total_products,
        COALESCE(SUM(quantity), 0) AS total_stock,
        COALESCE(SUM(quantity * cost_price), 0) AS total_inventory_cost,
        COALESCE(SUM(quantity * selling_price), 0) AS total_retail_value,
        SUM(CASE WHEN status = 'LOW_STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count,
        SUM(CASE WHEN status = 'IN_STOCK' THEN 1 ELSE 0 END) AS in_stock_count
      FROM products
    `);

    // 2. Sales figures
    const salesStats = db.get(`
      SELECT
        COUNT(*) AS total_transactions,
        COALESCE(SUM(total_amount), 0) AS total_revenue
      FROM sales
    `);

    // 3. Purchase figures
    const purchaseStats = db.get(`
      SELECT
        COUNT(*) AS total_pos,
        COALESCE(SUM(total_amount), 0) AS total_purchase_spend
      FROM purchases
    `);

    // 4. Recent transactions (5)
    const recentTransactions = db.query(`
      SELECT
        it.*,
        p.name AS product_name,
        p.sku AS product_sku,
        u.name AS user_name
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      ORDER BY it.created_at DESC
      LIMIT 6
    `);

    // 5. Recent sales (5)
    const recentSales = db.query(`
      SELECT
        s.id,
        s.invoice_number,
        s.customer_name,
        s.total_amount,
        s.payment_method,
        s.sale_date,
        u.name AS cashier_name
      FROM sales s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.sale_date DESC
      LIMIT 5
    `);

    // 6. Last 7 days sales trend
    const salesTrend = db.query(`
      WITH RECURSIVE dates(date_val) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date_val, '+1 day')
        FROM dates
        WHERE date_val < date('now')
      )
      SELECT
        d.date_val AS date,
        COALESCE(SUM(s.total_amount), 0) AS revenue,
        COUNT(s.id) AS orders
      FROM dates d
      LEFT JOIN sales s ON date(s.sale_date) = d.date_val
      GROUP BY d.date_val
      ORDER BY d.date_val ASC
    `);

    // 7. Category inventory distribution
    const categoryDistribution = db.query(`
      SELECT
        c.name AS category,
        COUNT(p.id) AS product_count,
        COALESCE(SUM(p.quantity), 0) AS total_units,
        COALESCE(SUM(p.quantity * p.selling_price), 0) AS total_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      HAVING product_count > 0
      ORDER BY total_value DESC
    `);

    return res.json({
      success: true,
      data: {
        totalProducts: inventoryStats.total_products,
        totalStock: inventoryStats.total_stock,
        lowStockCount: inventoryStats.low_stock_count,
        outOfStockCount: inventoryStats.out_of_stock_count,
        inStockCount: inventoryStats.in_stock_count,
        totalRevenue: Number(salesStats.total_revenue.toFixed(2)),
        totalSalesCount: salesStats.total_transactions,
        totalPurchaseSpend: Number(purchaseStats.total_purchase_spend.toFixed(2)),
        totalInventoryCost: Number(inventoryStats.total_inventory_cost.toFixed(2)),
        totalRetailValue: Number(inventoryStats.total_retail_value.toFixed(2)),
        recentTransactions,
        recentSales,
        salesTrend,
        categoryDistribution
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard stats.' });
  }
}

// GET /api/reports/sales
function getSalesReport(req, res) {
  try {
    const { period = 'daily', limit = 30 } = req.query;

    let groupClause = "strftime('%Y-%m-%d', s.sale_date)";
    if (period === 'monthly') {
      groupClause = "strftime('%Y-%m', s.sale_date)";
    }

    const report = db.query(`
      SELECT
        ${groupClause} AS period_label,
        COUNT(DISTINCT s.id) AS total_orders,
        COALESCE(SUM(s.total_amount), 0) AS revenue,
        COALESCE(SUM(s.discount_amount), 0) AS total_discounts,
        COALESCE(SUM(si.quantity), 0) AS units_sold,
        COALESCE(SUM(si.quantity * p.cost_price), 0) AS cogs,
        COALESCE(SUM(si.subtotal - (si.quantity * p.cost_price)), 0) AS estimated_profit
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      GROUP BY period_label
      ORDER BY period_label DESC
      LIMIT ?
    `, [Number(limit)]);

    return res.json({ success: true, report: report.reverse() });
  } catch (err) {
    console.error('getSalesReport error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating sales report.' });
  }
}

// GET /api/reports/top-selling
function getTopSelling(req, res) {
  try {
    const { limit = 10 } = req.query;

    const topSelling = db.query(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.brand,
        c.name AS category_name,
        p.selling_price,
        p.quantity AS current_stock,
        COALESCE(SUM(si.quantity), 0) AS total_quantity_sold,
        COALESCE(SUM(si.subtotal), 0) AS total_revenue,
        COALESCE(SUM(si.subtotal - (si.quantity * p.cost_price)), 0) AS total_profit
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id
      ORDER BY total_quantity_sold DESC
      LIMIT ?
    `, [Number(limit)]);

    return res.json({ success: true, topSelling });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving top products.' });
  }
}

module.exports = {
  getDashboardStats,
  getSalesReport,
  getTopSelling
};
