import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, AlertCircle } from 'lucide-react';

export function StatusBadge({ status, scope, isAnomaly, size = 'md' }) {
  if (scope) {
    let scopeClass = 'badge-scope-1';
    if (scope.toLowerCase().includes('scope 2')) scopeClass = 'badge-scope-2';
    if (scope.toLowerCase().includes('scope 3')) scopeClass = 'badge-scope-3';

    return (
      <span className={`badge ${scopeClass}`}>
        {scope}
      </span>
    );
  }

  if (isAnomaly) {
    return (
      <span className="badge badge-flagged" title="Statistical anomaly detected against historical data">
        <AlertOctagon size={size === 'sm' ? 12 : 14} />
        <span>Anomaly Detected</span>
      </span>
    );
  }

  switch (status) {
    case 'Calculated':
      return (
        <span className="badge badge-calculated">
          <CheckCircle2 size={size === 'sm' ? 12 : 14} />
          <span>Calculated</span>
        </span>
      );
    case 'Needs Review':
      return (
        <span className="badge badge-needs-review">
          <AlertTriangle size={size === 'sm' ? 12 : 14} />
          <span>Needs Review</span>
        </span>
      );
    case 'Reviewed – Valid':
    case 'Reviewed - Valid':
      return (
        <span className="badge badge-reviewed-valid">
          <ShieldCheck size={size === 'sm' ? 12 : 14} />
          <span>Reviewed – Valid</span>
        </span>
      );
    case 'Reviewed – Issue':
    case 'Reviewed - Issue':
      return (
        <span className="badge badge-reviewed-issue">
          <AlertCircle size={size === 'sm' ? 12 : 14} />
          <span>Reviewed – Issue</span>
        </span>
      );
    default:
      return (
        <span className="badge badge-needs-review">
          <AlertTriangle size={size === 'sm' ? 12 : 14} />
          <span>{status || 'Needs Review'}</span>
        </span>
      );
  }
}

export default StatusBadge;
