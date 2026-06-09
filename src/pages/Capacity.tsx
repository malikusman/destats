import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import {
  useAggregates,
  useAggregatesSummary,
  useVolumes,
  useVolumesSummary,
  VOLUME_PAGE_CAP,
} from '../hooks/queries';
import { ChartCard } from '../components/ChartCard';
import { CapacityBar } from '../components/CapacityBar';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { formatBytes, formatNumber, formatTiB } from '../lib/format';
import type { VolumeRecord } from '../types/netapp';

const TOP_N = 15;

interface VolumeRow {
  volume: VolumeRecord;
  usedPercent: number;
}

export function Capacity() {
  const aggregatesSummary = useAggregatesSummary();
  const aggregates = useAggregates();
  const volumesSummary = useVolumesSummary();
  const volumes = useVolumes();

  const loadedVolumes = useMemo(() => {
    const seen = new Set<string>();
    const result: VolumeRecord[] = [];
    for (const page of volumes.data?.pages ?? []) {
      for (const volume of page.volumes) {
        if (!seen.has(volume.uuid)) {
          seen.add(volume.uuid);
          result.push(volume);
        }
      }
    }
    return result;
  }, [volumes.data]);
  const loadedPages = volumes.data?.pages.length ?? 0;
  const canLoadMore = volumes.hasNextPage;

  // --- Per-aggregate capacity bars ----------------------------------------
  const aggregateCapacityData = useMemo(
    () =>
      (aggregatesSummary.data?.aggregates ?? []).map((aggregate) => ({
        name: aggregate.name,
        used: aggregate.used_tib,
        available: aggregate.available_tib,
      })),
    [aggregatesSummary.data],
  );

  // --- Volumes per SVM ------------------------------------------------------
  const svmCountData = useMemo(() => {
    const counts = volumesSummary.data?.svm_counts ?? {};
    return Object.entries(counts)
      .map(([svm, count]) => ({ svm, count }))
      .sort((a, b) => b.count - a.count);
  }, [volumesSummary.data]);

  // --- Capacity per SVM (from loaded volume pages) --------------------------
  const svmCapacityData = useMemo(() => {
    const used = new Map<string, number>();
    for (const volume of loadedVolumes) {
      const svm = volume.svm?.name ?? 'unknown';
      used.set(svm, (used.get(svm) ?? 0) + (volume.space?.used ?? 0));
    }
    return [...used.entries()]
      .map(([svm, bytes]) => ({ svm, usedTiB: bytes / 1024 ** 4 }))
      .sort((a, b) => b.usedTiB - a.usedTiB);
  }, [loadedVolumes]);

  // --- Efficiency comparison -------------------------------------------------
  const efficiencyData = useMemo(
    () =>
      (aggregates.data ?? []).map((aggregate) => ({
        name: aggregate.name,
        overall: aggregate.space?.efficiency?.ratio ?? 0,
        withoutSnapshots: aggregate.space?.efficiency_without_snapshots?.ratio ?? 0,
      })),
    [aggregates.data],
  );

  // --- Top-N fullest volumes ---------------------------------------------------
  const topVolumes = useMemo<VolumeRow[]>(() => {
    return loadedVolumes
      .filter((volume) => (volume.space?.size ?? 0) > 0)
      .map((volume) => ({
        volume,
        usedPercent: ((volume.space?.used ?? 0) / (volume.space?.size ?? 1)) * 100,
      }))
      .sort((a, b) => b.usedPercent - a.usedPercent)
      .slice(0, TOP_N);
  }, [loadedVolumes]);

  const volumeColumns: Column<VolumeRow>[] = [
    {
      key: 'name',
      header: 'Volume',
      cell: ({ volume }) => <span className="font-mono text-xs text-slate-700">{volume.name}</span>,
      sortValue: ({ volume }) => volume.name,
    },
    {
      key: 'svm',
      header: 'SVM',
      cell: ({ volume }) => <span className="text-xs text-slate-600">{volume.svm?.name ?? '—'}</span>,
      sortValue: ({ volume }) => volume.svm?.name ?? '',
    },
    {
      key: 'aggregate',
      header: 'Aggregate',
      cell: ({ volume }) => (
        <span className="font-mono text-xs text-slate-500">
          {volume.aggregates?.map((a) => a.name).join(', ') || '—'}
        </span>
      ),
      sortValue: ({ volume }) => volume.aggregates?.[0]?.name ?? '',
    },
    {
      key: 'size',
      header: 'Size',
      cell: ({ volume }) => <span className="text-xs tabular-nums">{formatBytes(volume.space?.size)}</span>,
      sortValue: ({ volume }) => volume.space?.size ?? 0,
      defaultDir: 'desc',
    },
    {
      key: 'used',
      header: 'Used',
      cell: ({ volume }) => <span className="text-xs tabular-nums">{formatBytes(volume.space?.used)}</span>,
      sortValue: ({ volume }) => volume.space?.used ?? 0,
      defaultDir: 'desc',
    },
    {
      key: 'usedPercent',
      header: 'Used %',
      cell: ({ usedPercent }) => <CapacityBar usedPercent={usedPercent} className="w-36" />,
      sortValue: ({ usedPercent }) => usedPercent,
      defaultDir: 'desc',
    },
    {
      key: 'type',
      header: 'Type',
      cell: ({ volume }) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] uppercase text-slate-500">
          {volume.type ?? '—'}
        </span>
      ),
      sortValue: ({ volume }) => volume.type ?? '',
    },
    {
      key: 'protected',
      header: 'Protected',
      cell: ({ volume }) =>
        volume.snapmirror?.is_protected ? (
          <ShieldCheck className="h-4 w-4 text-green-600" aria-label="SnapMirror protected" />
        ) : (
          <ShieldOff className="h-4 w-4 text-slate-300" aria-label="Not protected" />
        ),
      sortValue: ({ volume }) => (volume.snapmirror?.is_protected ? 1 : 0),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Aggregate capacity breakdown */}
        <ChartCard
          title="Capacity per Aggregate"
          subtitle={
            aggregatesSummary.data
              ? `Cluster total: ${formatTiB(aggregatesSummary.data.capacity.total_size_tib)} (${formatTiB(aggregatesSummary.data.capacity.total_used_tib)} used)`
              : undefined
          }
        >
          {aggregatesSummary.isPending ? (
            <LoadingSkeleton rows={6} />
          ) : aggregatesSummary.isError ? (
            <ErrorState error={aggregatesSummary.error} onRetry={() => aggregatesSummary.refetch()} compact />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregateCapacityData} margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 10 }} unit=" TiB" width={64} />
                  <Tooltip formatter={(value) => formatTiB(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="used" name="Used" stackId="capacity" fill="#2563eb" />
                  <Bar dataKey="available" name="Available" stackId="capacity" fill="#dbeafe" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Efficiency comparison */}
        <ChartCard
          title="Storage Efficiency per Aggregate"
          subtitle="Dedupe/compression ratio, with vs without snapshots"
        >
          {aggregates.isPending ? (
            <LoadingSkeleton rows={6} />
          ) : aggregates.isError ? (
            <ErrorState error={aggregates.error} onRetry={() => aggregates.refetch()} compact />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}x`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="overall" name="Overall ratio" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withoutSnapshots" name="Without snapshots" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Volumes per SVM */}
        <ChartCard
          title="Volumes per SVM"
          subtitle={volumesSummary.data ? `${formatNumber(volumesSummary.data.volumes_examined)} volumes total` : undefined}
        >
          {volumesSummary.isPending ? (
            <LoadingSkeleton rows={6} />
          ) : volumesSummary.isError ? (
            <ErrorState error={volumesSummary.error} onRetry={() => volumesSummary.refetch()} compact />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={svmCountData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="svm" tick={{ fontSize: 10 }} width={110} interval={0} />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="count" name="Volumes" fill="#2563eb" radius={[0, 4, 4, 0]}>
                    {svmCountData.map((entry, index) => (
                      <Cell key={entry.svm} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Capacity per SVM */}
        <ChartCard
          title="Used Capacity per SVM"
          subtitle={`From ${formatNumber(loadedVolumes.length)} loaded volumes${canLoadMore ? ' (partial — load more below)' : ''}`}
        >
          {volumes.isPending ? (
            <LoadingSkeleton rows={6} />
          ) : volumes.isError ? (
            <ErrorState error={volumes.error} onRetry={() => volumes.refetch()} compact />
          ) : svmCapacityData.length === 0 ? (
            <EmptyState title="No volume space data loaded" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={svmCapacityData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit=" TiB" />
                  <YAxis type="category" dataKey="svm" tick={{ fontSize: 10 }} width={110} interval={0} />
                  <Tooltip formatter={(value) => formatTiB(Number(value))} />
                  <Bar dataKey="usedTiB" name="Used" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top-N fullest volumes */}
      <ChartCard
        title={`Top ${TOP_N} Fullest Volumes`}
        subtitle={`Sorted by used % · scanning ${formatNumber(loadedVolumes.length)} loaded volumes`}
        actions={
          canLoadMore ? (
            <button
              type="button"
              onClick={() => volumes.fetchNextPage()}
              disabled={volumes.isFetchingNextPage}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {volumes.isFetchingNextPage
                ? 'Loading…'
                : `Load more volumes (${loadedPages}/${VOLUME_PAGE_CAP}+ pages)`}
            </button>
          ) : undefined
        }
      >
        {volumes.isPending ? (
          <LoadingSkeleton rows={8} />
        ) : volumes.isError ? (
          <ErrorState error={volumes.error} onRetry={() => volumes.refetch()} compact />
        ) : (
          <DataTable
            columns={volumeColumns}
            rows={topVolumes}
            rowKey={({ volume }) => volume.uuid}
            initialSort={{ key: 'usedPercent', dir: 'desc' }}
            emptyMessage="No volumes with space data loaded yet."
          />
        )}
      </ChartCard>
    </div>
  );
}
