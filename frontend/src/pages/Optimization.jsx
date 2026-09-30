import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  Clock,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  ShoppingBag,
  Info
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function Optimization({ onSelectTab }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('REORDER'); // ALL, REORDER, OUT_OF_STOCK, FAST, SLOW
  const [analysisDays, setAnalysisDays] = useState(30);

  // Auto PO Modal
  const [isAutoPOOpen, setIsAutoPOOpen] = useState(false);
  const [poProposal, setPOProposal] = useState(null);
  const [poError, setPoError] = useState('');
  const [poSuccess, setPoSuccess] = useState('');

  const loadOptimization = async () => {
    try {
      setLoading(true);
      const res = await api.getOptimizationAnalysis(analysisDays);
      if (res.success) {
        setAnalysis(res);
      }
    } catch (err) {
      console.error('Failed to load optimization metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptimization();
  }, [analysisDays]);

  const handleCreateAutoPO = async (supplierId) => {
    try {
      setPoError('');
      setPoSuccess('');
      const res = await api.autoGeneratePO({ supplier_id: supplierId });
      if (res.success) {
        setPOProposal(res);
        setIsAutoPOOpen(true);
      }
    } catch (err) {
      alert('Cannot generate PO proposal: ' + err.message);
    }
  };

  const handleConfirmAutoPO = async () => {
    if (!poProposal) return;
    try {
      const res = await api.createPurchase({
        supplier_id: poProposal.supplier.id,
        items: poProposal.items,
        notes: 'Generated via Inventory Optimization Engine recommendations'
      });
      setPoSuccess(res.message);
      setTimeout(() => {
        setIsAutoPOOpen(false);
        loadOptimization();
      }, 700);
    } catch (err) {
      setPoError(err.message || 'Failed to place auto purchase order.');
    }
  };

  if (loading && !analysis) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <Calculator size={36} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Executing Deterministic Optimization Algorithms...</div>
      </div>
    );
  }

  const { summary, products = [] } = analysis || {};

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'REORDER') return p.isReorderNeeded;
    if (activeFilter === 'OUT_OF_STOCK') return p.isOutOfStock;
    if (activeFilter === 'FAST') return p.velocity === 'FAST_MOVING';
    if (activeFilter === 'SLOW') return p.velocity === 'SLOW_MOVING';
    return true; // ALL
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Inventory Optimization Engine</h1>
            <span className="badge badge-purple">Viva Ready</span>
          </div>
          <p>Deterministic mathematical replenishment models, Reorder Point (ROP) tracking, and sales velocity classification</p>
        </div>

        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Historical Window:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={analysisDays}
              onChange={(e) => setAnalysisDays(Number(e.target.value))}
            >
              <option value="15">Last 15 Days</option>
              <option value="30">Last 30 Days (Standard)</option>
              <option value="60">Last 60 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formula Presentation Box for Viva & Project Evaluation */}
      <div className="formula-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Sparkles size={22} color="#a5b4fc" />
          <h2>Mathematical Optimization Model (Viva Explainer)</h2>
        </div>
        <p>
          To eliminate stockouts and avoid excess working capital lock-up, the system continuously evaluates each product's sales velocity against supplier fulfillment latency:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
          marginTop: '16px'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c7d2fe', fontWeight: 700 }}>1. Average Daily Sales (ADS)</div>
            <div className="formula-highlight">ADS = Units Sold in N Days / N</div>
            <div style={{ fontSize: '12px', color: '#e0e7ff', marginTop: '4px' }}>
              Calculates daily velocity rate from verified POS transactions.
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c7d2fe', fontWeight: 700 }}>2. Reorder Point (ROP)</div>
            <div className="formula-highlight">ROP = (ADS × Lead Time) + Safety Stock</div>
            <div style={{ fontSize: '12px', color: '#e0e7ff', marginTop: '4px' }}>
              When <code>Current Stock &le; ROP</code>, system flags <strong>Reorder Required</strong>.
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c7d2fe', fontWeight: 700 }}>3. Restock Target Level</div>
            <div className="formula-highlight">Order Qty = Target Max Stock - Current Stock</div>
            <div style={{ fontSize: '12px', color: '#e0e7ff', marginTop: '4px' }}>
              Buffers for supplier lead time + 14-day operational sales cycle.
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div
            className="card"
            style={{
              padding: '16px',
              borderTop: '4px solid #f59e0b',
              cursor: 'pointer',
              backgroundColor: activeFilter === 'REORDER' ? '#fffbeb' : '#ffffff'
            }}
            onClick={() => setActiveFilter('REORDER')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>REORDER REQUIRED</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {summary.reorderRequiredCount} SKUs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Est. Restock: <strong>₹{summary.estimatedRestockInvestment.toLocaleString()}</strong>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px',
              borderTop: '4px solid #ef4444',
              cursor: 'pointer',
              backgroundColor: activeFilter === 'OUT_OF_STOCK' ? '#fee2e2' : '#ffffff'
            }}
            onClick={() => setActiveFilter('OUT_OF_STOCK')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ZERO STOCK (CRITICAL)</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {summary.outOfStockCount} SKUs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stockout recovery priority</div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px',
              borderTop: '4px solid #8b5cf6',
              cursor: 'pointer',
              backgroundColor: activeFilter === 'FAST' ? '#ede9fe' : '#ffffff'
            }}
            onClick={() => setActiveFilter('FAST')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>FAST-MOVING RUNNERS</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
              {summary.fastMovingCount} SKUs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>High velocity sales driver</div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px',
              borderTop: '4px solid #64748b',
              cursor: 'pointer',
              backgroundColor: activeFilter === 'SLOW' ? '#f1f5f9' : '#ffffff'
            }}
            onClick={() => setActiveFilter('SLOW')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SLOW-MOVING (TIED CAPITAL)</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#64748b', marginTop: '4px' }}>
              {summary.slowMovingCount} SKUs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Potential markdown candidates</div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px',
              borderTop: '4px solid #4f46e5',
              cursor: 'pointer',
              backgroundColor: activeFilter === 'ALL' ? '#e0e7ff' : '#ffffff'
            }}
            onClick={() => setActiveFilter('ALL')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL CATALOG AUDITED</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
              {summary.totalEvaluated} SKUs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Capital: <strong>₹{summary.totalWorkingCapitalTiedUp.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeFilter === 'REORDER' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('REORDER')}
        >
          <AlertTriangle size={14} />
          <span>Reorder Required ({summary?.reorderRequiredCount || 0})</span>
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'OUT_OF_STOCK' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('OUT_OF_STOCK')}
        >
          <ShieldAlert size={14} />
          <span>Out of Stock ({summary?.outOfStockCount || 0})</span>
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'FAST' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('FAST')}
        >
          <Zap size={14} />
          <span>Fast Moving ({summary?.fastMovingCount || 0})</span>
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'SLOW' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('SLOW')}
        >
          <Clock size={14} />
          <span>Slow Moving ({summary?.slowMovingCount || 0})</span>
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('ALL')}
        >
          <span>All Analyzed Products ({summary?.totalEvaluated || 0})</span>
        </button>
      </div>

      {/* Optimization Matrix Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Specification</th>
              <th>Current Stock</th>
              <th>Avg Daily Sales (ADS)</th>
              <th>Lead Time</th>
              <th>Safety Stock</th>
              <th>Computed ROP</th>
              <th>Formula Breakdown</th>
              <th>Velocity</th>
              <th>Recommended Order</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No products match the selected optimization filter.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.productId} style={{ backgroundColor: p.isOutOfStock ? '#fff5f5' : (p.isReorderNeeded ? '#fffdf5' : 'inherit') }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      SKU: <strong style={{ fontFamily: 'monospace' }}>{p.sku}</strong> &bull; Vendor: {p.supplier}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '14px',
                      color: p.isOutOfStock ? '#ef4444' : (p.isReorderNeeded ? '#d97706' : '#10b981')
                    }}>
                      {p.currentStock}
                    </span>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {p.daysOfInventory >= 999 ? 'No sales' : `${p.daysOfInventory} days runway`}
                    </div>
                  </td>
                  <td>
                    <strong>{p.averageDailySales}</strong> /day
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {p.unitsSoldPast30d} sold in 30d
                    </div>
                  </td>
                  <td>{p.leadTimeDays} days</td>
                  <td>{p.safetyStock} units</td>
                  <td>
                    <strong style={{ fontSize: '15px', color: p.isReorderNeeded ? '#d97706' : '#0f172a' }}>
                      {p.reorderPoint} units
                    </strong>
                  </td>
                  <td>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      backgroundColor: '#f1f5f9',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      ({p.averageDailySales} × {p.leadTimeDays}) + {p.safetyStock} = {p.reorderPoint}
                    </div>
                  </td>
                  <td>
                    <Badge status={p.velocity} />
                  </td>
                  <td>
                    {p.isReorderNeeded ? (
                      <div>
                        <strong style={{ color: '#2563eb', fontSize: '14px' }}>
                          +{p.suggestedReorderQuantity} units
                        </strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ₹{p.estimatedReorderCost.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                        Optimal Stock
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.isReorderNeeded ? (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          // Find supplier and trigger auto PO
                          onSelectTab('purchases');
                        }}
                        style={{ gap: '4px', fontWeight: 700 }}
                      >
                        <ShoppingBag size={13} />
                        <span>Restock</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Sufficient</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
