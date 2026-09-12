import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export function ActivityHistory() {
  const { activeCompany } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchActivities = async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.activities.list(activeCompany.id);
      if (res.success && res.data) {
        setActivities(res.data);
      } else {
        setError(res.error || 'Failed to retrieve activities.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    const handleCompanyChange = () => fetchActivities();
    window.addEventListener('carboniq-company-changed', handleCompanyChange);
    return () => window.removeEventListener('carboniq-company-changed', handleCompanyChange);
  }, [activeCompany?.id]);

  // Client-side filtering of real records
  const filteredActivities = activities.filter((item) => {
    const matchesSearch =
      item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'CALCULATED') return matchesSearch && item.emission?.status === 'Calculated';
    if (statusFilter === 'NEEDS_REVIEW') return matchesSearch && item.emission?.status === 'Needs Review';
    return matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Activity History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Comprehensive audit-ready record of all operational activity entries
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={fetchActivities} className="btn btn-secondary" title="Refresh activities list">
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

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by activity name or date (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="ALL">All Statuses ({activities.length})</option>
            <option value="CALCULATED">Calculated Only</option>
            <option value="NEEDS_REVIEW">Needs Review Only</option>
          </select>
        </div>
      </div>

      {/* Activities Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading && activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading activity history...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <History size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {searchTerm || statusFilter !== 'ALL' ? 'No matching activities found.' : 'No activity records yet.'}
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {searchTerm || statusFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Submit business activity to begin tracking.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Quantity</th>
                  <th>Scope</th>
                  <th>CO2e Result</th>
                  <th>Verification Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item) => {
                  const emission = item.emission;
                  const isNeedsReview = emission?.status === 'Needs Review';
                  return (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{item.id}</td>
                      <td style={{ fontWeight: 500 }}>{item.date}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.activity}</td>
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
                          <span>
                            {emission.co2e_tonnes} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tCO2e</span>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              ({Number(emission.co2e_kg).toLocaleString()} kg)
                            </div>
                          </span>
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
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                        >
                          <FileCheck2 size={13} />
                          <span>Audit View</span>
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

export default ActivityHistory;
