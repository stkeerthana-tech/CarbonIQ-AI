import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Database,
  Calculator,
  BookOpen,
  Calendar,
  Layers,
  Scale,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export function EmissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError('');
      try {
        const res = await api.activities.getById(id);
        if (res.success && res.data) {
          setRecord(res.data);
        } else {
          setError(res.error || 'Record not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve emission details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading verified emission details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Emission Record Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error || 'Unable to locate this record.'}</p>
        <Link to="/activities" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Activities</span>
        </Link>
      </div>
    );
  }

  const emission = record.emission || {};
  const audit = record.audit || {};
  const isNeedsReview = emission.status === 'Needs Review';

  let parsedAuditActivity = null;
  try {
    if (audit.activity_data) {
      parsedAuditActivity = JSON.parse(audit.activity_data);
    }
  } catch (e) {
    parsedAuditActivity = null;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Activity #{record.id}</span>
          <StatusBadge status={emission.status} />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>{record.activity}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Deterministic carbon accounting calculation, evidence trail, and methodology breakdown.
        </p>
      </div>

      {/* SECTION 1: VERIFIED ACTIVITY DATA */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Database size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            1. Verified Operational Activity Data
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reported Activity</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {record.activity}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logged Quantity</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {Number(record.quantity).toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{record.unit}</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activity Date</span>
            <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {record.date}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Scope</span>
            <div style={{ marginTop: '0.25rem' }}>
              {emission.scope ? <StatusBadge scope={emission.scope} /> : 'Unassigned'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CALCULATED CO2e RESULT OR REVIEW BANNER */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: `4px solid ${isNeedsReview ? 'var(--status-review-text)' : 'var(--primary)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Scale size={18} color={isNeedsReview ? '#fbbf24' : 'var(--primary)'} />
          <h3 style={{ fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            2. Carbon Calculation Output
          </h3>
        </div>

        {isNeedsReview ? (
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
              <AlertTriangle size={20} />
              <span>Status: Needs Review</span>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              {emission.review_reason || 'No verified CO2e emission factor is available in the database.'}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--status-review-text)', background: 'rgba(0,0,0,0.2)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <strong>Notice:</strong> The system did not calculate an unsupported CO2e value. Reporting unverified numbers as complete CO2e would violate GHG Protocol compliance.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified CO2e (Tonnes)</span>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                  {emission.co2e_tonnes} <span style={{ fontSize: '1rem', fontWeight: 500 }}>tCO2e</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Kilograms</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                  {Number(emission.co2e_kg).toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg CO2e</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emission Factor Used</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginTop: '0.35rem' }}>
                  {audit.factor_value || emission.factor_id}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Factor ID: {emission.factor_id}</div>
              </div>
            </div>

            {/* Formula */}
            {emission.calculation && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deterministic Arithmetic
                </span>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    padding: '0.85rem 1.1rem',
                    background: 'rgba(0, 0, 0, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '0.35rem',
                    color: '#38bdf8',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {emission.calculation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: EVIDENCE SOURCE & METHODOLOGY */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <BookOpen size={18} color="var(--secondary)" />
          <h3 style={{ fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            3. Regulatory Evidence &amp; Methodology
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authoritative Source</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
              {emission.source || 'IPCC Guidelines for National Greenhouse Gas Inventories'}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Methodology Details</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
              {emission.methodology || 'Deterministic factor multiplication using 100-year GWP'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: IMMUTABLE AUDIT TRAIL */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
              4. Immutable Audit Record #{audit.id || record.id}
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timestamp: {audit.timestamp || record.created_at}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Audit Record ID</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{audit.id || 'N/A'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Emission Record ID</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{audit.emission_id || emission.id || 'N/A'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Engine Factor ID</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{audit.factor_id || emission.factor_id || 'N/A'}</div>
            </div>
          </div>

          {parsedAuditActivity && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Activity Snapshot at Time of Audit
              </span>
              <pre
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  padding: '0.85rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.35rem',
                  color: 'var(--text-secondary)',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(parsedAuditActivity, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmissionDetails;
