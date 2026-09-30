const { calculateInventoryOptimization } = require('../utils/optimizationEngine');
const db = require('../database/db');

// GET /api/optimization/analysis
function getOptimizationAnalysis(req, res) {
  try {
    const days = Number(req.query.days) || 30;
    const analysis = calculateInventoryOptimization(days);
    return res.json({ success: true, ...analysis });
  } catch (err) {
    console.error('getOptimizationAnalysis error:', err);
    return res.status(500).json({ success: false, message: 'Server error during optimization analysis.' });
  }
}

// GET /api/optimization/reorders
// Returns products that have breached their Reorder Point (ROP)
function getReorderAlerts(req, res) {
  try {
    const days = Number(req.query.days) || 30;
    const analysis = calculateInventoryOptimization(days);
    const reorders = analysis.products.filter(p => p.isReorderNeeded);

    return res.json({
      success: true,
      count: reorders.length,
      estimatedCost: Number(reorders.reduce((acc, p) => acc + p.estimatedReorderCost, 0).toFixed(2)),
      reorders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving reorder alerts.' });
  }
}

// POST /api/optimization/auto-po
// Automatically generates a purchase order from reorder recommendations for a specific supplier
function autoGeneratePO(req, res) {
  try {
    const { supplier_id, product_ids } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ success: false, message: 'Supplier ID is required.' });
    }

    const supplier = db.get('SELECT id, name FROM suppliers WHERE id = ?', [Number(supplier_id)]);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const analysis = calculateInventoryOptimization(30);

    // Filter products for this supplier that need reorder (or matching requested IDs)
    const candidates = analysis.products.filter(p => {
      if (product_ids && Array.isArray(product_ids)) {
        return product_ids.includes(p.productId);
      }
      return p.isReorderNeeded;
    });

    // Check which candidates belong to this supplier
    const supplierProducts = candidates.filter(c => {
      const prod = db.get('SELECT supplier_id FROM products WHERE id = ?', [c.productId]);
      return prod && prod.supplier_id === Number(supplier_id);
    });

    if (supplierProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recommended reorders found for this supplier.'
      });
    }

    // Build PO items
    const items = supplierProducts.map(p => ({
      product_id: p.productId,
      quantity: Math.max(1, p.suggestedReorderQuantity),
      unit_cost: p.costPrice
    }));

    return res.json({
      success: true,
      message: `Generated purchase proposal with ${items.length} items for ${supplier.name}.`,
      supplier,
      items,
      estimatedTotal: Number(items.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0).toFixed(2))
    });
  } catch (err) {
    console.error('autoGeneratePO error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate auto PO.' });
  }
}

module.exports = {
  getOptimizationAnalysis,
  getReorderAlerts,
  autoGeneratePO
};
