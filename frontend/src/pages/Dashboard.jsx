import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../api';
import { KPICard } from '../components/KPICard';
import { Badge } from '../components/Badge';

const CATEGORY_COLORS = ['#4f46e5', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];

export function Dashboard({ onSelectTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading dashboard analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#fee2e2', borderRadius: '12px', color: '#991b1b' }}>
        Failed to load dashboard: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Store Performance Dashboard</h1>
          <p>Real-time retail inventory tracking, sales metrics, and replenishment status</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => onSelectTab('optimization')}
            style={{ gap: '6px' }}
          >
            <Sparkles size={16} color="#8b5cf6" />
            <span>Optimization Analysis</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSelectTab('sales')}
            style={{ gap: '6px' }}
          >
            <ShoppingCart size={16} />
            <span>New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Callout */}
      {(data.lowStockCount > 0 || data.outOfStockCount > 0) && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#92400e' }}>
                Inventory Replenishment Attention Required
              </div>
              <div style={{ fontSize: '13px', color: '#b45309' }}>
                <strong>{data.outOfStockCount}</strong> items currently out of stock and <strong>{data.lowStockCount}</strong> items below safety threshold.
              </div>
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onSelectTab('optimization')}
            style={{ gap: '6px', fontWeight: 700 }}
          >
            <span>Run Reorder Recommendation</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Total Catalog Products"
          value={data.totalProducts}
          subtext={`${data.inStockCount} items in healthy stock`}
          icon={Package}
          accentGradient="linear-gradient(90deg, #4f46e5, #8b5cf6)"
          iconBg="#e0e7ff"
          iconColor="#4f46e5"
        />
        <KPICard
          title="Total Stock Units"
          value={data.totalStock.toLocaleString()}
          subtext={`Valuation: ₹${data.totalInventoryCost.toLocaleString()}`}
          icon={Boxes}
          accentGradient="linear-gradient(90deg, #0ea5e9, #38bdf8)"
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard
          title="Low Stock Items"
          value={data.lowStockCount}
          subtext="Breached reorder point"
          icon={AlertTriangle}
          accentGradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <KPICard
          title="Out of Stock"
          value={data.outOfStockCount}
          subtext="Zero physical inventory"
          icon={XCircle}
          accentGradient="linear-gradient(90deg, #ef4444, #f87171)"
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        <KPICard
          title="Total Sales Revenue"
          value={`₹${data.totalRevenue.toLocaleString()}`}
          subtext={`${data.totalSalesCount} completed orders`}
          icon={IndianRupee}
          accentGradient="linear-gradient(90deg, #10b981, #34d399)"
          iconBg="#d1fae5"
          iconColor="#059669"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#4f46e5" />
              <span>7-Day Sales Trend (₹ Revenue)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Gross Turnover</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Boxes size={18} color="#8b5cf6" />
              <span>Inventory Value by Category (₹)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Retail Asset Distribution</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.categoryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <YAxis dataKey="category" type="category" width={140} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Value']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="total_value" radius={[0, 6, 6, 0]}>
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Grid: Recent Sales & Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Recent Sales Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShoppingCart size={18} color="#10b981" />
              <span>Recent POS Transactions</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onSelectTab('sales')}>
              View All
            </button>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {sale.invoice_number}
                      </span>
                    </td>
                    <td>{sale.customer_name}</td>
                    <td>
                      <strong>₹{sale.total_amount.toFixed(2)}</strong>
                    </td>
                    <td>
                      <Badge status={sale.payment_method} text={sale.payment_method} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} color="#0ea5e9" />
              <span>Recent Stock Audit Log</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onSelectTab('inventory')}>
              View Audit Log
            </button>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Balance</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.product_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.product_sku}</div>
                    </td>
                    <td>
                      <Badge status={tx.type} />
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: tx.quantity_change > 0 ? '#10b981' : '#ef4444'
                      }}>
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px' }}>{tx.new_stock}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {tx.reason || 'Routine movement'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
