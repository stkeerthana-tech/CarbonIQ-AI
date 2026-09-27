import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Mail,
  MapPin,
  Briefcase,
  KeyRound,
  FileCheck2,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const roleDisplayMap = {
  admin: {
    label: 'Administrator',
    badgeBg: 'rgba(251, 146, 60, 0.12)',
    badgeColor: '#fb923c',
    badgeBorder: 'rgba(251, 146, 60, 0.25)',
    description: 'Full system oversight, global company management, user and role administration.',
  },
  auditor: {
    label: 'Independent Auditor',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeColor: '#60a5fa',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    description: 'Authorized to submit activity records, verify calculations, and conduct review & audit resolution.',
  },
  company_user: {
    label: 'Company User',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    badgeColor: '#a78bfa',
    badgeBorder: 'rgba(124, 58, 237, 0.25)',
    description: 'Reporting entity representative with read access to dashboard, activities, calculation preview, and Cora.',
  },
};

export function Profile() {
  const { activeCompany, companies, onSelectCompany } = useOutletContext();
  const { user } = useAuth();

  const roleInfo = roleDisplayMap[user?.role] || roleDisplayMap.company_user;

  // Admin company creation modal state (only accessible by admin)
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;
    setCompanyError('');
    setCompanySuccess('');

    if (!newCompanyName.trim()) {
      setCompanyError('Company name is required.');
      return;
    }

    setCompanyLoading(true);
    try {
      const res = await api.companies.create({
        company_name: newCompanyName.trim(),
        industry: newIndustry.trim() || undefined,
        location: newLocation.trim() || undefined,
      });

      if (res.success && res.data) {
        setCompanySuccess(`Company "${res.data.company_name}" created successfully!`);
        setNewCompanyName('');
        setNewIndustry('');
        setNewLocation('');
        setShowAddCompany(false);
        if (onSelectCompany) {
          onSelectCompany(res.data);
        }
      } else {
        setCompanyError(res.error || 'Failed to create company.');
      }
    } catch (err) {
      setCompanyError(err.message || 'Unable to create company.');
    } finally {
      setCompanyLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          User &amp; Organization Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Role-scoped credentials, active assignments, and security details
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* User Identity Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))',
                border: '1px solid var(--primary-light)',
                color: 'var(--nav-active-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.4rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{user?.name || 'Authorized User'}</h2>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px',
                  background: roleInfo.badgeBg,
                  color: roleInfo.badgeColor,
                  border: `1px solid ${roleInfo.badgeBorder}`,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Email Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <Mail size={15} style={{ color: 'var(--primary-light)' }} />
                <span>{user?.email || 'N/A'}</span>
              </div>
            </div>

            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Account Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--esg-accent)', fontWeight: 600 }}>
                <CheckCircle2 size={15} />
                <span>Active &amp; Authenticated</span>
              </div>
            </div>

            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Role Description</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                {roleInfo.description}
              </div>
            </div>
          </div>
        </div>

        {/* Organization / Facility Assignment Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building2 size={22} style={{ color: 'var(--scope-1)' }} />
              <h2 style={{ fontSize: '1.15rem' }}>
                {user?.role === 'admin' ? 'System Scope & Organization' : 'Assigned Organization'}
              </h2>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddCompany((prev) => !prev)}
                className="btn btn-secondary"
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem' }}
              >
                <PlusCircle size={14} />
                <span>{showAddCompany ? 'Cancel' : 'New Org'}</span>
              </button>
            )}
          </div>

          {companySuccess && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--status-valid-bg)', border: '1px solid var(--status-valid-border)', color: 'var(--status-valid-color)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {companySuccess}
            </div>
          )}

          {companyError && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--status-flagged-bg)', border: '1px solid var(--status-flagged-border)', color: 'var(--status-flagged-color)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {companyError}
            </div>
          )}

          {/* Admin Org Creation Form */}
          {showAddCompany && user?.role === 'admin' && (
            <form onSubmit={handleCreateCompany} style={{ padding: '1rem', background: 'var(--nav-active-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--nav-active-border)', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Company / Facility Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Industrial Solutions"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Industry Sector</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Manufacturing, Logistics"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Operating Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. India, Global"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={companyLoading} style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}>
                {companyLoading ? 'Creating...' : 'Register Company'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Entity Name</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {activeCompany?.company_name || 'No organization assigned'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Industry</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <Briefcase size={14} />
                  <span>{activeCompany?.industry || 'General Sector'}</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Location</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} />
                  <span>{activeCompany?.location || 'India'}</span>
                </div>
              </div>
            </div>

            {user?.role === 'admin' && companies && companies.length > 1 && (
              <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Switch Active Organization (Admin View)</div>
                <select
                  value={activeCompany?.id || ''}
                  onChange={(e) => {
                    const found = companies.find((c) => String(c.id) === e.target.value);
                    if (found && onSelectCompany) onSelectCompany(found);
                  }}
                  className="form-select"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.location || 'India'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Audit Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <KeyRound size={20} style={{ color: 'var(--esg-accent)' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Security &amp; Authorization Context</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Authentication Protocol</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>JWT Bearer Token</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>State verified via /api/auth/me</div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Data Isolation Scope</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.role === 'admin' ? 'Global Multi-Tenant' : `Company ID ${activeCompany?.id || 1}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Backend enforce_company_access</div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Audit Trail Status</div>
              <div style={{ fontWeight: 600, color: 'var(--esg-accent)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileCheck2 size={14} />
                <span>Immutable &amp; Active</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Python / SQLite engine</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
