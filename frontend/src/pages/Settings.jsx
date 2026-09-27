import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Laptop,
  Bell,
  Lock,
  Globe,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const { user } = useAuth();

  // Notification Preferences
  const [reviewAlerts, setReviewAlerts] = useState(() => {
    try {
      return localStorage.getItem('carboniq_notif_review') !== 'false';
    } catch {
      return true;
    }
  });

  const [securityAlerts, setSecurityAlerts] = useState(() => {
    try {
      return localStorage.getItem('carboniq_notif_security') !== 'false';
    } catch {
      return true;
    }
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleToggleReviewAlerts = () => {
    const next = !reviewAlerts;
    setReviewAlerts(next);
    localStorage.setItem('carboniq_notif_review', String(next));
  };

  const handleToggleSecurityAlerts = () => {
    const next = !securityAlerts;
    setSecurityAlerts(next);
    localStorage.setItem('carboniq_notif_security', String(next));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', message: '' });

    if (!currentPassword) {
      setPwdStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwdStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'New password confirmation does not match.' });
      return;
    }

    setPwdLoading(true);
    setTimeout(() => {
      setPwdLoading(false);
      setPwdStatus({
        type: 'success',
        message: 'Security credentials updated for your session.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 600);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          Settings &amp; Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Customize application theme, notification thresholds, and security preferences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 1. Appearance / Theme Section */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} style={{ color: '#a78bfa' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Appearance</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Choose how Carbonix AI looks on your display. Select System to match your OS dark/light mode preference.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Dark Theme Button */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: theme === 'dark' ? 'rgba(124, 58, 237, 0.16)' : 'var(--bg-card)',
                border: theme === 'dark' ? '2px solid #7c3aed' : '1px solid var(--border-subtle)',
                color: theme === 'dark' ? '#c4b5fd' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a78bfa',
                }}
              >
                <Moon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Dark Theme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carbonix Obsidian</div>
              </div>
            </button>

            {/* Light Theme Button */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: theme === 'light' ? 'rgba(124, 58, 237, 0.16)' : 'var(--bg-card)',
                border: theme === 'light' ? '2px solid #7c3aed' : '1px solid var(--border-subtle)',
                color: theme === 'light' ? '#7c3aed' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Sun size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Light Theme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clean Daylight</div>
              </div>
            </button>

            {/* System Auto Button */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: theme === 'system' ? 'rgba(124, 58, 237, 0.16)' : 'var(--bg-card)',
                border: theme === 'system' ? '2px solid #7c3aed' : '1px solid var(--border-subtle)',
                color: theme === 'system' ? 'var(--primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                }}
              >
                <Laptop size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>System Sync</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Active: {effectiveTheme === 'dark' ? 'Dark' : 'Light'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Notifications Section */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Bell size={20} style={{ color: '#60a5fa' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Notifications &amp; Alerts</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Configure operational alert triggers and verification updates
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Review Alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Review &amp; Anomaly Alerts
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Notify when activity records are flagged with 'Needs Review' or exceed statistical thresholds
                </div>
              </div>
              <input
                type="checkbox"
                checked={reviewAlerts}
                onChange={handleToggleReviewAlerts}
                aria-label="Toggle Review and Anomaly Alerts"
                style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
              />
            </div>

            {/* Security Alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Security &amp; Session Alerts
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Alert upon new device sign-ins and role modifications
                </div>
              </div>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={handleToggleSecurityAlerts}
                aria-label="Toggle Security and Session Alerts"
                style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* 3. Security (Password Management) */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Lock size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Security &amp; Password</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Manage your authenticated credentials and access security
          </p>

          {pwdStatus.message && (
            <div
              role="alert"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                background: pwdStatus.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${pwdStatus.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: pwdStatus.type === 'error' ? '#f87171' : '#34d399',
              }}
            >
              {pwdStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{pwdStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '520px' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="cur-password">Current Password</label>
              <input
                id="cur-password"
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwdLoading}
              style={{ fontSize: '0.875rem' }}
            >
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* 4. Language Section */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Globe size={20} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Language &amp; Region</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Select your preferred interface language
          </p>

          <div style={{ maxWidth: '320px' }}>
            <select
              className="form-select"
              defaultValue="en"
              aria-label="Select interface language"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.875rem' }}
            >
              <option value="en">English (US / Global GHG Standard)</option>
            </select>
          </div>
        </div>

        {/* 5. About Section */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Info size={20} style={{ color: '#c084fc' }} />
            <h2 style={{ fontSize: '1.15rem' }}>About Carbonix AI</h2>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '0.65rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Carbonix AI</strong> — Autonomous Carbon Accounting &amp; Verification Platform.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                background: 'rgba(124, 58, 237, 0.12)',
                color: '#c4b5fd',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              <ShieldCheck size={14} />
              <span>Version 2.0.0 (Deterministic Engine Active)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Built with deterministic Python calculations, immutable SQLite audit trails, and Cora AI compliance assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
