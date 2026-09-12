import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, PlusCircle, CheckCircle2, AlertTriangle, MapPin, Briefcase } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function CompanyProfile() {
  const { activeCompany, companies, onSelectCompany } = useOutletContext();
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.companies.create({
        company_name: companyName.trim(),
        industry: industry.trim() || undefined,
        location: location.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessMsg(`Company "${res.data.company_name}" created successfully!`);
        setCompanyName('');
        setIndustry('');
        setLocation('');
        setShowAddForm(false);
        onSelectCompany(res.data);
      } else {
        setError(res.error || 'Failed to create company.');
      }
    } catch (err) {
      setError(err.message || 'Unable to save company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Organization Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Entity details and multi-organization reporting configuration
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>{showAddForm ? 'Cancel' : 'Register Organization'}</span>
        </button>
      </div>

      {successMsg && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Company Form */}
      {showAddForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary-glow)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Register New Reporting Entity</h3>
          <form onSubmit={handleCreateCompany}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-comp-name">Company / Facility Name</label>
                <input
                  id="new-comp-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Industrial Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-comp-industry">Industry Sector</label>
                <input
                  id="new-comp-industry"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Manufacturing, Logistics, IT"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-comp-location">Operating Region / Location</label>
                <input
                  id="new-comp-location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. India, Global"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Organization'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Organization Details Card */}
      {activeCompany && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Reporting Entity</span>
              <h2 style={{ fontSize: '1.45rem' }}>{activeCompany.company_name}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <Briefcase size={14} />
                <span>Industry</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {activeCompany.industry || 'Not specified'}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <MapPin size={14} />
                <span>Location</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {activeCompany.location || 'India (Default)'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entity ID</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                #{activeCompany.id}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of all companies */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>All Registered Entities ({companies?.length || 0})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {companies?.map((comp) => {
            const isSelected = comp.id === activeCompany?.id;
            return (
              <div
                key={comp.id}
                onClick={() => onSelectCompany(comp)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--primary-light)' : 'rgba(30, 41, 59, 0.4)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {comp.company_name}
                  </h4>
                  {isSelected && (
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--primary)', color: '#fff', fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {comp.industry || 'General Industry'} &bull; {comp.location || 'India'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
