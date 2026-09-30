import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShoppingCart,
  Store,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Badge } from './Badge';

export function Navbar({ onSelectTab }) {
  const { user } = useAuth();
  const [reorderCount, setReorderCount] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await api.getReorderAlerts(30);
        if (res.success) {
          setReorderCount(res.count || 0);
          setAlerts(res.reorders || []);
        }
      } catch (err) {
        console.warn('Alert load error:', err);
      }
    }
    loadAlerts();
  }, []);

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Store Location Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb'
        }}>
          <Store size={18} />
        </div>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
            Apex Retail Mart (Branch #102)
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Terminal Online &bull; Live Sync Active
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick POS Sale Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSelectTab('sales')}
          style={{ gap: '6px' }}
        >
          <ShoppingCart size={15} />
          <span>New Sale (POS)</span>
        </button>

        {/* Low Stock Alerts Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            style={{
              position: 'relative',
              background: 'transparent',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
          >
            <Bell size={18} />
            {reorderCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {reorderCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showNotificationMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              padding: '16px',
              animation: 'modalPop 0.15s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '8px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  Inventory Alerts ({reorderCount})
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11px', padding: '2px 6px' }}
                  onClick={() => {
                    setShowNotificationMenu(false);
                    onSelectTab('optimization');
                  }}
                >
                  View All
                </button>
              </div>

              {alerts.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  All inventory stocks are currently healthy.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {alerts.slice(0, 5).map(item => (
                    <div
                      key={item.productId}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          Stock: <strong style={{ color: '#ef4444' }}>{item.currentStock}</strong> / ROP: {item.reorderPoint}
                        </div>
                      </div>
                      <Badge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#f1f5f9',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <span>{user?.name}</span>
          <Badge status={user?.role} />
        </div>
      </div>
    </header>
  );
}
