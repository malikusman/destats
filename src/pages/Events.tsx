import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useEmsErrors, useEmsEvents } from '../hooks/queries';
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

function eventKey(event: EmsEvent): string {
  return `${event.node?.name ?? 'node'}-${event.index}-${event.time}`;
}

export function Events() {
  const [mode, setMode] = useState<Mode>('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [nodeFilter, setNodeFilter] = useState<string>('all');

  const allEvents = useEmsEvents();
  const errorEvents = useEmsErrors();

  const events = useMemo<EmsEvent[]>(() => {
    if (mode === 'errors') return errorEvents.data?.events ?? [];
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
  }, [mode, allEvents.data, errorEvents.data]);

  const nodeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const event of events) {
      if (event.node?.name) names.add(event.node.name);
    }
    return [...names].sort();
  }, [events]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
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
  }, [events, search, severityFilter, nodeFilter]);

  function toggleSeverity(severity: string) {
    setSeverityFilter((current) => {
      const next = new Set(current);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  }

  const isPending = mode === 'errors' ? errorEvents.isPending : allEvents.isPending;
  const isError = mode === 'errors' ? errorEvents.isError : allEvents.isError;
  const queryError = mode === 'errors' ? errorEvents.error : allEvents.error;
  const retry = mode === 'errors' ? errorEvents.refetch : allEvents.refetch;

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
      <ChartCard
        title="EMS Event Log"
        subtitle={`${formatNumber(filtered.length)} of ${formatNumber(events.length)} loaded events shown`}
        actions={
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
              Errors only
            </button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search log messages and event names…"
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-300 focus:border-blue-400 focus:outline-none"
              aria-label="Search events"
            />
          </label>
          <select
            value={nodeFilter}
            onChange={(event) => setNodeFilter(event.target.value)}
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
            {mode === 'all' && allEvents.hasNextPage && (
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
