import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Calculator, AlertTriangle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const ACTIVITY_UNITS = {
  'Grid electricity': 'kWh',
  'Diesel combustion': 'litre',
  'Petrol combustion - stationary': 'litre',
  'Natural gas combustion': 'SCM',
  'Domestic air travel': 'passenger-km',
  'Diesel LDV road travel': 'litre',
};

export function CalculatePreview() {
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
  const [quantity, setQuantity] = useState('2000');
  const [unit, setUnit] = useState('litre');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scopeOverride, setScopeOverride] = useState('');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await api.activities.getSupported();
        if (res.success && res.data) setSupportedActivities(res.data);
      } catch (err) {
        console.warn('Could not fetch supported activities:', err);
      }
    }
    loadActivities();
  }, []);

  const handleActivityChange = (act) => {
    setActivity(act);
    setResult(null);
    if (ACTIVITY_UNITS[act]) setUnit(ACTIVITY_UNITS[act]);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');

    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company_id: activeCompany?.id,
        activity,
        quantity: Number(quantity),
        unit,
        date,
        ...(activity === 'Diesel LDV road travel' && scopeOverride ? { scope_override: scopeOverride } : {}),
      };

      const res = await api.emissions.calculate(payload);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Calculation failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to execute calculation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Calculator size={26} color="var(--primary)" />
          <h1 style={{ fontSize: '1.85rem' }}>On-Demand Carbon Calculator</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Instant deterministic CO2e arithmetic using verified factors. Preview calculations without writing to the database.
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
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleCalculate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-activity">Activity Type</label>
              <select
                id="calc-activity"
                className="form-select"
                value={activity}
                onChange={(e) => handleActivityChange(e.target.value)}
              >
                {supportedActivities.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calc-qty">Quantity</label>
              <input
                id="calc-qty"
                type="number"
                step="any"
                min="0.0001"
                className="form-input"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setResult(null);
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calc-unit">Unit</label>
              <input
                id="calc-unit"
                type="text"
                className="form-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calc-date">Event Date</label>
              <input
                id="calc-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {activity === 'Diesel LDV road travel' && (
            <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', display: 'block', marginBottom: '0.4rem' }}>
                Scope Assignment
              </span>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership_preview"
                    value="Scope 1"
                    checked={scopeOverride === 'Scope 1'}
                    onChange={(e) => setScopeOverride(e.target.value)}
                  />
                  <span>Scope 1 (Company-Owned)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership_preview"
                    value="Scope 3"
                    checked={scopeOverride === 'Scope 3'}
                    onChange={(e) => setScopeOverride(e.target.value)}
                  />
                  <span>Scope 3 (Third-Party)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_ownership_preview"
                    value=""
                    checked={scopeOverride === ''}
                    onChange={(e) => setScopeOverride('')}
                  />
                  <span>Unspecified</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                <span>Executing Deterministic Engine...</span>
              </>
            ) : (
              <>
                <Calculator size={17} />
                <span>Calculate CO2e</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Output Panel */}
      {result && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', borderLeft: `4px solid ${result.status === 'Needs Review' ? '#fbbf24' : 'var(--primary)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calculation Result</span>
              <h3 style={{ fontSize: '1.45rem', marginTop: '0.2rem' }}>{result.activity}</h3>
            </div>
            <StatusBadge status={result.status} />
          </div>

          {result.status === 'Needs Review' ? (
            <div style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>Status: Needs Review</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {result.review_reason}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {result.methodology}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope</span>
                  <div style={{ marginTop: '0.25rem' }}><StatusBadge scope={result.scope} /></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emission Factor</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>
                    {result.emission_factor} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.factor_unit}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified CO2e</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                    {result.co2e_kg?.toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ({result.co2e_tonnes} tonnes)
                  </div>
                </div>
              </div>

              {result.calculation && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calculation Arithmetic</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', color: '#38bdf8', marginTop: '0.35rem' }}>
                    {result.calculation}
                  </div>
                </div>
              )}

              {result.source && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong>Source:</strong> {result.source}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/activities/new" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <span>Submit as Official Record</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalculatePreview;
