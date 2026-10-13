import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Search,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Inventory() {
  const { isAdmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    type: 'ADJUSTMENT_IN',
    quantity: '',
    reason: 'Stock replenishment adjustment',
    notes: ''
  });
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [overRes, txRes, prodRes] = await Promise.all([
        api.getInventoryOverview(),
        api.getTransactions({
          type: typeFilter,
          product_id: productFilter,
          limit: 100
        }),
        api.getProducts({ limit: 150 })
      ]);

      if (overRes.success) setOverview(overRes.stats);
      if (txRes.success) setTransactions(txRes.transactions);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [typeFilter, productFilter]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccess('');

    try {
      const res = await api.adjustStock(adjustForm);
      setAdjustSuccess(res.message || 'Stock adjusted successfully.');
      setTimeout(() => {
        setIsAdjustModalOpen(false);
        setAdjustForm({
          product_id: '',
          type: 'ADJUSTMENT_IN',
          quantity: '',
          reason: 'Stock replenishment adjustment',
          notes: ''
        });
        loadInventoryData();
      }, 600);
    } catch (err) {
      setAdjustError(err.message || 'Failed to adjust stock.');
    }
  };

  // Filter transactions by product name / sku locally as well
  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.product_name.toLowerCase().includes(term) ||
      t.product_sku.toLowerCase().includes(term) ||
      (t.reference_id && t.reference_id.toLowerCase().includes(term))
    );
  });

  const handleClearAuditLog = async () => {
    if (!window.confirm("⚠️ CAUTION: Are you sure you want to clear the entire inventory audit log history?")) return;
    try {
      await api.clearTransactions();
      loadInventoryData();
    } catch (err) {
      alert('Failed to clear audit log: ' + err.message);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("🔄 Restore factory demo dataset? This will regenerate the full realistic retail catalog with 21 products, 4 suppliers, and 28 sales.")) return;
    try {
      await api.resetDemoData();
      loadInventoryData();
    } catch (err) {
      alert('Failed to reset demo data: ' + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Inventory & Audit Trail</h1>
          <p>Real-time stock balance, manual warehouse adjustments, and end-to-end transaction logging</p>
        </div>
        <div className="page-header-actions">
          {isAdmin && (
            <>
              <button
                className="btn btn-outline"
                onClick={handleResetDemo}
                style={{ color: '#4f46e5', borderColor: '#c7d2fe' }}
                title="Restore full demo dataset"
              >
                <RotateCcw size={15} />
                <span>Restore Demo Data</span>
              </button>
              {transactions.length > 0 && (
                <button
                  className="btn btn-outline"
                  onClick={handleClearAuditLog}
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                >
                  <Trash2 size={15} />
                  <span>Clear Audit Log</span>
                </button>
              )}
            </>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              setAdjustError('');
              setAdjustSuccess('');
              setIsAdjustModalOpen(true);
            }}
          >
            <Sliders size={16} />
            <span>Stock Adjustment (In/Out)</span>
          </button>
        </div>
      </div>

      {/* Inventory Health Cards */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Healthy SKUs</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{overview.healthyStockCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Above safety stock</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock SKUs</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{overview.lowStockCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reorder point triggered</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stockouts</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{overview.outOfStockCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lost sales risk</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #4f46e5' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capital in Stock</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>₹{overview.totalCostValue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total acquisition cost</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retail Asset Value</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>₹{overview.totalRetailValue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#10b981' }}>+₹{overview.potentialProfit.toLocaleString()} profit potential</div>
          </div>
        </div>
      )}

      {/* Audit Log Header & Filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by SKU, Product Name, or Ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Movement Types</option>
            <option value="PURCHASE">Purchases (Stock In)</option>
            <option value="SALE">Sales (Stock Out)</option>
            <option value="ADJUSTMENT_IN">Manual Adjustment (In)</option>
            <option value="ADJUSTMENT_OUT">Manual Adjustment (Out)</option>
            <option value="RETURN">Customer Return</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product / SKU</th>
              <th>Movement Type</th>
              <th>Quantity Change</th>
              <th>Prev Stock</th>
              <th>New Balance</th>
              <th>Reference ID</th>
              <th>Operator / Cashier</th>
              <th>Audit Reason / Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading audit log...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No stock transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tx.product_name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {tx.product_sku}
                    </div>
                  </td>
                  <td>
                    <Badge status={tx.type} />
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '14px',
                      color: tx.quantity_change > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{tx.previous_stock}</td>
                  <td>
                    <strong style={{ color: tx.new_stock <= 5 ? '#ef4444' : '#0f172a' }}>
                      {tx.new_stock}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {tx.reference_id || 'N/A'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px' }}>{tx.user_name || 'System Auto'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    {tx.reason || 'Routine movement'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment Entry (Stock-In / Stock-Out)"
        maxWidth="600px"
      >
        {adjustError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {adjustError}
          </div>
        )}
        {adjustSuccess && (
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {adjustSuccess}
          </div>
        )}

        <form onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              required
              className="form-select"
              value={adjustForm.product_id}
              onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
            >
              <option value="">Choose product to adjust...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Current Stock: {p.quantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Adjustment Type *</label>
              <select
                className="form-select"
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
              >
                <option value="ADJUSTMENT_IN">Stock In (Add to Inventory)</option>
                <option value="ADJUSTMENT_OUT">Stock Out (Deduct from Inventory)</option>
                <option value="DAMAGE">Damaged / Defective (Deduct)</option>
                <option value="EXPIRED">Expired Stock (Deduct)</option>
                <option value="RETURN">Customer Return (Add)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Units *</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                placeholder="e.g. 5"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Justification</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Physical inventory audit discrepancy, broken seal..."
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Audit Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Verified by Store Supervisor"
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Post Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
