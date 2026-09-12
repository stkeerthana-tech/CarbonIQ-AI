import React from 'react';

export function ScopeBreakdown({ scope1 = 0, scope2 = 0, scope3 = 0, total = 0 }) {
  const hasData = total > 0;

  const p1 = hasData ? Math.round((scope1 / total) * 100) : 0;
  const p2 = hasData ? Math.round((scope2 / total) * 100) : 0;
  const p3 = hasData ? Math.max(0, 100 - p1 - p2) : 0;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Emissions by Scope Breakdown</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Deterministic verified distribution across GHG Protocol scopes
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Verified</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
            {hasData ? `${total.toLocaleString()} tCO2e` : '0.00 tCO2e'}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          Not enough data for this chart yet.
        </div>
      ) : (
        <>
          {/* Multi-segment Progress Bar */}
          <div
            style={{
              height: '14px',
              borderRadius: '7px',
              overflow: 'hidden',
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              marginBottom: '1.5rem',
            }}
          >
            {p1 > 0 && (
              <div
                style={{ width: `${p1}%`, background: 'var(--scope-1)', transition: 'width 0.4s ease' }}
                title={`Scope 1: ${scope1} tCO2e (${p1}%)`}
              />
            )}
            {p2 > 0 && (
              <div
                style={{ width: `${p2}%`, background: 'var(--scope-2)', transition: 'width 0.4s ease' }}
                title={`Scope 2: ${scope2} tCO2e (${p2}%)`}
              />
            )}
            {p3 > 0 && (
              <div
                style={{ width: `${p3}%`, background: 'var(--scope-3)', transition: 'width 0.4s ease' }}
                title={`Scope 3: ${scope3} tCO2e (${p3}%)`}
              />
            )}
          </div>

          {/* Scope Legends */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(56, 189, 248, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--scope-1)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scope 1 (Direct)</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--scope-1)' }}>
                {scope1} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>tCO2e ({p1}%)</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(129, 140, 248, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--scope-2)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scope 2 (Electricity)</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--scope-2)' }}>
                {scope2} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>tCO2e ({p2}%)</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(192, 132, 252, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--scope-3)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scope 3 (Value Chain)</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--scope-3)' }}>
                {scope3} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>tCO2e ({p3}%)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ScopeBreakdown;
