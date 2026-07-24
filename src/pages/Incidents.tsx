import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  Clock,
  Info,
  ListFilter,
  RefreshCw,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { useUnifiedIncidents } from '../hooks/unified-incidents';
import { formatRelative } from '../lib/format';
import {
  SEVERITY_BG,
  severityTone,
  statusBadgeClass,
  type SeverityTone,
} from '../lib/incident-display';
import type { UnifiedIncidentListItem } from '../types/unified-incident';

type SeverityFilter = SeverityTone | '';
type StatusFilter = 'active' | 'resolved' | '';

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

const SOURCE_BADGE: Record<'api', string> = {
  api: 'bg-blue-50 text-blue-700 ring-blue-100',
};

function isResolvedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'resolved' || s === 'closed' || s === 'suppressed';
}

function IncidentRow({ incident }: { incident: UnifiedIncidentListItem }) {
  const tone = severityTone(incident.severity);
  const isWorkflow = incident.source === 'demo';

  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="mt-0.5">{severityIcon(tone)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            {isWorkflow ? incident.id : `${incident.id.slice(0, 8)}…`}
          </span>
          {incident.source === 'api' && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SOURCE_BADGE.api}`}
            >
              Live
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${SEVERITY_BG[tone]}`}
          >
            {incident.severity}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${statusBadgeClass(incident.status)}`}
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
            {formatRelative(incident.sortTime)}
          </span>
          <span className="text-slate-300">·</span>
          <span>{incident.contextLabel}</span>
          <span className="text-slate-300">·</span>
          <span>{incident.countLabel}</span>
        </div>
        {incident.tags && incident.tags.length > 0 && (
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
        {isWorkflow && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <BrainCircuit className="h-3.5 w-3.5" /> AI workflow
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
      </div>
    </Link>
  );
}

function KpiButton({
  label,
  value,
  active,
  onClick,
  className,
  labelClass,
  valueClass,
}: {
  label: string;
  value: string | number;
  active: boolean;
  onClick: () => void;
  className: string;
  labelClass: string;
  valueClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-4 text-left shadow-sm transition-all ${className} ${
        active ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:border-slate-300'
      }`}
    >
      <div className={`text-xs ${labelClass}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-[10px] text-slate-400">
        {active ? 'Filtered — click to clear' : 'Click to filter list'}
      </div>
    </button>
  );
}

export function Incidents() {
  const { data, isLoading, isError, refetch, isFetching } = useUnifiedIncidents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const severityFilter = (searchParams.get('severity') ?? '') as SeverityFilter;
  const statusFilter = (searchParams.get('status') ?? '') as StatusFilter;
  const query = searchParams.get('q') ?? '';

  const list = data?.incidents ?? [];
  const stats = data?.stats;
  const apiAvailable = data?.apiAvailable ?? true;

  function patchParams(patch: Record<string, string | null>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  function toggleSeverityKpi(tone: SeverityTone) {
    patchParams({
      severity: severityFilter === tone ? null : tone,
      status: null,
    });
  }

  function toggleStatusKpi(status: StatusFilter) {
    patchParams({
      status: statusFilter === status ? null : status,
      severity: null,
    });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((incident) => {
      const tone = severityTone(incident.severity);
      if (severityFilter && tone !== severityFilter) return false;
      if (statusFilter === 'active' && isResolvedStatus(incident.status)) return false;
      if (statusFilter === 'resolved' && !isResolvedStatus(incident.status)) return false;
      if (q) {
        const hay = `${incident.id} ${incident.title} ${incident.description} ${incident.contextLabel} ${(incident.tags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list, severityFilter, statusFilter, query]);

  const hasFilters = Boolean(severityFilter || statusFilter || query.trim());
  const activeFilterCount = [severityFilter, statusFilter, query.trim()].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incidents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Workflow incidents and live Incident Service data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              hasFilters || filtersOpen
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
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
      </div>

      {!apiAvailable && !isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Live incidents unavailable — showing workflow incidents only. Is the mock API running? Try{' '}
          <code className="font-mono">npm run mock-api</code> or{' '}
          <code className="font-mono">docker compose up</code>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiButton
          label="Active"
          value={stats?.active ?? '—'}
          active={statusFilter === 'active'}
          onClick={() => toggleStatusKpi('active')}
          className="border-slate-200 bg-white"
          labelClass="text-slate-500"
          valueClass="text-slate-900"
        />
        <KpiButton
          label="Critical"
          value={stats?.critical ?? '—'}
          active={severityFilter === 'critical'}
          onClick={() => toggleSeverityKpi('critical')}
          className="border-red-100 bg-red-50"
          labelClass="text-red-600"
          valueClass="text-red-700"
        />
        <KpiButton
          label="High"
          value={stats?.high ?? '—'}
          active={severityFilter === 'high'}
          onClick={() => toggleSeverityKpi('high')}
          className="border-orange-100 bg-orange-50"
          labelClass="text-orange-600"
          valueClass="text-orange-700"
        />
        <KpiButton
          label="Resolved"
          value={stats?.resolved ?? '—'}
          active={statusFilter === 'resolved'}
          onClick={() => toggleStatusKpi('resolved')}
          className="border-emerald-100 bg-emerald-50"
          labelClass="text-emerald-600"
          valueClass="text-emerald-700"
        />
      </div>

      {filtersOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Filter incidents</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => patchParams({ q: e.target.value || null })}
              placeholder="Search title, id, entity…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
              aria-label="Search incidents"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(['critical', 'high', 'medium', 'low'] as SeverityTone[]).map((tone) => (
              <button
                key={tone}
                type="button"
                aria-pressed={severityFilter === tone}
                onClick={() =>
                  patchParams({
                    severity: severityFilter === tone ? null : tone,
                  })
                }
                className={`rounded-full border px-2.5 py-1 text-xs capitalize ${
                  severityFilter === tone
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {tone}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={statusFilter === 'active'}
              onClick={() =>
                patchParams({ status: statusFilter === 'active' ? null : 'active' })
              }
              className={`rounded-full border px-2.5 py-1 text-xs ${
                statusFilter === 'active'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Active only
            </button>
            <button
              type="button"
              aria-pressed={statusFilter === 'resolved'}
              onClick={() =>
                patchParams({ status: statusFilter === 'resolved' ? null : 'resolved' })
              }
              className={`rounded-full border px-2.5 py-1 text-xs ${
                statusFilter === 'resolved'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Resolved only
            </button>
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            Showing {filtered.length} of {list.length}
          </span>
          {severityFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 capitalize">
              {severityFilter}
              <button type="button" aria-label="Clear severity" onClick={() => patchParams({ severity: null })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 capitalize">
              {statusFilter}
              <button type="button" aria-label="Clear status" onClick={() => patchParams({ status: null })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {query.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              “{query.trim()}”
              <button type="button" aria-label="Clear search" onClick={() => patchParams({ q: null })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

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
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              {hasFilters ? 'No incidents match the current filters.' : 'No incidents found.'}
            </div>
          ) : (
            filtered.map((incident) => (
              <IncidentRow key={`${incident.source}-${incident.id}`} incident={incident} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
