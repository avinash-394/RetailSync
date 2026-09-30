import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle,
  Receipt,
  User,
  CreditCard,
  QrCode,
  DollarSign
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Checkout Form
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        api.getSales({ q: search, payment_method: paymentFilter, limit: 100 }),
        api.getProducts({ limit: 150 })
      ]);

      if (salesRes.success) setSales(salesRes.sales);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, paymentFilter]);

  const handleOpenCheckout = () => {
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setPaymentMethod('UPI');
    setDiscountAmount(0);
    setCartItems([]);
    setCheckoutError('');
    setCheckoutSuccess('');
    setIsCheckoutOpen(true);
  };

  const handleAddToCart = (product) => {
    if (product.quantity <= 0) {
      alert(`Cannot add '${product.name}' - Item is currently OUT OF STOCK.`);
      return;
    }

    const existingIndex = cartItems.findIndex((item) => item.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = cartItems[existingIndex].quantity;
      if (currentQty >= product.quantity) {
        alert(`Cannot add more. Current available stock is only ${product.quantity}.`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          unit: product.unit,
          available_stock: product.quantity,
          unit_price: product.selling_price,
          quantity: 1
        }
      ]);
    }
  };

  const handleUpdateQuantity = (index, qty) => {
    const item = cartItems[index];
    const newQty = Math.max(1, Number(qty) || 1);
    if (newQty > item.available_stock) {
      alert(`Max available stock for '${item.product_name}' is ${item.available_stock}.`);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
  };

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const tax = Number(((subtotal - discount) * 0.05).toFixed(2)); // 5% GST
  const grandTotal = Number(Math.max(0, subtotal - discount + tax).toFixed(2));

  const handleCompleteSale = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (cartItems.length === 0) {
      setCheckoutError('Please add at least one product to the checkout cart.');
      return;
    }

    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        discount_amount: discount,
        tax_amount: tax,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await api.createSale(payload);
      setCheckoutSuccess(res.message);

      // Fetch the full created sale for immediate invoice preview
      const fullSale = await api.getSaleById(res.saleId);
      if (fullSale.success) {
        setActiveReceipt(fullSale.sale);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
      }

      loadData();
    } catch (err) {
      setCheckoutError(err.message || 'Failed to process sale.');
    }
  };

  const handleOpenReceiptModal = async (id) => {
    try {
      const res = await api.getSaleById(id);
      if (res.success) {
        setActiveReceipt(res.sale);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert('Error fetching receipt: ' + err.message);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Sales Terminal & POS</h1>
          <p>Counter point-of-sale billing, digital invoice generation, and real-time inventory decrement</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenCheckout}>
            <ShoppingCart size={16} />
            <span>Launch POS Checkout</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Invoice #, Customer Name, or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="UPI">UPI / Digital</option>
          </select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Sale Date</th>
              <th>Items & Units</th>
              <th>Payment</th>
              <th>Total Amount (₹)</th>
              <th>Cashier</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading sales history...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No sales found. Click "Launch POS Checkout" to record a transaction.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {sale.invoice_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sale.customer_name}</div>
                    {sale.customer_phone && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sale.customer_phone}</div>
                    )}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {new Date(sale.sale_date).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>
                      {sale.item_count} items ({sale.total_units_sold} units)
                    </span>
                  </td>
                  <td>
                    <Badge status={sale.payment_method} text={sale.payment_method} />
                  </td>
                  <td>
                    <strong style={{ fontSize: '14.5px', color: '#059669' }}>
                      ₹{sale.total_amount.toFixed(2)}
                    </strong>
                  </td>
                  <td style={{ fontSize: '12px' }}>{sale.cashier_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenReceiptModal(sale.id)}
                      style={{ gap: '4px' }}
                    >
                      <Receipt size={14} />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POS Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="POS Counter Checkout Terminal"
        maxWidth="950px"
      >
        {checkoutError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {checkoutError}
          </div>
        )}
        {checkoutSuccess && (
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {checkoutSuccess}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left: Product Selector */}
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Select Products to Cart</h4>
            <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {products.map((p) => {
                  const isOut = p.quantity <= 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: isOut ? '#f1f5f9' : '#ffffff',
                        border: '1px solid #e2e8f0',
                        opacity: isOut ? 0.6 : 1
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          SKU: {p.sku} &bull; Stock: <strong style={{ color: isOut ? '#ef4444' : '#059669' }}>{p.quantity} {p.unit}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '14px' }}>₹{p.selling_price.toFixed(2)}</strong>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isOut}
                          onClick={() => handleAddToCart(p)}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Cart and Customer Form */}
          <form onSubmit={handleCompleteSale} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Cart Line Items ({cartItems.length})</h4>

              {cartItems.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '13px' }}>
                  No items in cart yet. Select items from the catalog on the left.
                </div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {cartItems.map((item, index) => (
                    <div
                      key={item.product_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '12.5px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          @ ₹{item.unit_price} / {item.unit}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          max={item.available_stock}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                          style={{ width: '50px', padding: '4px 6px', fontSize: '12px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                        <strong style={{ width: '65px', textAlign: 'right' }}>
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(index)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer & Billing Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Customer Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Phone (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+91..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Bill Totals Summary */}
              <div style={{
                marginTop: '14px',
                padding: '12px 14px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                fontSize: '12.5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>GST (5%):</span>
                  <span>+₹{tax.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '6px',
                  marginTop: '4px',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#0f172a'
                }}>
                  <span>Final Total:</span>
                  <span style={{ color: '#059669' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={cartItems.length === 0}>
                Complete Sale & Print
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="Tax Invoice & Customer Receipt"
          maxWidth="550px"
        >
          <div className="printable-area" style={{ padding: '10px' }}>
            {/* Store Receipt Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '14px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {activeReceipt.storeInfo?.name || 'Apex Retail Mart'}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {activeReceipt.storeInfo?.address}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                GSTIN: <strong>{activeReceipt.storeInfo?.gstin}</strong> | Phone: {activeReceipt.storeInfo?.phone}
              </div>
            </div>

            {/* Receipt Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
              <div>
                <div>Invoice: <strong style={{ fontFamily: 'monospace' }}>{activeReceipt.invoice_number}</strong></div>
                <div>Customer: <strong>{activeReceipt.customer_name}</strong></div>
                {activeReceipt.customer_phone && <div>Phone: {activeReceipt.customer_phone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Date: {new Date(activeReceipt.sale_date).toLocaleDateString()}</div>
                <div>Time: {new Date(activeReceipt.sale_date).toLocaleTimeString()}</div>
                <div>Cashier: {activeReceipt.cashier_name}</div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeReceipt.items?.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                    <td style={{ padding: '6px 0' }}>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.product_sku}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '6px 0' }}>₹{item.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600 }}>₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Receipt Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{activeReceipt.subtotal?.toFixed(2)}</span>
              </div>
              {activeReceipt.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span>-₹{activeReceipt.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tax (GST 5%):</span>
                <span>+₹{activeReceipt.tax_amount?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '4px', borderTop: '1px solid #0f172a', paddingTop: '4px' }}>
                <span>Total Paid:</span>
                <span>₹{activeReceipt.total_amount?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Payment Tender:</span>
                <span style={{ fontWeight: 700 }}>{activeReceipt.payment_method}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div style={{ textAlign: 'center', marginTop: '18px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Thank you for shopping at Apex Retail Mart!
              <div style={{ fontSize: '9px', marginTop: '2px' }}>Software Powered by RetailSync System &bull; College Capstone Project</div>
            </div>
          </div>

          <div className="modal-footer no-print" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsReceiptOpen(false)}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrintReceipt}>
              <Printer size={15} />
              <span>Print Invoice / Receipt</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
