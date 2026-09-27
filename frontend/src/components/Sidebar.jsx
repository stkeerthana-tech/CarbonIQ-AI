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
  Sparkles,
  Users,
  ShieldCheck,
  Leaf,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Role-based navigation items matching Phase 2G specs.
 *
 * Company User:  Dashboard -> Activities -> Calculate/Preview -> Cora -> Audit Trail -> Profile -> Settings
 * Auditor:       Dashboard -> Activities -> Add Activity -> Calculate/Preview -> Cora -> Review & Flagged -> Audit Trail -> Profile -> Settings
 * Administrator: Same as Auditor -> Profile -> Settings + (User, Company, Role Management)
 */

const NAV_DASHBOARD = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true };
const NAV_ACTIVITIES = { to: '/activities', label: 'Activities', icon: History, end: true };
const NAV_ADD_ACTIVITY = { to: '/activities/new', label: 'Add Activity', icon: PlusCircle, end: true };
const NAV_CALCULATE = { to: '/emissions/calculate', label: 'Calculate / Preview', icon: Calculator, end: true };
const NAV_CORA = { to: '/cora', label: 'Cora', icon: Sparkles, isCora: true, end: true };
const NAV_REVIEW = { to: '/reviews', label: 'Review & Flagged', icon: AlertOctagon, isReview: true, end: true };
const NAV_AUDIT = { to: '/audit', label: 'Audit Trail', icon: FileCheck2, end: true };
const NAV_PROFILE = { to: '/company', label: 'Profile', icon: Building2, end: true };
const NAV_SETTINGS = { to: '/settings', label: 'Settings', icon: SettingsIcon, end: true };

// Admin-only management items
const NAV_ADMIN = [
  { to: '/admin/users', label: 'User Management', icon: Users, end: true },
  { to: '/admin/companies', label: 'Company Management', icon: Building2, end: true },
  { to: '/admin/roles', label: 'Role Management', icon: ShieldCheck, end: true },
];

function buildNavItems(role) {
  const items = [NAV_DASHBOARD, NAV_ACTIVITIES];

  // Auditor and Admin can Add Activity
  if (role === 'auditor' || role === 'admin') {
    items.push(NAV_ADD_ACTIVITY);
  }

  items.push(NAV_CALCULATE, NAV_CORA);

  // Review & Flagged — auditor and admin only
  if (role === 'auditor' || role === 'admin') {
    items.push(NAV_REVIEW);
  }

  items.push(NAV_AUDIT, NAV_PROFILE, NAV_SETTINGS);

  return items;
}

const roleLabels = {
  admin: 'Administrator',
  company_user: 'Company User',
  auditor: 'Auditor',
};

const roleBadgeColors = {
  admin: { bg: 'rgba(251, 146, 60, 0.12)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.25)' },
  auditor: { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  company_user: { bg: 'rgba(124, 58, 237, 0.12)', color: '#a78bfa', border: 'rgba(124, 58, 237, 0.25)' },
};

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'company_user';
  const navItems = buildNavItems(role);
  const adminItems = role === 'admin' ? NAV_ADMIN : [];
  const badgeStyle = roleBadgeColors[role] || roleBadgeColors.company_user;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}        <aside
        style={{
          width: '264px',
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
        <div
          style={{
            padding: '1.5rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 12px rgba(124, 58, 237, 0.35)',
                flexShrink: 0,
              }}
            >
              <Leaf size={20} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Carbonix{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: '0.1rem',
                }}
              >
                Carbon Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '0.75rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '0.5rem 0.75rem 0.35rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--nav-active-color)' : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--nav-active-bg)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid var(--nav-active-border)'
                    : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                  ...(item.isCora
                    ? {
                        color: isActive ? 'var(--nav-active-color)' : 'var(--cora-nav-color)',
                        background: isActive ? 'var(--nav-active-bg)' : 'var(--cora-nav-bg)',
                        border: isActive ? '1px solid var(--nav-active-border)' : '1px solid var(--cora-nav-border)',
                        fontWeight: 600,
                      }
                    : {}),
                  ...(item.isReview && !isActive
                    ? {
                        color: 'var(--status-review-color)',
                        background: 'var(--status-review-bg)',
                        border: '1px solid var(--status-review-border)',
                      }
                    : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.isCora && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: isActive ? 'var(--nav-active-bg)' : 'var(--cora-badge-bg)',
                          color: isActive ? 'var(--nav-active-color)' : 'var(--cora-badge-color)',
                          border: isActive ? '1px solid var(--nav-active-border)' : '1px solid var(--cora-nav-border)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        AI
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin-only section */}
          {adminItems.length > 0 && (
            <>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '0.85rem 0.75rem 0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: '0.5rem',
                }}
              >
                Administration
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: isActive ? 'var(--status-review-color)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--status-review-bg)' : 'transparent',
                      border: isActive ? '1px solid var(--status-review-border)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                    })}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* User card + Sign out */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-hover)',
          }}
        >
          {user && (
            <div
              style={{
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))',
                  border: '1px solid var(--primary-light)',
                  color: 'var(--nav-active-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Name + role badge */}
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {user.name}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.2rem',
                    fontSize: '0.62rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: `1px solid ${badgeStyle.border}`,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {roleLabels[role] || role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            id="sidebar-sign-out"
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
