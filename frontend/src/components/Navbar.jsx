import React from 'react';
import { Menu, Shield, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onToggleSidebar, activeCompany, companies, onSelectCompany }) {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: '64px',
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="mobile-toggle-btn"
          aria-label="Toggle navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Organization:</span>
          {companies && companies.length > 0 ? (
            <select
              value={activeCompany?.id || ''}
              onChange={(e) => {
                const selected = companies.find((c) => String(c.id) === e.target.value);
                if (selected) onSelectCompany(selected);
              }}
              className="form-select"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.85rem',
                height: 'auto',
                width: 'auto',
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.location || 'India'})
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeCompany ? activeCompany.company_name : 'Default Organization'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
          }}
          title="Deterministic backend connected & active"
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
          <span>Audit Engine Online</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
