import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function Suppliers({ onSelectTab }) {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);

  const initialForm = {
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      if (res.success) {
        setSuppliers(res.suppliers);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setFormData(initialForm);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setSelectedSupplier(s);
    setFormData({
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      status: s.status || 'ACTIVE'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenView = async (id) => {
    try {
      const res = await api.getSupplierById(id);
      if (res.success) {
        setViewDetails(res.supplier);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      alert('Error loading supplier details: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      if (selectedSupplier) {
        await api.updateSupplier(selectedSupplier.id, formData);
        setFormSuccess('Supplier updated successfully.');
      } else {
        await api.createSupplier(formData);
        setFormSuccess('Supplier added successfully.');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        loadSuppliers();
      }, 500);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier '${name}'? Linked products will remain preserved.`)) return;
    try {
      await api.deleteSupplier(id);
      loadSuppliers();
    } catch (err) {
      alert('Error deleting supplier: ' + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Vendor directories, procurement channels, lead-time contacts, and purchase volumes</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading supplier profiles...
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No suppliers found. Click "Add Supplier" to register one.
          </div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#e0e7ff',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{s.name}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Contact: {s.contact_person || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Badge status={s.status} text={s.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', margin: '14px 0', color: '#475569' }}>
                  {s.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={15} color="#94a3b8" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} color="#94a3b8" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="#94a3b8" />
                      <span style={{ fontSize: '12px' }}>{s.address}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginTop: '12px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Products:</span>{' '}
                    <strong>{s.products_count} SKUs</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total Spend:</span>{' '}
                    <strong>₹{Number(s.total_purchased_amount).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenView(s.id)}
                  style={{ gap: '4px' }}
                >
                  <Eye size={14} />
                  <span>Dossier</span>
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-outline btn-icon"
                    title="Edit Supplier"
                    onClick={() => handleOpenEdit(s)}
                  >
                    <Edit2 size={15} />
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn-outline btn-icon"
                      title="Delete Supplier"
                      style={{ color: '#ef4444' }}
                      onClick={() => handleDelete(s.id, s.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? `Edit Supplier: ${selectedSupplier.name}` : 'Register New Supplier'}
        maxWidth="550px"
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
          <div className="form-group">
            <label className="form-label">Company / Supplier Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Apex Global Distributors Ltd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rajesh Verma (Account Manager)"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse / Office Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Sector 18, Industrial Estate, Bangalore"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supplier Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active Vendor</option>
              <option value="INACTIVE">Inactive / Suspended</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Dossier Modal */}
      {viewDetails && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Supplier Profile: ${viewDetails.name}`}
          maxWidth="700px"
        >
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Supplied Catalog Products ({viewDetails.products?.length || 0})</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Cost (₹)</th>
                    <th>Retail (₹)</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetails.products && viewDetails.products.length > 0 ? (
                    viewDetails.products.map((p) => (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.sku}</span></td>
                        <td>{p.name}</td>
                        <td>₹{p.cost_price.toFixed(2)}</td>
                        <td>₹{p.selling_price.toFixed(2)}</td>
                        <td><strong>{p.quantity}</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)' }}>
                        No products linked to this supplier yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Recent Purchase Orders</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetails.purchases && viewDetails.purchases.length > 0 ? (
                    viewDetails.purchases.map((po) => (
                      <tr key={po.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{po.po_number}</span></td>
                        <td style={{ fontSize: '12px' }}>{new Date(po.purchase_date).toLocaleDateString()}</td>
                        <td><strong>₹{po.total_amount.toFixed(2)}</strong></td>
                        <td><Badge status={po.status} text={po.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)' }}>
                        No purchase orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
