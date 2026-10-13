
/**
 * Inventory Optimization Engine
 *
 * Implements deterministic inventory optimization algorithms tailored for retail stores.
 * Designed to be mathematically sound, transparent, and robust for production supply chain analysis.
 *
 * Key Concepts:
 * 1. Average Daily Sales (ADS) = Total units sold in window (e.g., 30 days) / Days
 * 2. Lead Time Demand (LTD) = ADS * Lead Time (days required for supplier to fulfill order)
 * 3. Safety Stock (SS) = Buffer stock to protect against supplier delays and demand spikes
 * 4. Reorder Point (ROP) = (ADS * Lead Time) + Safety Stock
 * 5. Velocity Classification = Fast-moving vs Slow-moving vs Dead stock
 */

const db = require('../database/db');

/**
 * Calculates optimization metrics for a given product or all products
 * @param {number} analysisDays - Window of historical sales to evaluate (default: 30 days)
 */
function calculateInventoryOptimization(analysisDays = 30) {
  // 1. Fetch all products with supplier and category info
  const products = db.query(`
    SELECT
      p.id,
      p.sku,
      p.name,
      p.brand,
      p.unit,
      p.cost_price,
      p.selling_price,
      p.quantity AS current_stock,
      p.min_threshold AS safety_stock,
      p.lead_time_days,
      p.status,
      c.name AS category_name,
      s.name AS supplier_name,
      s.email AS supplier_email,
      s.phone AS supplier_phone
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.name ASC
  `);

  // 2. Fetch sales summary for each product in the past analysisDays
  const salesSummary = db.query(`
    SELECT
      si.product_id,
      SUM(si.quantity) AS total_units_sold,
      COUNT(DISTINCT s.id) AS transaction_count,
      SUM(si.subtotal) AS total_revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.sale_date >= datetime('now', '-' || ? || ' days')
    GROUP BY si.product_id
  `, [analysisDays]);

  const salesMap = {};
  salesSummary.forEach(row => {
    salesMap[row.product_id] = {
      unitsSold: Number(row.total_units_sold || 0),
      transactions: Number(row.transaction_count || 0),
      revenue: Number(row.total_revenue || 0)
    };
  });

  // 3. Perform optimization calculations for each product
  const results = products.map(prod => {
    const saleInfo = salesMap[prod.id] || { unitsSold: 0, transactions: 0, revenue: 0 };
    const unitsSold = saleInfo.unitsSold;

    // Average Daily Sales (ADS)
    const averageDailySales = Number((unitsSold / analysisDays).toFixed(2));

    // Lead Time Demand (LTD) = ADS * Lead Time
    const leadTime = prod.lead_time_days || 5;
    const leadTimeDemand = Number((averageDailySales * leadTime).toFixed(2));

    // Safety Stock (SS)
    const safetyStock = prod.safety_stock || 10;

    // Reorder Point (ROP) = (ADS * Lead Time) + Safety Stock
    const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

    const currentStock = prod.current_stock;

    // Days of Inventory Remaining (Runway)
    let daysOfInventory = 999;
    if (averageDailySales > 0) {
      daysOfInventory = Math.floor(currentStock / averageDailySales);
    } else if (currentStock === 0) {
      daysOfInventory = 0;
    }

    // Velocity Classification
    let velocity = 'NORMAL_MOVING';
    if (unitsSold >= 25 || averageDailySales >= 0.8) {
      velocity = 'FAST_MOVING';
    } else if (unitsSold <= 2) {
      velocity = 'SLOW_MOVING';
    }

    // Reorder Recommendation
    const isReorderNeeded = currentStock <= reorderPoint;
    const isOutOfStock = currentStock <= 0;

    // Target Max Inventory (Coverage for Lead Time + 14 days of sales cycle + Safety Stock)
    const cycleStock = Math.ceil(averageDailySales * 14);
    const targetMaxStock = Math.max(reorderPoint + 10, reorderPoint + cycleStock);

    // Recommended Order Quantity
    const suggestedReorderQuantity = isReorderNeeded
      ? Math.max(0, targetMaxStock - currentStock)
      : 0;

    // Financial impact
    const capitalTiedUp = Number((currentStock * prod.cost_price).toFixed(2));
    const estimatedReorderCost = Number((suggestedReorderQuantity * prod.cost_price).toFixed(2));

    return {
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      category: prod.category_name || 'Uncategorized',
      supplier: prod.supplier_name || 'No Supplier',
      supplierEmail: prod.supplier_email,
      supplierPhone: prod.supplier_phone,
      costPrice: prod.cost_price,
      sellingPrice: prod.selling_price,
      currentStock,
      leadTimeDays: leadTime,
      safetyStock,
      unitsSoldPast30d: unitsSold,
      averageDailySales,
      leadTimeDemand,
      reorderPoint,
      daysOfInventory,
      velocity,
      isReorderNeeded,
      isOutOfStock,
      targetMaxStock,
      suggestedReorderQuantity,
      capitalTiedUp,
      estimatedReorderCost,
      status: isOutOfStock ? 'OUT_OF_STOCK' : (isReorderNeeded ? 'LOW_STOCK' : 'IN_STOCK')
    };
  });

  // Calculate executive summary metrics
  const summary = {
    totalEvaluated: results.length,
    reorderRequiredCount: results.filter(r => r.isReorderNeeded).length,
    outOfStockCount: results.filter(r => r.isOutOfStock).length,
    fastMovingCount: results.filter(r => r.velocity === 'FAST_MOVING').length,
    slowMovingCount: results.filter(r => r.velocity === 'SLOW_MOVING').length,
    totalWorkingCapitalTiedUp: Number(results.reduce((acc, r) => acc + r.capitalTiedUp, 0).toFixed(2)),
    estimatedRestockInvestment: Number(results.filter(r => r.isReorderNeeded).reduce((acc, r) => acc + r.estimatedReorderCost, 0).toFixed(2)),
    formulaReference: {
      ropFormula: 'Reorder Point (ROP) = (Average Daily Sales × Lead Time) + Safety Stock',
      adsFormula: 'Average Daily Sales (ADS) = Units Sold in 30 Days / 30',
      runwayFormula: 'Runway Days = Current Stock / Average Daily Sales',
      reorderQtyFormula: 'Recommended Quantity = Target Max Stock - Current Stock'
    }
  };

  return {
    summary,
    products: results
  };
}

module.exports = {
  calculateInventoryOptimization
};
