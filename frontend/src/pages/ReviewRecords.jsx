import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileCheck2,
  User,
  Clock,
  ArrowRight,
  Info
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

  // Local/Session state for human review decisions (persisted for hackathon demo)
  const [reviewDecisions, setReviewDecisions] = useState(() => {
    try {
      const saved = localStorage.getItem('carboniq_human_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal / Form state for active review
  const [activeReviewItem, setActiveReviewItem] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Reviewed – Valid');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    async function loadFlaggedRecords() {
      if (!activeCompany?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.activities.list(activeCompany.id);
        if (res.success && res.data) {
          // Filter records that need review or are high quantity
          const flagged = res.data.filter(
            (item) =>
              item.emission?.status === 'Needs Review' ||
              item.quantity > 5000 || // highlight potential high values
              reviewDecisions[item.id]
          );
          setActivities(flagged);
        }
      } catch (err) {
        setError(err.message || 'Failed to load flagged records.');
      } finally {
        setLoading(false);
      }
    }

    loadFlaggedRecords();

    const handleCompanyChange = () => loadFlaggedRecords();
    window.addEventListener('carboniq-company-changed', handleCompanyChange);
    return () => window.removeEventListener('carboniq-company-changed', handleCompanyChange);
  }, [activeCompany?.id, reviewDecisions]);

  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!activeReviewItem) return;

    if (!reviewReason.trim()) {
      alert('Please provide an explanatory review reason.');
      return;
    }

    setReviewSubmitting(true);
    const newDecision = {
      original_status: activeReviewItem.emission?.status || 'Needs Review',
      review_decision: reviewDecision,
      review_reason: reviewReason.trim(),
      reviewed_by: user?.name || user?.email || 'Authorized Auditor',
      reviewed_at: new Date().toISOString(),
    };

    const updated = {
      ...reviewDecisions,
      [activeReviewItem.id]: newDecision,
    };

    setReviewDecisions(updated);
    localStorage.setItem('carboniq_human_reviews', JSON.stringify(updated));

    setReviewSubmitting(false);
    setActiveReviewItem(null);
    setReviewReason('');
  };

  const isAuditorOrAdmin = user?.role === 'auditor' || user?.role === 'admin';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <AlertOctagon size={26} color="#fbbf24" />
          <h1 style={{ fontSize: '1.85rem' }}>Review &amp; Flagged Records</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Human review lifecycle for operational records requiring verification, scope clarity, or statistical anomaly clearance.
        </p>
      </div>

      {/* Info Callout */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid #38bdf8',
          background: 'rgba(56, 189, 248, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Info size={18} color="#38bdf8" />
          <h4 style={{ fontSize: '0.95rem', color: '#38bdf8' }}>GHG Protocol Evidence Principle</h4>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          A flagged record does not automatically imply incorrect operational data. It indicates the system detected ambiguous scope, a CO2-only factor, or a value requiring human auditor confirmation.
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
          <p style={{ color: 'var(--text-secondary)' }}>Scanning for flagged records...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={42} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No flagged records.
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            All current activity records have verified CO2e factors with no detected anomalies.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activities.map((item) => {
            const decision = reviewDecisions[item.id];
            const emission = item.emission || {};
            const isNeedsReview = emission.status === 'Needs Review';

            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  borderLeft: `4px solid ${
                    decision
                      ? decision.review_decision.includes('Valid')
                        ? 'var(--status-valid-text)'
                        : 'var(--status-issue-text)'
                      : '#fbbf24'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event #{item.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&bull; {item.date}</span>
                      {decision ? (
                        <StatusBadge status={decision.review_decision} />
                      ) : (
                        <StatusBadge status={emission.status || 'Needs Review'} />
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.35rem' }}>{item.activity}</h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      {Number(item.quantity).toLocaleString()} {item.unit}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Scope: {emission.scope || 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Reason & Status Details */}
                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Engine Flag Reason:
                  </strong>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {emission.review_reason || 'Record requires auditor verification against operational source evidence.'}
                  </p>
                </div>

                {/* Completed Human Review Display */}
                {decision ? (
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      background: 'rgba(20, 184, 166, 0.08)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--status-valid-text)' }}>
                      <ShieldCheck size={18} />
                      <strong style={{ fontSize: '0.9rem' }}>Human Review Completed</strong>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      <strong>Auditor Reason:</strong> "{decision.review_reason}"
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Reviewed by: {decision.reviewed_by}</span>
                      <span>At: {new Date(decision.reviewed_at).toLocaleString()}</span>
                      <span>Decision: {decision.review_decision}</span>
                    </div>
                  </div>
                ) : null}

                {/* Action Bar */}
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
                    <FileCheck2 size={14} />
                    <span>View Evidence Lineage</span>
                  </Link>

                  {isAuditorOrAdmin ? (
                    <button
                      onClick={() => {
                        setActiveReviewItem(item);
                        setReviewReason(decision ? decision.review_reason : '');
                        setReviewDecision(decision ? decision.review_decision : 'Reviewed – Valid');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
                    >
                      <span>{decision ? 'Update Review' : 'Perform Human Review'}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      (Auditor or Admin role required to perform review)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
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
              maxWidth: '560px',
              padding: '2rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Human Auditor Verification
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Event #{activeReviewItem.id}: {activeReviewItem.activity} ({Number(activeReviewItem.quantity).toLocaleString()} {activeReviewItem.unit})
            </p>

            <form onSubmit={handleSaveReview}>
              <div className="form-group">
                <label className="form-label">Review Decision</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="Reviewed – Valid"
                      checked={reviewDecision === 'Reviewed – Valid'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                    />
                    <span style={{ color: 'var(--status-valid-text)', fontWeight: 600 }}>Reviewed – Valid</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="Reviewed – Issue"
                      checked={reviewDecision === 'Reviewed – Issue'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                    />
                    <span style={{ color: 'var(--status-issue-text)', fontWeight: 600 }}>Reviewed – Issue</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="review-reason">
                  Auditor Justification / Review Reason
                </label>
                <textarea
                  id="review-reason"
                  className="form-textarea"
                  rows={4}
                  placeholder="e.g. New production facility became operational in Q3, explaining the elevated fuel consumption. Invoices cross-checked and verified."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  This reason will be permanently attached to the auditor record.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveReviewItem(null)}
                  className="btn btn-secondary"
                  disabled={reviewSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Saving...' : 'Submit Verification'}
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
