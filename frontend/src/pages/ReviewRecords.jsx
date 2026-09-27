import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck2,
  User,
  Clock,
  ArrowRight,
  Info,
  Scale,
  Database,
  Check,
  Sparkles,
  Search
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export function ReviewRecords() {
  const { activeCompany } = useOutletContext();
  const { user } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active review modal state
  const [activeReviewItem, setActiveReviewItem] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Reviewed - Valid');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadFlaggedRecords = async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.activities.list(activeCompany.id);
      if (res.success && res.data) {
        // Flagged or reviewed records
        const flagged = res.data.filter(
          (item) =>
            item.emission?.status === 'Needs Review' ||
            item.emission?.status === 'Reviewed - Valid' ||
            item.emission?.status === 'Reviewed - Issue' ||
            item.anomaly?.is_anomaly === true
        );
        setActivities(flagged);
      }
    } catch (err) {
      setError(err.message || 'Failed to load flagged records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlaggedRecords();

    const handleCompanyChange = () => loadFlaggedRecords();
    window.addEventListener('carboniq-company-changed', handleCompanyChange);
    return () => window.removeEventListener('carboniq-company-changed', handleCompanyChange);
  }, [activeCompany?.id]);

  const handleOpenReview = (item) => {
    setActiveReviewItem(item);
    setModalError('');
    setSuccessMsg('');

    // Prepopulate with existing resolution note if already resolved
    const existingRes = item.emission?.resolution;
    let parsedData = null;
    if (existingRes?.activity_data) {
      try {
        parsedData = JSON.parse(existingRes.activity_data);
      } catch (e) {}
    }

    if (item.emission?.status === 'Reviewed - Valid' || item.emission?.status === 'Reviewed - Issue') {
      setReviewDecision(item.emission.status);
    } else {
      setReviewDecision('Reviewed - Valid');
    }

    setResolutionNotes(parsedData?.resolution_notes || existingRes?.review_reason || '');
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!activeReviewItem) return;
    setModalError('');

    const trimmedNotes = resolutionNotes.trim();
    if (!trimmedNotes) {
      setModalError('Resolution notes are required and cannot be blank.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.activities.resolve(activeReviewItem.id, {
        decision: reviewDecision,
        resolution_notes: trimmedNotes,
      });

      if (res.success && res.data) {
        setSuccessMsg(`Activity #${activeReviewItem.id} marked as "${reviewDecision}" successfully.`);
        setActiveReviewItem(null);
        setResolutionNotes('');
        await loadFlaggedRecords();
      } else {
        setModalError(res.error || 'Failed to resolve activity.');
      }
    } catch (err) {
      setModalError(err.message || 'Backend resolution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAuditorOrAdmin = user?.role === 'auditor' || user?.role === 'admin';
  const pendingCount = activities.filter((item) => item.emission?.status === 'Needs Review').length;
  const resolvedCount = activities.filter(
    (item) => item.emission?.status === 'Reviewed - Valid' || item.emission?.status === 'Reviewed - Issue'
  ).length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertOctagon size={22} />
          </div>
          <h1 style={{ fontSize: '1.85rem', letterSpacing: '-0.02em', margin: 0 }}>
            Review &amp; Flagged Records
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Auditor verification workspace for operational items requiring scope clarification, factor confirmation, or anomaly resolution.
        </p>
      </div>

      {/* Info Principle Callout */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid #38bdf8',
          background: 'rgba(56, 189, 248, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Info size={18} color="#38bdf8" />
          <h4 style={{ fontSize: '0.95rem', color: '#38bdf8', margin: 0 }}>GHG Protocol Auditor Protocol</h4>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          Resolving a flagged review records an immutable auditor verification event without overwriting historical calculations. Both the original calculation formula and auditor justification notes are preserved in the permanent audit trail.
        </p>
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
          }}
        >
          {error}
        </div>
      )}

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Flagged &bull; History</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {activities.length}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Awaiting Resolution</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
            {pendingCount}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auditor Resolved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading flagged activity records...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={40} style={{ margin: '0 auto 1rem', color: '#10b981', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No Flagged Records</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            All activity records for this organization have verified emission factors and deterministic results.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activities.map((item) => {
            const emission = item.emission || {};
            const resolution = emission.resolution;
            let resolutionData = null;
            if (resolution?.activity_data) {
              try {
                resolutionData = JSON.parse(resolution.activity_data);
              } catch (e) {}
            }

            const isResolved = emission.status === 'Reviewed - Valid' || emission.status === 'Reviewed - Issue';
            const isNeedsReview = emission.status === 'Needs Review';

            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  borderLeft: isResolved
                    ? emission.status === 'Reviewed - Valid'
                      ? '4px solid #10b981'
                      : '4px solid #fb923c'
                    : '4px solid #fbbf24',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Event #{item.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&bull; {item.date}</span>
                      <StatusBadge status={emission.status} />
                      {item.anomaly?.is_anomaly && <StatusBadge isAnomaly />}
                    </div>
                    <h3 style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>{item.activity}</h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Number(item.quantity).toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Assigned: {emission.scope || 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Calculation Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.85rem',
                    padding: '1rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Emission Factor Code</span>
                    <strong style={{ color: 'var(--primary-light)' }}>{emission.factor_id || 'Pending Review'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Calculated Value</span>
                    <strong style={{ color: emission.co2e_tonnes ? 'var(--text-primary)' : 'var(--status-review-color)' }}>
                      {emission.co2e_tonnes !== null && emission.co2e_tonnes !== undefined
                        ? `${emission.co2e_tonnes} tCO2e (${Number(emission.co2e_kg).toLocaleString()} kg)`
                        : 'Blocked (CO2-only / Missing factor)'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Regulatory Source</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{emission.source || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Methodology</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{emission.methodology || 'GHG Protocol'}</span>
                  </div>
                </div>

                {/* Engine Flag Reason */}
                <div
                  style={{
                    padding: '0.9rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: isNeedsReview ? 'var(--status-review-bg)' : 'var(--bg-card-hover)',
                    border: isNeedsReview ? '1px solid var(--status-review-border)' : '1px solid var(--border-subtle)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong style={{ color: isNeedsReview ? 'var(--status-review-color)' : 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Engine Flag Reason:
                  </strong>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                    {item.anomaly?.is_anomaly && emission.status !== 'Needs Review'
                      ? item.anomaly.message
                      : emission.review_reason || 'Record requires verification against operational source evidence.'}
                  </p>
                </div>

                {/* Resolved Audit Record Display */}
                {isResolved && (
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      background: emission.status === 'Reviewed - Valid' ? 'var(--status-valid-bg)' : 'var(--status-issue-bg)',
                      border: `1px solid ${emission.status === 'Reviewed - Valid' ? 'var(--status-valid-border)' : 'var(--status-issue-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: emission.status === 'Reviewed - Valid' ? 'var(--status-valid-color)' : 'var(--status-issue-color)' }}>
                        <ShieldCheck size={18} />
                        <strong style={{ fontSize: '0.9rem' }}>Auditor Verification Recorded</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Status: <strong style={{ color: 'var(--text-primary)' }}>{emission.status}</strong>
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                      <strong>Auditor Justification:</strong> "{resolutionData?.resolution_notes || resolution?.review_reason || 'Verified by independent auditor.'}"
                    </p>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Reviewer: {resolutionData?.reviewer_name || resolutionData?.reviewer_email || 'Authorized Staff'} ({resolutionData?.reviewer_role || 'auditor'})</span>
                      <span>Resolved At: {resolutionData?.resolved_at ? new Date(resolutionData.resolved_at).toLocaleString() : (resolution?.timestamp || 'Recorded')}</span>
                    </div>
                  </div>
                )}

                {/* Footer Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Link
                    to={`/emissions/${item.id}`}
                    style={{
                      color: 'var(--secondary)',
                      fontSize: '0.825rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 500,
                    }}
                  >
                    <FileCheck2 size={15} />
                    <span>View Evidence Lineage</span>
                  </Link>

                  {isAuditorOrAdmin ? (
                    <button
                      onClick={() => handleOpenReview(item)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.95rem' }}
                    >
                      <ShieldCheck size={15} />
                      <span>{isResolved ? 'Re-evaluate Review' : 'Perform Auditor Review'}</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      (Auditor or Administrator role required to resolve reviews)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Resolution Modal */}
      {activeReviewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '580px',
              padding: '2rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.35rem', margin: 0 }}>Human Auditor Verification</h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Activity #{activeReviewItem.id}: <strong>{activeReviewItem.activity}</strong> ({Number(activeReviewItem.quantity).toLocaleString()} {activeReviewItem.unit})
            </p>

            {modalError && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--status-flagged-bg)', border: '1px solid var(--status-flagged-border)', color: 'var(--status-flagged-color)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveResolution}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Auditor Determination</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: reviewDecision === 'Reviewed - Valid' ? 'var(--status-valid-bg)' : 'var(--bg-input)',
                      border: reviewDecision === 'Reviewed - Valid' ? '1px solid var(--status-valid-border)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: reviewDecision === 'Reviewed - Valid' ? 'var(--status-valid-color)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="Reviewed - Valid"
                      checked={reviewDecision === 'Reviewed - Valid'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span>Reviewed – Valid</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: reviewDecision === 'Reviewed - Issue' ? 'var(--status-issue-bg)' : 'var(--bg-input)',
                      border: reviewDecision === 'Reviewed - Issue' ? '1px solid var(--status-issue-border)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: reviewDecision === 'Reviewed - Issue' ? 'var(--status-issue-color)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="Reviewed - Issue"
                      checked={reviewDecision === 'Reviewed - Issue'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                      style={{ accentColor: '#f97316' }}
                    />
                    <span>Reviewed – Issue</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="resolution-notes" style={{ fontWeight: 600 }}>
                  Auditor Resolution Notes &amp; Evidence Cross-Reference
                </label>
                <textarea
                  id="resolution-notes"
                  className="form-textarea"
                  rows={4}
                  placeholder="e.g. Cross-referenced with utility invoice #INV-8821. Elevated consumption confirmed due to temporary expansion. Factor methodology verified."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.875rem' }}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  This resolution rationale will be appended as an immutable audit record with your user ID and timestamp.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveReviewItem(null)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Persisting Resolution...' : 'Resolve Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewRecords;
