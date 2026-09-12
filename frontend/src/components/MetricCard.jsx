import React from 'react';

export function MetricCard({ title, value, unit, icon: Icon, subtitle, color = 'emerald', alert = false }) {
  const colorMap = {
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      icon: '#10b981',
      text: '#34d399',
    },
    sky: {
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.25)',
      icon: '#38bdf8',
      text: '#38bdf8',
    },
    indigo: {
      bg: 'rgba(129, 140, 248, 0.1)',
      border: 'rgba(129, 140, 248, 0.25)',
      icon: '#818cf8',
      text: '#818cf8',
    },
    purple: {
      bg: 'rgba(192, 132, 252, 0.1)',
      border: 'rgba(192, 132, 252, 0.25)',
      icon: '#c084fc',
      text: '#c084fc',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      icon: '#f59e0b',
      text: '#fbbf24',
    },
    rose: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: '#ef4444',
      text: '#f87171',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `3px solid ${scheme.icon}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: scheme.bg,
              color: scheme.icon,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
        <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && (
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.775rem', color: alert ? 'var(--status-flagged-text)' : 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
