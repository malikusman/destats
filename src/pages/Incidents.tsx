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
import { useIncidents } from '../hooks/scorpius';
import { formatRelative } from '../lib/format';
import type { Incident, Severity } from '../types/scorpius';

function severityIcon(s: Severity) {
  switch (s) {
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

const SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-blue-50 text-blue-600 ring-blue-100',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-red-50 text-red-600 ring-red-100',
  investigating: 'bg-yellow-50 text-yellow-700 ring-yellow-100',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  suppressed: 'bg-slate-100 text-slate-500 ring-slate-200',
};

function IncidentRow({ incident }: { incident: Incident }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="mt-0.5">{severityIcon(incident.severity)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{incident.id}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${SEVERITY_BG[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${STATUS_BADGE[incident.status] ?? ''}`}
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
            {formatRelative(incident.created_at)}
          </span>
          <span className="text-slate-300">·</span>
          <span>{incident.source}</span>
          <span className="text-slate-300">·</span>
          <span>{incident.assets.length} asset{incident.assets.length !== 1 ? 's' : ''}</span>
        </div>
        {incident.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {incident.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <BrainCircuit className="h-3.5 w-3.5" /> AI analysis
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </Link>
  );
}

export function Incidents() {
  const { data, isLoading, isError, refetch, isFetching } = useIncidents();

  const incidents = data?.incidents ?? [];
  const activeCount = data?.active_count ?? 0;

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incidents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            AI-detected incidents across the Scorpius platform
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Active</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <div className="text-xs text-red-600">Critical</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{criticalCount}</div>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <div className="text-xs text-orange-600">High</div>
          <div className="mt-1 text-2xl font-bold text-orange-700">{highCount}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs text-emerald-600">Resolved</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{resolvedCount}</div>
        </div>
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load incidents.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No incidents found.
            </div>
          ) : (
            incidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
