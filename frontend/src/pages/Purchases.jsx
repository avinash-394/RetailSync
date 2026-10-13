import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Building,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function Purchases() {
  const { isAdmin } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPO, setViewPO] = useState(null);

  // New PO Form
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState([
    { product_id: '', quantity: 1, unit_cost: 0 }
  ]);
  const [poError, setPoError] = useState('');
  const [poSuccess, setPoSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, prodRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts({ limit: 150 })
      ]);

      if (purRes.success) setPurchases(purRes.purchases);
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error('Error loading purchase records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setPoNotes('');
    setPoItems([{ product_id: '', quantity: 10, unit_cost: 0 }]);
    setPoError('');
    setPoSuccess('');
    setIsCreateModalOpen(true);
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === Number(prodId));
    const newItems = [...poItems];
    newItems[index].product_id = prodId;
    if (prod) {
      newItems[index].unit_cost = prod.cost_price;
    }
    setPoItems(newItems);
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...poItems];
    newItems[index].quantity = Math.max(1, Number(qty) || 1);
    setPoItems(newItems);
  };

  const handleCostChange = (index, cost) => {
    const newItems = [...poItems];
    newItems[index].unit_cost = Number(cost) || 0;
    setPoItems(newItems);
  };

  const handleAddItemRow = () => {
    setPoItems([...poItems, { product_id: '', quantity: 10, unit_cost: 0 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return poItems.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unit_cost) || 0;
      return acc + (qty * cost);
    }, 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setPoError('');
    setPoSuccess('');

    // Validation
    if (!selectedSupplierId) {
      setPoError('Please select a supplier.');
      return;
    }

    const validItems = poItems.filter((i) => i.product_id && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setPoError('Please add at least one valid product line item.');
      return;
    }

    try {
      const res = await api.createPurchase({
        supplier_id: Number(selectedSupplierId),
        items: validItems,
        notes: poNotes
      });

      setPoSuccess(res.message || 'Purchase Order generated and inventory replenished!');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        loadData();
      }, 700);
    } catch (err) {
      setPoError(err.message || 'Failed to create purchase order.');
    }
  };

  const handleOpenViewModal = async (id) => {
    try {
      const res = await api.getPurchaseById(id);
      if (res.success) {
        setViewPO(res.purchase);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching purchase details: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("⚠️ CAUTION: Are you sure you want to delete ALL purchase order records? This action cannot be undone.")) return;
    try {
      await api.deleteAllPurchases();
      loadData();
    } catch (err) {
      alert('Failed to delete all purchases: ' + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Purchase Orders & Stock Inbound</h1>
          <p>Procurement documentation, vendor invoices, unit cost tracking, and automatic stock receiving</p>
        </div>
        <div className="page-header-actions">
          {isAdmin && purchases.length > 0 && (
            <button
              className="btn btn-outline"
              onClick={handleDeleteAll}
              style={{ color: '#ef4444', borderColor: '#fca5a5' }}
            >
              <Trash2 size={15} />
              <span>Delete All POs</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Purchase Date</th>
              <th>Items & Units</th>
              <th>Total Amount (₹)</th>
              <th>Status</th>
              <th>Created By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading purchase records...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No purchase orders found. Click "Create Purchase Order" to receive stock.
                </td>
              </tr>
            ) : (
              purchases.map((po) => (
                <tr key={po.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {po.po_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{po.supplier_name}</div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {new Date(po.purchase_date).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>
                      {po.item_count} items ({po.total_units_received} units)
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '14.5px' }}>
                      ₹{po.total_amount.toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <Badge status="PURCHASE" text={po.status} />
                  </td>
                  <td style={{ fontSize: '12px' }}>{po.user_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenViewModal(po.id)}
                      style={{ gap: '4px' }}
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order (Stock Inbound)"
        maxWidth="800px"
      >
        {poError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {poError}
          </div>
        )}
        {poSuccess && (
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {poSuccess}
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Vendor / Supplier *</label>
            <select
              required
              className="form-select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contact_person || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ margin: '20px 0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Line Items to Ingest *</label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleAddItemRow}
              >
                <Plus size={14} />
                <span>Add Item Row</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {poItems.map((item, index) => {
                const subtotal = (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <select
                        required
                        className="form-select"
                        value={item.product_id}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                      >
                        <option value="">Choose product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-input"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="form-input"
                        placeholder="Cost (₹)"
                        value={item.unit_cost}
                        onChange={(e) => handleCostChange(index, e.target.value)}
                      />
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '13.5px' }}>
                      ₹{subtotal.toFixed(2)}
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn btn-outline btn-icon btn-sm"
                        style={{ color: '#ef4444' }}
                        disabled={poItems.length === 1}
                        onClick={() => handleRemoveItemRow(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#e0e7ff',
            borderRadius: '8px',
            marginTop: '12px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#3730a3' }}>Grand Total Cost:</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#312e81' }}>
              ₹{calculateGrandTotal().toFixed(2)}
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Procurement Remarks / Delivery Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Bulk restock discount applied, truck delivery #4"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Ingest Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Details Modal */}
      {viewPO && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Purchase Order: ${viewPO.po_number}`}
          maxWidth="700px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier Info</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{viewPO.supplier_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {viewPO.supplier_email} &bull; {viewPO.supplier_phone}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Summary</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{viewPO.total_amount.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Date: {new Date(viewPO.purchase_date).toLocaleString()}
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Line Items Received ({viewPO.items?.length || 0})</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Cost (₹)</th>
                  <th style={{ textAlign: 'right' }}>Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody>
                {viewPO.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.product_sku}</div>
                    </td>
                    <td>{item.quantity} {item.product_unit}</td>
                    <td>₹{item.unit_cost.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
