import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  Clock,
  Info,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useIncidentList, useIncidentStats } from '../hooks/incident-service';
import { formatRelative } from '../lib/format';
import {
  SEVERITY_BG,
  severityTone,
  statusBadgeClass,
  type SeverityTone,
} from '../lib/incident-display';
import type { IncidentListItem } from '../types/incident-service';

function severityIcon(tone: SeverityTone) {
  switch (tone) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-600" aria-hidden />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden />;
    case 'medium':
      return <Zap className="h-4 w-4 text-yellow-500" aria-hidden />;
    default:
      return <Info className="h-4 w-4 text-blue-400" aria-hidden />;
  }
}

function IncidentRow({ incident }: { incident: IncidentListItem }) {
  const tone = severityTone(incident.severity);

  return (
    <Link
      to={`/incidents/${incident.incident_id}`}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="mt-0.5">{severityIcon(tone)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{incident.incident_id.slice(0, 8)}…</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_BG[tone]}`}
          >
            {incident.severity}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(incident.status)}`}
          >
            {incident.status}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-800 group-hover:text-blue-700">
          {incident.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{incident.description}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelative(incident.first_seen)}
          </span>
          <span className="text-slate-300">·</span>
          <span>{incident.entity}</span>
          <span className="text-slate-300">·</span>
          <span>{incident.alert_count} alert{incident.alert_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <BrainCircuit className="h-3.5 w-3.5" /> AI analysis
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
      </div>
    </Link>
  );
}

export function Incidents() {
  const { data: incidents, isLoading, isError, refetch, isFetching } = useIncidentList();
  const { data: stats } = useIncidentStats();

  const list = incidents ?? [];
  const activeCount = (stats?.new ?? 0) + (stats?.investigating ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incidents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live data from Scorpius Incident Service API
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Active</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <div className="text-xs text-red-600">Critical</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{stats?.critical ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <div className="text-xs text-orange-600">High</div>
          <div className="mt-1 text-2xl font-bold text-orange-700">{stats?.high ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs text-emerald-600">Resolved</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{stats?.resolved ?? '—'}</div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load incidents. Is the mock API running? Try <code className="font-mono">npm run mock-api</code>.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No active incidents.
            </div>
          ) : (
            list.map((incident) => (
              <IncidentRow key={incident.incident_id} incident={incident} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
