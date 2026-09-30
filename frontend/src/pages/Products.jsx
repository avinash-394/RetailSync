import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewProductDetails, setViewProductDetails] = useState(null);

  // Form State
  const initialForm = {
    sku: '',
    name: '',
    category_id: '',
    supplier_id: '',
    brand: '',
    unit: 'pcs',
    cost_price: '',
    selling_price: '',
    quantity: '',
    min_threshold: 10,
    lead_time_days: 5
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Load products & categories & suppliers
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, supRes] = await Promise.all([
        api.getProducts({
          q: search,
          category_id: selectedCategory,
          status: selectedStatus,
          sort_by: sortBy,
          order: sortOrder,
          limit: 100
        }),
        api.getCategories(),
        api.getSuppliers()
      ]);

      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
      if (supRes.success) setSuppliers(supRes.suppliers);
    } catch (err) {
      console.error('Failed to load products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setFormData(initialForm);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setSelectedProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category_id: p.category_id || '',
      supplier_id: p.supplier_id || '',
      brand: p.brand || '',
      unit: p.unit || 'pcs',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      min_threshold: p.min_threshold,
      lead_time_days: p.lead_time_days
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = async (id) => {
    try {
      const res = await api.getProductById(id);
      if (res.success) {
        setViewProductDetails(res.product);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching details: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      if (selectedProduct) {
        // Edit mode
        await api.updateProduct(selectedProduct.id, formData);
        setFormSuccess('Product updated successfully!');
      } else {
        // Create mode
        await api.createProduct(formData);
        setFormSuccess('Product created successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        loadData();
      }, 500);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product '${name}'?`)) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Maintain SKU specifications, retail pricing, supplier links, and minimum thresholds</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          {/* Live Search */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by SKU, Product Name, or Brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.product_count || 0})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [col, ord] = e.target.value.split('-');
              setSortBy(col);
              setSortOrder(ord);
            }}
          >
            <option value="created_at-DESC">Newest First</option>
            <option value="name-ASC">Name (A-Z)</option>
            <option value="selling_price-ASC">Price (Low to High)</option>
            <option value="selling_price-DESC">Price (High to Low)</option>
            <option value="quantity-ASC">Stock (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU / Code</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Cost (₹)</th>
              <th>Retail (₹)</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Lead Time</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading catalog products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No matching products found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {p.sku}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {p.brand ? `${p.brand} • ` : ''}Supplier: {p.supplier_name || 'Direct'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>
                      {p.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td>₹{p.cost_price.toFixed(2)}</td>
                  <td>
                    <strong>₹{p.selling_price.toFixed(2)}</strong>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: p.quantity === 0 ? '#ef4444' : (p.quantity <= p.min_threshold ? '#d97706' : '#0f172a')
                    }}>
                      {p.quantity} {p.unit}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.min_threshold} {p.unit}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.lead_time_days} days</td>
                  <td>
                    <Badge status={p.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-outline btn-icon"
                        title="View Audit Details"
                        onClick={() => handleOpenViewModal(p.id)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn btn-outline btn-icon"
                        title="Edit Product"
                        onClick={() => handleOpenEditModal(p)}
                      >
                        <Edit2 size={15} />
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-outline btn-icon"
                          title="Delete Product"
                          onClick={() => handleDelete(p.id, p.name)}
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? `Edit Product: ${selectedProduct.sku}` : 'Add New Product'}
        maxWidth="700px"
      >
        {formError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {formError}
          </div>
        )}
        {formSuccess && (
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SKU / Item Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. ELEC-901"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Wireless Mouse 2.4GHz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select
                className="form-select"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Logitech"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Unit</label>
              <input
                type="text"
                className="form-input"
                placeholder="pcs, pack, kg, bottle..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-input"
                placeholder="0.00"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Retail / Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-input"
                placeholder="0.00"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            {!selectedProduct && (
              <div className="form-group">
                <label className="form-label">Opening Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Safety Stock / Min Threshold</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                placeholder="10"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                placeholder="5"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Details & Audit View Modal */}
      {viewProductDetails && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Product Dossier: ${viewProductDetails.name}`}
          maxWidth="750px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SKU Code</div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>{viewProductDetails.sku}</div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category & Brand</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{viewProductDetails.category_name} &bull; {viewProductDetails.brand || 'No Brand'}</div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inventory Health</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>{viewProductDetails.quantity} {viewProductDetails.unit}</span>
                <Badge status={viewProductDetails.status} />
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Threshold: {viewProductDetails.min_threshold} | Lead Time: {viewProductDetails.lead_time_days} days
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Recent Stock Movement History</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Qty Change</th>
                  <th>Balance</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {viewProductDetails.transactions && viewProductDetails.transactions.length > 0 ? (
                  viewProductDetails.transactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '12px' }}>{new Date(t.created_at).toLocaleString()}</td>
                      <td><Badge status={t.type} /></td>
                      <td style={{ fontWeight: 700, color: t.quantity_change > 0 ? '#10b981' : '#ef4444' }}>
                        {t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change}
                      </td>
                      <td>{t.new_stock}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.reason || 'Movement'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      No inventory movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
