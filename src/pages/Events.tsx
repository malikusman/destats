import { useMemo, useState } from 'react';
import { ListFilter, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEmsErrors, useEmsEvents, useEmsSummary } from '../hooks/queries';
import { ChartCard } from '../components/ChartCard';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { formatNumber, formatRelative, formatTimestamp } from '../lib/format';
import { SEVERITY_ORDER } from '../lib/status';
import type { EmsEvent } from '../types/netapp';

type Mode = 'all' | 'errors';

const ACTIONABLE_SEVERITIES = ['emergency', 'alert', 'error'] as const;

/** Khai / TDK operational noise — hide by default so actionable events surface first. */
const NOISE_PATTERNS: RegExp[] = [
  /failed\s+login/i,
  /authentication\s+fail/i,
  /login\s+fail/i,
  /snapshot\s+policy\s+drift/i,
  /policy\s+drift/i,
  /peer\s+address\s+mismatch/i,
  /address\s+mismatch/i,
];

function isOperationalNoise(event: EmsEvent): boolean {
  const haystack = `${event.log_message ?? ''} ${event.message?.name ?? ''} ${event.source ?? ''}`;
  return NOISE_PATTERNS.some((re) => re.test(haystack));
}

function eventKey(event: EmsEvent): string {
  return `${event.node?.name ?? 'node'}-${event.index}-${event.time}`;
}

function parseSeveritySet(param: string | null): Set<string> {
  return new Set(param ? param.split(',').filter(Boolean) : []);
}

function setsEqual(a: Set<string>, b: readonly string[]): boolean {
  return b.length === a.size && b.every((value) => a.has(value));
}

