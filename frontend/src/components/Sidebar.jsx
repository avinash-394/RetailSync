import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Users,
  LogOut,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentTab, onSelectTab }) {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory & Audit', icon: Boxes },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchases', label: 'Purchases (PO)', icon: ShoppingBag },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart },
    { id: 'optimization', label: 'Optimization Engine', icon: TrendingUp, highlight: true },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : [])
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minHeight: '100vh',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
        }}>
          <Layers size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            fontFamily: 'var(--font-heading)'
          }}>
            RetailSync
          </h2>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
            Inventory Intelligence
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#64748b',
          padding: '8px 12px 4px',
          letterSpacing: '0.05em'
        }}>
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, #4f46e5 0%, #4338ca 100%)'
                  : 'transparent',
                color: isActive ? '#ffffff' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={19} color={isActive ? '#ffffff' : (item.highlight ? '#a5b4fc' : '#94a3b8')} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  fontWeight: 800,
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  Smart
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: user?.role === 'ADMIN' ? '#8b5cf6' : '#0ea5e9',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>
                {user?.name || 'User'}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                {user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
