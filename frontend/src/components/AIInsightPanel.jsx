import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Bot, Lock } from 'lucide-react';
import api from '../services/api';

const INSIGHT_SECTIONS = [
  { title: 'Review Status', keys: ['status', 'review_status'] },
  { title: 'Emissions Summary', keys: ['emissions_summary', 'emission_summary', 'total_emissions'] },
  { title: 'Scope Analysis', keys: ['scope_analysis', 'scope_distribution', 'scopes'] },
  { title: 'Data Quality', keys: ['data_quality', 'quality_assessment'] },
  { title: 'Key Findings', keys: ['key_findings', 'findings'] },
  { title: 'Highest-Emission Activities', keys: ['highest_emission_activities', 'highest_emitting_activities'] },
  { title: 'Review / Compliance Concerns', keys: ['compliance_concerns', 'review_concerns', 'concerns', 'red_flags'] },
  { title: 'Evidence', keys: ['evidence', 'evidence_summary'] },
  { title: 'Recommendations', keys: ['recommendations', 'reduction_recommendations'] },
];

function parseInsight(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function InsightValue({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {value.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.35rem' }}>
            <InsightValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <strong>{humanizeKey(key)}:</strong>{' '}
            <InsightValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  return <>{String(value ?? '')}</>;
}

function StructuredInsight({ insight }) {
  const usedKeys = new Set();
  const sections = INSIGHT_SECTIONS.flatMap(({ title, keys }) => {
    const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(insight, candidate));
    if (!key || insight[key] === null || insight[key] === '') return [];
    usedKeys.add(key);
    return [{ title, value: insight[key] }];
  });

  const additional = Object.entries(insight).filter(([key, value]) => (
    !usedKeys.has(key) && value !== null && value !== ''
  ));
  if (additional.length > 0) sections.push({ title: 'Additional Details', value: Object.fromEntries(additional) });

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sections.map(({ title, value }) => (
        <section key={title}>
          <h4 style={{ margin: '0 0 0.35rem', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            {title}
          </h4>
          <div><InsightValue value={value} /></div>
        </section>
      ))}
    </div>
  );
}

/**
 * AIInsightPanel
 * --------------
 * Renders an AI-powered carbon intelligence review on the Dashboard.
 *
 * Rules (enforced at component level):
 *  - Reads dashboardData from props — never fetches emission numbers itself.
 *  - Calls POST /api/ai/insights with verified context only.
 *  - Clearly labels output as "AI Analysis" to distinguish from verified data.
 *  - Handles disabled / unconfigured gracefully (no crash, no blank space).
 */
export function AIInsightPanel({ companyId, dashboardData }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [enabled, setEnabled] = useState(true);
  const [generated, setGenerated] = useState(false);
  const parsedInsight = parseInsight(insight);

  const handleGenerate = async () => {
    if (!companyId || !dashboardData) return;
    setLoading(true);
    setError('');
    setInsight('');

    try {
      const res = await api.ai.getInsight(companyId, dashboardData);
      if (res.success && res.data) {
        setInsight(res.data.insight || '');
        setEnabled(res.data.enabled !== false);
        setGenerated(true);
      } else {
        setError(res.error || 'Could not retrieve AI insight.');
      }
    } catch (err) {
      if (err.status === 401) return; // handled globally
      setError(err.message || 'Unable to reach the AI agent.');
    } finally {
      setLoading(false);
    }
  };

  /* ── styles ─────────────────────────────────────────────────────────── */
  const panelStyle = {
    background: 'linear-gradient(135deg, rgba(16,16,32,0.85) 0%, rgba(10,20,40,0.92) 100%)',
    border: generated && enabled
      ? '1px solid rgba(52, 211, 153, 0.35)'
      : '1px solid rgba(99,102,241,0.25)',
    borderRadius: 'var(--radius-lg, 16px)',
    padding: '1.75rem',
    marginBottom: '2rem',
    backdropFilter: 'blur(12px)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: generated && enabled
      ? '0 0 40px rgba(52,211,153,0.06), 0 4px 24px rgba(0,0,0,0.35)'
      : '0 4px 24px rgba(0,0,0,0.3)',
    transition: 'border 0.4s ease, box-shadow 0.4s ease',
  };

  const glowStyle = {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  };

  const insightBoxStyle = {
    background: 'rgba(52, 211, 153, 0.04)',
    border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '10px',
    padding: '1.25rem 1.5rem',
    lineHeight: 1.75,
    fontSize: '0.895rem',
    color: 'var(--text-primary, #e2e8f0)',
    whiteSpace: 'pre-wrap',
    maxHeight: '420px',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(52,211,153,0.3) transparent',
  };

  const skeletonLineStyle = (width) => ({
    height: '14px',
    width,
    borderRadius: '7px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.6s infinite',
    marginBottom: '10px',
  });

  const disclaimerStyle = {
    marginTop: '0.85rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted, #64748b)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  };

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div style={panelStyle}>
      <div style={glowStyle} />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ai-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s, transform 0.15s;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          box-shadow: 0 2px 14px rgba(99,102,241,0.35);
        }
        .ai-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }
        .ai-btn:not(:disabled):hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.65rem;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #a5b4fc;
          text-transform: uppercase;
        }
      `}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>
          <Sparkles size={20} style={{ color: '#818cf8' }} />
          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>
            AI Carbon Intelligence
          </h3>
          <span className="ai-badge">
            <Bot size={11} /> Lyzr Agent
          </span>
        </div>

        <button
          className="ai-btn"
          onClick={handleGenerate}
          disabled={loading || !dashboardData}
          id="ai-generate-insight-btn"
        >
          {loading ? (
            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Sparkles size={15} />
          )}
          {generated ? 'Regenerate Review' : 'Generate AI Review'}
        </button>
      </div>

      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.25rem', marginTop: 0 }}>
        AI-powered compliance review and reduction recommendations — based on the verified emission data above.
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div aria-label="Loading AI insight" role="status">
          {['85%', '70%', '90%', '60%', '75%'].map((w, i) => (
            <div key={i} style={skeletonLineStyle(w)} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
          padding: '1rem',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px',
          color: '#f87171',
          fontSize: '0.875rem',
        }}>
          <AlertTriangle size={17} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Disabled / not configured */}
      {!loading && !error && generated && !enabled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '1rem',
          background: 'rgba(100,116,139,0.08)',
          border: '1px solid rgba(100,116,139,0.2)',
          borderRadius: '10px',
          color: 'var(--text-muted, #64748b)',
          fontSize: '0.875rem',
        }}>
          <Lock size={16} style={{ flexShrink: 0 }} />
          <span>AI insights are not available. Please configure <code>LYZR_API_KEY</code> and <code>LYZR_AGENT_ID</code> in the backend <code>.env</code> file.</span>
        </div>
      )}

      {/* Idle state (not yet generated) */}
      {!loading && !error && !generated && (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--text-muted, #64748b)',
          fontSize: '0.875rem',
        }}>
          <Bot size={30} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
          <p style={{ margin: 0 }}>
            Click <strong style={{ color: 'var(--text-secondary)' }}>Generate AI Review</strong> to get a
            compliance analysis and reduction recommendations from the CarbonIQ AI agent.
          </p>
        </div>
      )}

      {/* AI response */}
      {!loading && !error && generated && enabled && insight && (
        <>
          <div style={insightBoxStyle}>
            {parsedInsight ? <StructuredInsight insight={parsedInsight} /> : insight}
          </div>
          <div style={disclaimerStyle}>
            <Lock size={11} />
            All emission figures are sourced from the verified backend calculation engine. The AI provides
            reasoning only and does not modify any data.
          </div>
        </>
      )}
    </div>
  );
}

export default AIInsightPanel;
