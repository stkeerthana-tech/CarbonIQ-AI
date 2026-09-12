import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  PlusCircle,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

// Unit map corresponding to the CSV definitions
const ACTIVITY_UNITS = {
  'Grid electricity': 'kWh',
  'Diesel combustion': 'litre',
  'Petrol combustion - stationary': 'litre',
  'Natural gas combustion': 'SCM',
  'Domestic air travel': 'passenger-km',
  'Diesel LDV road travel': 'litre',
};

export function AddActivity() {
  const navigate = useNavigate();
  const { activeCompany } = useOutletContext();

  const [supportedActivities, setSupportedActivities] = useState([
    'Grid electricity',
    'Diesel combustion',
    'Petrol combustion - stationary',
    'Natural gas combustion',
    'Domestic air travel',
    'Diesel LDV road travel',
  ]);

  const [activity, setActivity] = useState('Diesel combustion');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('litre');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scopeOverride, setScopeOverride] = useState('');

  // Preview and Submission state
  const [previewResult, setPreviewResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch supported activities from backend endpoint
  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await api.activities.getSupported();
        if (res.success && res.data && res.data.length > 0) {
          setSupportedActivities(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch supported activities list:', err);
      }
    }
    loadActivities();
  }, []);

  // Sync unit when activity changes
  const handleActivityChange = (newActivity) => {
    setActivity(newActivity);
    setPreviewResult(null);
    setSubmissionResult(null);
    if (ACTIVITY_UNITS[newActivity]) {
      setUnit(ACTIVITY_UNITS[newActivity]);
    }
  };

  // 1. Preview calculation on-demand (does NOT save record)
  const handlePreviewCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmissionResult(null);

    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid positive quantity greater than zero.');
      return;
    }

    setPreviewLoading(true);
    try {
      const payload = {
        activity,
        quantity: Number(quantity),
        unit,
        date,
        ...(activity === 'Diesel LDV road travel' && scopeOverride ? { scope_override: scopeOverride } : {}),
      };

      const res = await api.emissions.calculate(payload);
      if (res.success) {
        setPreviewResult(res.data);
      } else {
        setError(res.error || 'Calculation preview failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to execute calculation preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 2. Submit and persist official ActivityRecord + EmissionResult + AuditRecord
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeCompany?.id) {
      setError('No active organization selected.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid positive quantity greater than zero.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        company_id: activeCompany.id,
        activity,
        quantity: Number(quantity),
        unit,
        date,
        ...(activity === 'Diesel LDV road travel' && scopeOverride ? { scope_override: scopeOverride } : {}),
      };

      const res = await api.activities.create(payload);
      if (res.success) {
        setSubmissionResult(res.data);
        setPreviewResult(null);
      } else {
        setError(res.error || 'Activity submission failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to save activity.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Record Carbon Activity</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter verified operational activity data. The backend engine retrieves the emission factor, performs deterministic CO2e arithmetic, and writes an audit log.
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Success Banner */}
      {submissionResult && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid var(--primary)',
            background: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{ color: 'var(--primary)', marginTop: '0.1rem' }}>
              <CheckCircle2 size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                Activity Successfully Recorded &amp; Audited
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Activity ID #{submissionResult.activity?.id} has been logged with immutable audit record #{submissionResult.audit_id}.
              </p>

              {/* Anomaly Detection Warning if triggered */}
              {submissionResult.anomaly?.is_anomaly && (
                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  <AlertOctagon size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
                      Statistical Anomaly Detected
                    </strong>
                    {submissionResult.anomaly.message}
                  </div>
                </div>
              )}

              {/* Result Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                  <div><StatusBadge status={submissionResult.emission?.status || submissionResult.status} /></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope</span>
                  <div><StatusBadge scope={submissionResult.emission?.scope || submissionResult.scope || 'Unassigned'} /></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calculated CO2e</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {submissionResult.emission?.co2e_tonnes !== null && submissionResult.emission?.co2e_tonnes !== undefined ? (
                      `${submissionResult.emission.co2e_tonnes} tCO2e`
                    ) : (
                      <span style={{ color: 'var(--status-review-text)' }}>Needs Review</span>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Methodology</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {submissionResult.emission?.source || submissionResult.source || 'IPCC 2006'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate(`/emissions/${submissionResult.activity?.id}`)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <FileCheck size={16} />
                  <span>View Verified Evidence &amp; Audit Trail</span>
                </button>
                <button
                  onClick={() => {
                    setSubmissionResult(null);
                    setQuantity('');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <span>Record Another Activity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Activity Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="activity-select">
                Activity Type
              </label>
              <select
                id="activity-select"
                className="form-select"
                value={activity}
                onChange={(e) => handleActivityChange(e.target.value)}
                disabled={submitLoading || previewLoading}
              >
                {supportedActivities.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Matches verified emission factors from official CSV database
              </span>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label" htmlFor="activity-quantity">
                Quantity
              </label>
              <input
                id="activity-quantity"
                type="number"
                step="any"
                min="0.0001"
                className="form-input"
                placeholder="e.g. 2000"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setPreviewResult(null);
                }}
                required
                disabled={submitLoading || previewLoading}
              />
            </div>

            {/* Unit (Locked to match verified factor unit) */}
            <div className="form-group">
              <label className="form-label" htmlFor="activity-unit">
                Measurement Unit
              </label>
              <input
                id="activity-unit"
                type="text"
                className="form-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                disabled={submitLoading || previewLoading}
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="activity-date">
                Activity Date
              </label>
              <input
                id="activity-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={submitLoading || previewLoading}
              />
            </div>
          </div>

          {/* Special case: Diesel LDV road travel Scope ownership */}
          {activity === 'Diesel LDV road travel' && (
            <div
              style={{
                marginTop: '0.5rem',
                marginBottom: '1.25rem',
                padding: '1rem',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Info size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
                  Vehicle Ownership Declaration
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Scope 1 applies if the vehicle is company-owned or under operational control. Scope 3 applies for third-party transport. If undeclared, status will be flagged as "Needs Review".
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership"
                    value="Scope 1"
                    checked={scopeOverride === 'Scope 1'}
                    onChange={(e) => setScopeOverride(e.target.value)}
                  />
                  <span>Company-Owned / Controlled (Scope 1)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership"
                    value="Scope 3"
                    checked={scopeOverride === 'Scope 3'}
                    onChange={(e) => setScopeOverride(e.target.value)}
                  />
                  <span>Third-Party / Leased Vehicle (Scope 3)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership"
                    value=""
                    checked={scopeOverride === ''}
                    onChange={(e) => setScopeOverride('')}
                  />
                  <span>Unspecified (Requires Review)</span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePreviewCalculate}
              className="btn btn-secondary"
              disabled={previewLoading || submitLoading}
            >
              {previewLoading ? (
                <>
                  <span className="spinner" style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator size={16} />
                  <span>Preview Calculation</span>
                </>
              )}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitLoading || previewLoading}
            >
              {submitLoading ? (
                <>
                  <span className="spinner" style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  <span>Recording Activity...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Record &amp; Create Audit Trail</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* On-Demand Preview Result Display */}
      {previewResult && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview Calculation Engine Output
              </span>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>{previewResult.activity}</h3>
            </div>
            <StatusBadge status={previewResult.status} />
          </div>

          {previewResult.status === 'Needs Review' ? (
            <div
              style={{
                padding: '1.25rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#fbbf24',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} />
                <strong style={{ fontSize: '0.95rem' }}>Review Required</strong>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                {previewResult.review_reason || 'No verified CO2e emission factor is available.'}
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'rgba(251, 191, 36, 0.8)' }}>
                The system did not calculate an unsupported CO2e value. A certified carbon accountant must review this record.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
                background: 'rgba(15, 23, 42, 0.5)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Scope</span>
                <div style={{ marginTop: '0.25rem' }}><StatusBadge scope={previewResult.scope} /></div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emission Factor</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {previewResult.emission_factor} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{previewResult.factor_unit}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated Total</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                  {previewResult.co2e_kg?.toLocaleString()} kg CO2e
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ({previewResult.co2e_tonnes} tonnes)
                </div>
              </div>
            </div>
          )}

          {/* Transparent Calculation Breakdown */}
          {previewResult.calculation && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Deterministic Formula
              </span>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.35rem',
                  color: 'var(--secondary)',
                }}
              >
                {previewResult.calculation}
              </div>
            </div>
          )}

          {previewResult.source && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Evidence Source:</strong> {previewResult.source}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddActivity;
