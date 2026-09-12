import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Calculator,
  AlertOctagon,
  FileCheck2,
  Building2,
  LogOut,
  ShieldAlert,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const roleLabels = {
    admin: 'Admin',
    company_user: 'Company User',
    auditor: 'Auditor',
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/activities/new', label: 'Add Activity', icon: PlusCircle },
    { to: '/activities', label: 'Activity History', icon: History },
    { to: '/emissions/calculate', label: 'Calculate Preview', icon: Calculator },
    { to: '/reviews', label: 'Review & Flagged', icon: AlertOctagon },
    { to: '/audit', label: 'Audit Trail', icon: FileCheck2 },
    { to: '/company', label: 'Company Profile', icon: Building2 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            display: 'block',
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          height: '100vh',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-container"
      >
        {/* Brand Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px var(--primary-glow)',
              }}
            >
              <Leaf size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Carboniq <span style={{ color: 'var(--primary)' }}>AI</span>
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Carbon Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: isActive ? '1px solid var(--primary-glow)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)' }}>
          {user && (
            <div style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.825rem', padding: '0.5rem' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
