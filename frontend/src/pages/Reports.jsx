import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api';

export function Reports() {
  const [period, setPeriod] = useState('daily');
  const [salesReport, setSalesReport] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [salesRes, topRes] = await Promise.all([
        api.getSalesReport({ period, limit: 30 }),
        api.getTopSelling({ limit: 10 })
      ]);

      if (salesRes.success) setSalesReport(salesRes.report);
      if (topRes.success) setTopSelling(topRes.topSelling);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [period]);

  const totalRevenue = salesReport.reduce((acc, r) => acc + r.revenue, 0);
  const totalProfit = salesReport.reduce((acc, r) => acc + r.estimated_profit, 0);
  const totalUnits = salesReport.reduce((acc, r) => acc + r.units_sold, 0);

  const handleExportCSV = () => {
    if (salesReport.length === 0) return;
    const headers = ['Period', 'Total Orders', 'Gross Revenue (INR)', 'Units Sold', 'COGS (INR)', 'Estimated Profit (INR)'];
    const rows = salesReport.map((r) => [
      r.period_label,
      r.total_orders,
      r.revenue.toFixed(2),
      r.units_sold,
      r.cogs.toFixed(2),
      r.estimated_profit.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `retail_sales_report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Financial Reports & Analytics</h1>
          <p>Sales revenue aggregation, cost of goods sold (COGS), gross margin insights, and product demand curves</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CUMULATIVE GROSS REVENUE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Over selected reporting periods</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #4f46e5' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED GROSS PROFIT</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
            ₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Margin: <strong>{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL MERCHANDISE SOLD</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            {totalUnits.toLocaleString()} units
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across store catalog</div>
        </div>
      </div>

      {/* Revenue vs Profit Chart Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#4f46e5" />
            <span>Revenue vs Estimated Gross Profit (₹)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interval:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="daily">Daily Timeline</option>
              <option value="monthly">Monthly Timeline</option>
            </select>
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={salesReport}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString()}`]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Gross Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimated_profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products Leaderboard */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={18} color="#8b5cf6" />
            <span>Top Performing Products (Ranked by Sales Volume)</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top 10 Fast Movers</span>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product / SKU</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Retail Price</th>
                <th>Total Revenue (₹)</th>
                <th>Gross Profit (₹)</th>
                <th>In-Stock Balance</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.map((p, idx) => (
                <tr key={p.id}>
                  <td>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#fef3c7' : (idx === 1 ? '#f1f5f9' : (idx === 2 ? '#ffedd5' : '#f8fafc')),
                      color: idx === 0 ? '#d97706' : (idx === 1 ? '#475569' : (idx === 2 ? '#c2410c' : '#64748b')),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '12px'
                    }}>
                      {idx + 1}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.sku}</div>
                  </td>
                  <td>{p.category_name}</td>
                  <td>
                    <strong style={{ fontSize: '14px', color: '#4f46e5' }}>{p.total_quantity_sold}</strong>
                  </td>
                  <td>₹{p.selling_price.toFixed(2)}</td>
                  <td>
                    <strong>₹{p.total_revenue.toFixed(2)}</strong>
                  </td>
                  <td>
                    <strong style={{ color: '#059669' }}>₹{p.total_profit.toFixed(2)}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: p.current_stock <= 5 ? '#ef4444' : '#0f172a' }}>
                      {p.current_stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
