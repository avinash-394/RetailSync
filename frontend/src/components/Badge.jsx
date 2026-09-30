import React from 'react';

export function Badge({ status, text }) {
  const normalized = (status || '').toUpperCase();

  let className = 'badge-gray';
  let label = text || status;

  switch (normalized) {
    case 'IN_STOCK':
      className = 'badge-success';
      label = label || 'In Stock';
      break;
    case 'LOW_STOCK':
      className = 'badge-warning';
      label = label || 'Low Stock';
      break;
    case 'OUT_OF_STOCK':
      className = 'badge-danger';
      label = label || 'Out of Stock';
      break;
    case 'FAST_MOVING':
      className = 'badge-purple';
      label = label || 'Fast Moving';
      break;
    case 'SLOW_MOVING':
      className = 'badge-gray';
      label = label || 'Slow Moving';
      break;
    case 'NORMAL_MOVING':
      className = 'badge-info';
      label = label || 'Steady';
      break;
    case 'ADMIN':
      className = 'badge-purple';
      label = 'Admin';
      break;
    case 'STAFF':
      className = 'badge-info';
      label = 'Staff';
      break;
    case 'PURCHASE':
    case 'ADJUSTMENT_IN':
      className = 'badge-success';
      break;
    case 'SALE':
    case 'ADJUSTMENT_OUT':
      className = 'badge-info';
      break;
    case 'DAMAGE':
    case 'EXPIRED':
      className = 'badge-danger';
      break;
    default:
      className = 'badge-gray';
  }

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  );
}
