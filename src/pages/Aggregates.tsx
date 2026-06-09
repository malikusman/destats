import { Database, HardDrive, Layers, Server } from 'lucide-react';
import { useAggregates } from '../hooks/queries';
import { CapacityBar } from '../components/CapacityBar';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { formatBytes, formatNumber, formatTimestamp } from '../lib/format';
import { stateTone } from '../lib/status';
import type { AggregateRecord } from '../types/netapp';

function AggregateCard({ aggregate }: { aggregate: AggregateRecord }) {
  const space = aggregate.space?.block_storage;
  const efficiency = aggregate.space?.efficiency;
  const efficiencyNoSnap = aggregate.space?.efficiency_without_snapshots;
  const primary = aggregate.block_storage?.primary;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <h2 className="truncate font-mono text-sm font-semibold text-slate-800">{aggregate.name}</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs capitalize text-slate-500">
          <StatusDot tone={stateTone(aggregate.state)} label={`State: ${aggregate.state ?? 'unknown'}`} />
          {aggregate.state ?? 'unknown'}
        </span>
      </header>

      <CapacityBar
        usedPercent={space?.used_percent}
        thresholdPercent={space?.full_threshold_percent}
        className="mb-1"
      />
      <p className="mb-3 text-[11px] text-slate-400">
        {formatBytes(space?.used)} used of {formatBytes(space?.size)} · {formatBytes(space?.available)} free
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <dt className="text-slate-400">Node</dt>
          <dd className="font-mono text-slate-700">{aggregate.node?.name ?? '—'}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <dt className="text-slate-400">Volumes</dt>
          <dd className="tabular-nums text-slate-700">{formatNumber(aggregate.volume_count)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <dt className="text-slate-400">Disks</dt>
          <dd className="text-slate-700">
            {primary?.disk_count ?? '—'} × {primary?.disk_type ?? aggregate.block_storage?.storage_type ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="inline text-slate-400">RAID </dt>
          <dd className="inline font-mono uppercase text-slate-700">{primary?.raid_type ?? '—'}</dd>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <div className="text-lg font-semibold tabular-nums text-blue-700">
            {efficiency?.ratio !== undefined ? `${efficiency.ratio.toFixed(2)}x` : '—'}
          </div>
          <div className="text-[11px] text-blue-500">Efficiency (overall)</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-lg font-semibold tabular-nums text-slate-700">
            {efficiencyNoSnap?.ratio !== undefined ? `${efficiencyNoSnap.ratio.toFixed(2)}x` : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Without snapshots</div>
        </div>
      </div>

      {aggregate.create_time && (
        <p className="mt-3 text-[11px] text-slate-300">Created {formatTimestamp(aggregate.create_time)}</p>
      )}
    </article>
  );
}

export function Aggregates() {
  const { data, isPending, isError, error, refetch } = useAggregates();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  if (!data || data.length === 0) {
    return <EmptyState title="No aggregates returned" description="The ingestion API returned no aggregate records." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((aggregate) => (
        <AggregateCard key={aggregate.uuid} aggregate={aggregate} />
      ))}
    </div>
  );
}
