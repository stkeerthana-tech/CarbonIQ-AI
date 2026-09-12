import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Database,
  Calculator,
  Scale,
  BookOpen,
  Calendar,
  Search,
  ExternalLink,
  Clock
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export function AuditTrail() {
  const { activeCompany } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityDetails, setActivityDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    async function loadActivities() {
      if (!activeCompany?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.activities.list(activeCompany.id);
        if (res.success && res.data) {
          setActivities(res.data);
          if (res.data.length > 0) {
            setSelectedActivity(res.data[0]);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load activities for audit trail.');
      } finally {
        setLoading(false);
      }
    }

    loadActivities();

    const handleCompanyChange = () => loadActivities();
    window.addEventListener('carboniq-company-changed', handleCompanyChange);
    return () => window.removeEventListener('carboniq-company-changed', handleCompanyChange);
  }, [activeCompany?.id]);

  // Fetch full details with audit record when an activity is selected
  useEffect(() => {
    async function loadAuditRecord() {
      if (!selectedActivity?.id) return;
      setDetailsLoading(true);
      try {
        const res = await api.activities.getById(selectedActivity.id);
        if (res.success) {
          setActivityDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to load audit trail record:', err);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadAuditRecord();
  }, [selectedActivity?.id]);

  const emission = activityDetails?.emission || selectedActivity?.emission;
  const audit = activityDetails?.audit;

  let parsedInput = null;
  try {
    if (audit?.activity_data) {
      parsedInput = JSON.parse(audit.activity_data);
    }
  } catch {
    parsedInput = null;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <ShieldCheck size={26} color="var(--primary)" />
          <h1 style={{ fontSize: '1.85rem' }}>Verification &amp; Audit Trail</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Inspect the immutable calculation lineage from operational input to regulatory emission factor and final carbon output.
        </p>
      </div>

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
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading audit records...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <FileCheck2 size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>No audit records available.</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Record an activity to generate your first backend audit trail.</p>
          <Link to="/activities/new" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <span>Record First Activity</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: List of Auditable Activities */}
          <div className="glass-panel" style={{ padding: '1.25rem', maxHeight: '75vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Auditable Events ({activities.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activities.map((act) => {
                const isSelected = selectedActivity?.id === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => setSelectedActivity(act)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'rgba(30, 41, 59, 0.4)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{act.id} &bull; {act.date}</span>
                      <StatusBadge status={act.emission?.status || 'Needs Review'} size="sm" />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {act.activity}
                    </span>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {Number(act.quantity).toLocaleString()} {act.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Audit Trail Step-by-Step */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {detailsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 0.75rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Constructing audit lineage...</p>
              </div>
            ) : selectedActivity ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Audit Trail for Event #{selectedActivity.id}
                    </span>
                    <h2 style={{ fontSize: '1.45rem', marginTop: '0.2rem' }}>{selectedActivity.activity}</h2>
                  </div>
                  <Link
                    to={`/emissions/${selectedActivity.id}`}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span>Full Record View</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {/* Stepper / Lineage Flow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                  {/* STEP 1: ACTIVITY DATA */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      1
                    </div>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Operational Activity Data
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                        {Number(selectedActivity.quantity).toLocaleString()} {selectedActivity.unit}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Reported Date: {selectedActivity.date} &bull; Activity: {selectedActivity.activity}
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: EMISSION FACTOR */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      2
                    </div>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Emission Factor Retrieved (CSV Database)
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                        {audit?.factor_value ? `${audit.factor_value} kg CO2e / ${selectedActivity.unit}` : emission?.factor_id || 'Pending Review'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Factor Code: {audit?.factor_id || emission?.factor_id || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: DETERMINISTIC CALCULATION */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      3
                    </div>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Deterministic Calculation Formula
                      </div>
                      {emission?.calculation ? (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                          {emission.calculation}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--status-review-text)', marginTop: '0.25rem' }}>
                          Calculation blocked: {emission?.review_reason || 'Factor review required.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 4: VERIFIED RESULT */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      4
                    </div>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Verified Final Result
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {emission?.co2e_tonnes !== null && emission?.co2e_tonnes !== undefined ? (
                          `${emission.co2e_tonnes} tCO2e (${Number(emission.co2e_kg).toLocaleString()} kg)`
                        ) : (
                          <span style={{ color: 'var(--status-review-text)' }}>Status: Needs Review</span>
                        )}
                      </div>
                      <div style={{ marginTop: '0.35rem' }}>
                        <StatusBadge status={emission?.status} />
                      </div>
                    </div>
                  </div>

                  {/* STEP 5: REGULATORY SOURCE & TIMESTAMP */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      5
                    </div>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Evidence Source &amp; Timestamp
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {audit?.source || emission?.source || 'No source recorded.'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} />
                        <span>Audit Recorded At: {audit?.timestamp || selectedActivity.created_at}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