function SeverityKpiButton({
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
      <div className={`mt-1 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</div>
      <div className="mt-1 text-[10px] text-slate-400">
        {active ? 'Filtered — click to clear' : 'Click to filter list'}
      </div>
    </button>
  );
}

export function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const severityParam = searchParams.get('severity');
  const explicitMode = searchParams.get('mode');
  const severityFilter = useMemo(() => parseSeveritySet(severityParam), [severityParam]);

  const mode: Mode = useMemo(() => {
    if (explicitMode === 'all') return 'all';
    if (explicitMode === 'errors') return 'errors';
    if (severityParam) {
      const onlyActionable =
        severityFilter.size > 0 &&
        Array.from(severityFilter).every((severity) =>
          (ACTIONABLE_SEVERITIES as readonly string[]).includes(severity),
        );
      // Drill-down to notice/debug/informational needs the full event stream.
      if (severityFilter.size > 0 && !onlyActionable) return 'all';
    }
    return 'errors';
  }, [explicitMode, severityParam, severityFilter]);

  const hideNoise = searchParams.get('noise') !== '1';
  const search = searchParams.get('q') ?? '';
  const nodeFilter = searchParams.get('node') ?? 'all';
  const [filtersOpen, setFiltersOpen] = useState(() => Boolean(severityParam));

  const emsSummary = useEmsSummary();
  const eventsExamined = emsSummary.data?.events_examined ?? 1000;
  const allEvents = useEmsEvents();
  const errorEvents = useEmsErrors(eventsExamined);

  const useErrorsFeed = mode === 'errors';

  function patchParams(patch: Record<string, string | null>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (!value) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  function setMode(next: Mode) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === 'errors') p.delete('mode');
        else p.set('mode', 'all');
        return p;
      },
      { replace: true },
    );
  }

  function setHideNoise(hide: boolean) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (hide) p.delete('noise');
        else p.set('noise', '1');
        return p;
      },
      { replace: true },
    );
  }

  function setSeverityFilter(next: Set<string>) {
    patchParams({
      severity: next.size > 0 ? Array.from(next).join(',') : null,
      mode: null,
    });
  }

  function toggleSeverity(severity: string) {
    const next = new Set(severityFilter);
    if (next.has(severity)) next.delete(severity);
    else next.add(severity);
    setSeverityFilter(next);
  }

  function toggleSeverityKpi(severity: string) {
    if (severityFilter.size === 1 && severityFilter.has(severity)) {
      setSeverityFilter(new Set());
    } else {
      setSeverityFilter(new Set([severity]));
    }
  }

  function toggleActionableFilter() {
    if (setsEqual(severityFilter, ACTIONABLE_SEVERITIES)) {
      setSeverityFilter(new Set());
    } else {
      setSeverityFilter(new Set(ACTIONABLE_SEVERITIES));
    }
  }

  const events = useMemo<EmsEvent[]>(() => {
    if (useErrorsFeed) return errorEvents.data?.events ?? [];
    const seen = new Set<string>();
    const result: EmsEvent[] = [];
    for (const page of allEvents.data?.pages ?? []) {
      for (const event of page.events) {
        const key = eventKey(event);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(event);
        }
      }
    }
    return result;
  }, [useErrorsFeed, allEvents.data, errorEvents.data]);

  const severityCounts = emsSummary.data?.severity_counts ?? {};
  const summaryActionable =
    (severityCounts.emergency ?? 0) + (severityCounts.alert ?? 0) + (severityCounts.error ?? 0);

  const summaryFilteredTotal = useMemo(() => {
    if (severityFilter.size === 0) return 0;
    return Array.from(severityFilter).reduce(
      (sum, severity) => sum + (severityCounts[severity] ?? 0),
      0,
    );
  }, [severityFilter, severityCounts]);

  const nodeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const event of events) {
      if (event.node?.name) names.add(event.node.name);
    }
    return [...names].sort();
  }, [events]);

  const noiseHiddenCount = useMemo(
    () => (hideNoise ? events.filter(isOperationalNoise).length : 0),
    [events, hideNoise],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (hideNoise && isOperationalNoise(event)) return false;
      if (severityFilter.size > 0) {
        const severity = (event.message?.severity ?? '').toLowerCase();
        if (!severityFilter.has(severity)) return false;
      }
      if (nodeFilter !== 'all' && event.node?.name !== nodeFilter) return false;
      if (query) {
        const haystack = `${event.log_message ?? ''} ${event.message?.name ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [events, search, severityFilter, nodeFilter, hideNoise]);

  const isPending = useErrorsFeed ? errorEvents.isPending : allEvents.isPending;
  const isError = useErrorsFeed ? errorEvents.isError : allEvents.isError;
  const queryError = useErrorsFeed ? errorEvents.error : allEvents.error;
  const retry = useErrorsFeed ? errorEvents.refetch : allEvents.refetch;

  const subtitleParts = [
    useErrorsFeed
      ? severityFilter.size > 0 && summaryFilteredTotal > 0
        ? `${formatNumber(filtered.length)} of ${formatNumber(summaryFilteredTotal)} matching in last ${formatNumber(eventsExamined)} events`
        : `${formatNumber(filtered.length)} emergency, alert, and error events in last ${formatNumber(eventsExamined)} events`
      : `Operational event stream. ${formatNumber(filtered.length)} of ${formatNumber(events.length)} loaded events shown`,
    noiseHiddenCount > 0 ? `${formatNumber(noiseHiddenCount)} noise hidden` : null,
  ].filter(Boolean);

  const columns: Column<EmsEvent>[] = [
    {
      key: 'time',
      header: 'Time',
      cell: (event) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-500" title={formatTimestamp(event.time)}>
          {formatRelative(event.time)}
        </span>
      ),
      sortValue: (event) => event.time,
      defaultDir: 'desc',
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (event) => <SeverityBadge severity={event.message?.severity} />,
      sortValue: (event) => {
        const index = SEVERITY_ORDER.indexOf(
          (event.message?.severity ?? '') as (typeof SEVERITY_ORDER)[number],
        );
        return index === -1 ? SEVERITY_ORDER.length : index;
      },
    },
    {
      key: 'name',
      header: 'Event',
      cell: (event) => <span className="font-mono text-xs text-slate-700">{event.message?.name ?? '—'}</span>,
      sortValue: (event) => event.message?.name ?? '',
    },
    {
      key: 'node',
      header: 'Node',
      cell: (event) => <span className="font-mono text-xs text-slate-500">{event.node?.name ?? '—'}</span>,
      sortValue: (event) => event.node?.name ?? '',
    },
    {
      key: 'source',
      header: 'Source',
      cell: (event) => <span className="font-mono text-xs text-slate-400">{event.source ?? '—'}</span>,
      sortValue: (event) => event.source ?? '',
    },
    {
      key: 'message',
      header: 'Message',
      cell: (event) => (
        <span className="block max-w-xl truncate font-mono text-xs text-slate-600" title={event.log_message}>
          {event.log_message ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Events (EMS)</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Actionable EMS events (errors, alerts, emergencies) by default. Switch to all events for the full stream.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SeverityKpiButton
          label="Emergency"
          value={formatNumber(severityCounts.emergency ?? 0)}
          active={severityFilter.size === 1 && severityFilter.has('emergency')}
          onClick={() => toggleSeverityKpi('emergency')}
          className="border-red-100 bg-red-50"
          labelClass="text-red-600"
          valueClass="text-red-700"
        />
        <SeverityKpiButton
          label="Alert"
          value={formatNumber(severityCounts.alert ?? 0)}
          active={severityFilter.size === 1 && severityFilter.has('alert')}
          onClick={() => toggleSeverityKpi('alert')}
          className="border-orange-100 bg-orange-50"
          labelClass="text-orange-600"
          valueClass="text-orange-700"
        />
        <SeverityKpiButton
          label="Error"
          value={formatNumber(severityCounts.error ?? 0)}
          active={severityFilter.size === 1 && severityFilter.has('error')}
          onClick={() => toggleSeverityKpi('error')}
          className="border-yellow-100 bg-yellow-50"
          labelClass="text-yellow-700"
          valueClass="text-yellow-800"
        />
        <SeverityKpiButton
          label="Errors + Alerts"
          value={formatNumber(summaryActionable)}
          active={setsEqual(severityFilter, ACTIONABLE_SEVERITIES)}
          onClick={toggleActionableFilter}
          className="border-slate-200 bg-white"
          labelClass="text-slate-500"
          valueClass="text-slate-900"
        />
      </div>

      <ChartCard
        title="EMS Event Log"
        subtitle={subtitleParts.join(' · ')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                filtersOpen
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" aria-hidden />
              Filters
            </button>
            <div className="flex rounded-lg border border-slate-200 p-0.5" role="tablist" aria-label="Event source">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'all'}
                onClick={() => setMode('all')}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  mode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All events
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'errors'}
                onClick={() => setMode('errors')}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  mode === 'errors' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Errors feed
              </button>
            </div>
          </div>
        }
      >
        {filtersOpen && (
          <div className="mb-3 space-y-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={hideNoise}
                onChange={(e) => setHideNoise(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Hide operational noise
                <span className="ml-1 text-slate-400">
                  (failed logins, snapshot policy drift, peer address mismatch)
                </span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-56 flex-1">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => patchParams({ q: event.target.value || null })}
                  placeholder="Search log messages and event names…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-300 focus:border-blue-400 focus:outline-none"
                  aria-label="Search events"
                />
              </label>
              <select
                value={nodeFilter}
                onChange={(event) =>
                  patchParams({
                    node: event.target.value === 'all' ? null : event.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                aria-label="Filter by node"
              >
                <option value="all">All nodes</option>
                {nodeOptions.map((node) => (
                  <option key={node} value={node}>
                    {node}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by severity">
                {SEVERITY_ORDER.map((severity) => {
                  const active = severityFilter.has(severity);
                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => toggleSeverity(severity)}
                      aria-pressed={active}
                      className={`rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}
                    >
                      {severity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isPending ? (
          <LoadingSkeleton rows={12} />
        ) : isError ? (
          <ErrorState error={queryError} onRetry={() => retry()} compact />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={eventKey}
              renderExpanded={(event) => <EventDetail event={event} />}
              emptyMessage="No events match the current filters."
            />
            {mode === 'all' && !useErrorsFeed && allEvents.hasNextPage && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => allEvents.fetchNextPage()}
                  disabled={allEvents.isFetchingNextPage}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                >
                  {allEvents.isFetchingNextPage ? 'Loading…' : 'Load more events'}
                </button>
              </div>
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
}

function EventDetail({ event }: { event: EmsEvent }) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <h3 className="mb-1 font-semibold uppercase tracking-wide text-slate-400">Log message</h3>
        <p className="whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-mono text-slate-700 ring-1 ring-slate-200">
          {event.log_message ?? '—'}
        </p>
      </div>
      {event.parameters && event.parameters.length > 0 && (
        <div>
          <h3 className="mb-1 font-semibold uppercase tracking-wide text-slate-400">Parameters</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {event.parameters.map((parameter, index) => (
              <div key={`${parameter.name}-${index}`} className="flex gap-2">
                <dt className="shrink-0 font-mono text-slate-400">{parameter.name}</dt>
                <dd className="break-all font-mono text-slate-700">{parameter.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Occurred {formatTimestamp(event.time)} · index <span className="font-mono">{event.index}</span>
        {event.source && (
          <>
            {' · source '}
            <span className="font-mono">{event.source}</span>
          </>
        )}
      </p>
    </div>
  );
}
