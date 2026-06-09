import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import {
  useAggregatesSummary,
  useEmsSummary,
  useNodesSummary,
  useVolumesSummary,
} from '../hooks/queries';
import { REFRESH_OPTIONS, useRefreshInterval } from '../hooks/RefreshContext';
import { formatAgo } from '../lib/format';
import type { StatusTone } from '../lib/status';

const CLUSTER_NAME = 'uspdc-nac01';

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function sumWhere(counts: Record<string, number> | undefined, predicate: (key: string) => boolean): number {
  if (!counts) return 0;
  return Object.entries(counts).reduce(
    (total, [key, count]) => (predicate(key) ? total + count : total),
    0,
  );
}

interface DerivedHealth {
  tone: StatusTone;
  label: string;
}

export function TopBar() {
  const queryClient = useQueryClient();
  const { optionIndex, setOptionIndex } = useRefreshInterval();
  const nodes = useNodesSummary();
  const aggregates = useAggregatesSummary();
  const volumes = useVolumesSummary();
  const ems = useEmsSummary();
  useNow();

  const lastUpdated = Math.max(
    nodes.dataUpdatedAt,
    aggregates.dataUpdatedAt,
    volumes.dataUpdatedAt,
    ems.dataUpdatedAt,
  );

  const health = deriveHealth();
  const isFetching =
    nodes.isFetching || aggregates.isFetching || volumes.isFetching || ems.isFetching;

  function deriveHealth(): DerivedHealth {
    if (nodes.isError || aggregates.isError || volumes.isError || ems.isError) {
      return { tone: 'warn', label: 'Data unavailable' };
    }
    if (!nodes.data || !aggregates.data) return { tone: 'neutral', label: 'Loading' };

    const nodesDown = sumWhere(nodes.data.state_counts, (key) => key !== 'up');
    const aggregatesDown = sumWhere(aggregates.data.state_counts, (key) => key !== 'online');
    const severity = ems.data?.severity_counts ?? {};
    const critEvents = (severity.emergency ?? 0) + (severity.alert ?? 0);
    const errorEvents = severity.error ?? 0;

    if (nodesDown > 0 || aggregatesDown > 0 || critEvents > 0) {
      return { tone: 'crit', label: 'Attention needed' };
    }
    if (errorEvents > 0) return { tone: 'warn', label: 'Degraded' };
    return { tone: 'ok', label: 'Healthy' };
  }

  const pillClass: Record<StatusTone, string> = {
    ok: 'bg-green-50 text-green-700 border-green-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    crit: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-50 text-slate-500 border-slate-200',
  };

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-base font-semibold text-slate-800">{CLUSTER_NAME}</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${pillClass[health.tone]}`}
          role="status"
          aria-label={`Cluster health: ${health.label}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {health.label}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs tabular-nums text-slate-400" aria-live="polite">
          {lastUpdated > 0 ? `Updated ${formatAgo(lastUpdated)}` : 'Waiting for data…'}
        </span>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Refresh
          <select
            value={optionIndex}
            onChange={(event) => setOptionIndex(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
            aria-label="Auto-refresh interval"
          >
            {REFRESH_OPTIONS.map((option, index) => (
              <option key={option.label} value={index}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          aria-label="Refresh all data now"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>
    </header>
  );
}
