import React from 'react';

export function KPICard({ title, value, subtext, icon: Icon, accentGradient, iconBg, iconColor }) {
  return (
    <div className="kpi-card" style={{ '--accent-gradient': accentGradient }}>
      <div>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        {subtext && <div className="kpi-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className="kpi-icon-box" style={{ backgroundColor: iconBg || '#e0e7ff', color: iconColor || '#4f46e5' }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
