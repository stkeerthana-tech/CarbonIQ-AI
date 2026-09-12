import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileSpreadsheet,
  PlusCircle,
  Calculator,
  RefreshCw,
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import ScopeBreakdown from '../components/ScopeBreakdown';
import StatusBadge from '../components/StatusBadge';

export function Dashboard() {
  const { activeCompany } = useOutletContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError('');

    try {
      // Fetch aggregated dashboard metrics
      const dashRes = await api.dashboard.get(activeCompany.id);
      if (dashRes.success) {
        setDashboardData(dashRes.data);
      }

      // Fetch recent activities for anomaly tally and recent list
      const actRes = await api.activities.list(activeCompany.id);
      if (actRes.success && actRes.data) {
        setRecentActivities(actRes.data.slice(0, 5));

        // Count flagged/anomalies (if activity quantity is anomalous or status is flagged)
        const flagged = actRes.data.filter(
          (a) => a.emission?.status === 'Needs Review' || a.emission?.status?.includes('Flagged')
        ).length;
        setAnomalyCount(flagged);
      }
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleCompanyChange = () => {
      fetchDashboard();
    };
    window.addEventListener('carboniq-company-changed', handleCompanyChange);
    return () => window.removeEventListener('carboniq-company-changed', handleCompanyChange);
  }, [activeCompany?.id]);

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading verified carbon intelligence...</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Carbon Intelligence Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Verified emissions portfolio for <strong style={{ color: 'var(--text-primary)' }}>{activeCompany?.company_name || 'Organization'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchDashboard}
            className="btn btn-secondary"
            title="Refresh metrics from backend"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/activities/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Add Activity</span>
          </Link>
        </div>
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

      {/* Top 4 Core Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <MetricCard
          title="Total Emissions"
          value={dashboardData ? dashboardData.total_co2e_tonnes : 0}
          unit="tCO2e"
          icon={Cloud}
          color="emerald"
          subtitle="Net verified greenhouse gas footprint"
        />

        <MetricCard
          title="Scope 1"
          value={dashboardData ? dashboardData.scope_1_tonnes : 0}
          unit="tCO2e"
          icon={Cloud}
          color="sky"
          subtitle="Direct combustion &amp; operations"
        />

        <MetricCard
          title="Scope 2"
          value={dashboardData ? dashboardData.scope_2_tonnes : 0}
          unit="tCO2e"
          icon={Cloud}
          color="indigo"
          subtitle="Purchased grid electricity"
        />

        <MetricCard
          title="Scope 3"
          value={dashboardData ? dashboardData.scope_3_tonnes : 0}
          unit="tCO2e"
          icon={Cloud}
          color="purple"
          subtitle="Indirect value chain &amp; travel"
        />
      </div>

      {/* Second Row: Verification & Quality Status Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <MetricCard
          title="Total Activities"
          value={dashboardData ? dashboardData.activity_count : 0}
          unit="records"
          icon={FileSpreadsheet}
          color="sky"
          subtitle="Logged operational events"
        />

        <MetricCard
          title="Calculated Records"
          value={dashboardData ? dashboardData.calculated_count : 0}
          unit="verified"
          icon={CheckCircle2}
          color="emerald"
          subtitle="Deterministic CO2e verified"
        />

        <MetricCard
          title="Needs Review"
          value={dashboardData ? dashboardData.needs_review_count : 0}
          unit="pending"
          icon={AlertTriangle}
          color="amber"
          subtitle="Awaiting evidence or factor"
          alert={dashboardData && dashboardData.needs_review_count > 0}
        />

        <MetricCard
          title="Anomalies / Flagged"
          value={anomalyCount}
          unit="flagged"
          icon={AlertOctagon}
          color="rose"
          subtitle="Statistical deviation detected"
          alert={anomalyCount > 0}
        />
      </div>

      {/* Scope Breakdown Visualizer */}
      <ScopeBreakdown
        scope1={dashboardData?.scope_1_tonnes || 0}
        scope2={dashboardData?.scope_2_tonnes || 0}
        scope3={dashboardData?.scope_3_tonnes || 0}
        total={dashboardData?.total_co2e_tonnes || 0}
      />

      {/* Recent Activities Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>Recent Activity Submissions</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Most recent entries processed by the deterministic carbon engine
            </p>
          </div>
          <Link to="/activities" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}>
            <span>View All History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No activity records yet.</p>
            <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>Submit your first business activity to begin tracking.</p>
            <Link to="/activities/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              <PlusCircle size={15} />
              <span>Record Activity</span>
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Quantity</th>
                  <th>Scope</th>
                  <th>Calculated CO2e</th>
                  <th>Verification Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((item) => {
                  const emission = item.emission;
                  const isNeedsReview = emission?.status === 'Needs Review';
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.date}</td>
                      <td style={{ fontWeight: 600 }}>{item.activity}</td>
                      <td>
                        {Number(item.quantity).toLocaleString()} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.unit}</span>
                      </td>
                      <td>
                        {emission?.scope ? (
                          <StatusBadge scope={emission.scope} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {isNeedsReview ? (
                          <span style={{ color: 'var(--status-review-text)', fontSize: '0.85rem' }}>Needs Review</span>
                        ) : emission?.co2e_tonnes !== null && emission?.co2e_tonnes !== undefined ? (
                          <span>{emission.co2e_tonnes} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tCO2e</span></span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <StatusBadge status={emission?.status || 'Needs Review'} />
                      </td>
                      <td>
                        <Link
                          to={`/emissions/${item.id}`}
                          style={{
                            color: 'var(--primary)',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>Audit</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
