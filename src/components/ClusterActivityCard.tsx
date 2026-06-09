import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useClusterMetrics } from '../hooks/queries';
import { ChartCard } from './ChartCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { formatTimeShort } from '../lib/format';

/** Numeric series we render if the backend ever populates metric values. */
const SERIES: { key: string; label: string; pick: (r: Record<string, unknown>) => number | undefined }[] = [
  { key: 'iops', label: 'IOPS (total)', pick: (r) => pickTotal(r, 'iops') },
  { key: 'throughput', label: 'Throughput (total)', pick: (r) => pickTotal(r, 'throughput') },
  { key: 'latency', label: 'Latency (total)', pick: (r) => pickTotal(r, 'latency') },
];

function pickTotal(record: Record<string, unknown>, field: string): number | undefined {
  const group = record[field];
  if (group && typeof group === 'object' && 'total' in group) {
    const total = (group as { total?: unknown }).total;
    return typeof total === 'number' && Number.isFinite(total) ? total : undefined;
  }
  return undefined;
}

export function ClusterActivityCard() {
  const { data, isPending, isError, error, refetch } = useClusterMetrics();

  const { chartData, activeSeries } = useMemo(() => {
    const records = data ?? [];
    const active = SERIES.filter((series) =>
      records.some((record) => series.pick(record as unknown as Record<string, unknown>) !== undefined),
    );
    const points = records.map((record) => {
      const point: Record<string, number | string> = {
        time: formatTimeShort(record.timestamp),
        // Constant 1 gives the cadence sparkline something to plot.
        sample: 1,
      };
      for (const series of active) {
        const value = series.pick(record as unknown as Record<string, unknown>);
        if (value !== undefined) point[series.key] = value;
      }
      return point;
    });
    return { chartData: points, activeSeries: active };
  }, [data]);

  return (
    <ChartCard
      title="Cluster Activity"
      subtitle={
        activeSeries.length > 0
          ? activeSeries.map((s) => s.label).join(' · ')
          : `${data?.length ?? 0} metric samples at 15s intervals`
      }
    >
      {isPending ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} compact />
      ) : chartData.length === 0 ? (
        <EmptyState title="No metric samples returned" />
      ) : activeSeries.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={48} />
              <YAxis tick={{ fontSize: 10 }} width={42} />
              <Tooltip />
              {activeSeries.map((series, index) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={['#2563eb', '#16a34a', '#d97706'][index % 3]}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-slate-400">
            Metric values not yet available from the ingestion API — showing collection timeline.
          </p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={64} />
                <Tooltip
                  formatter={() => ['collected', 'sample']}
                  labelFormatter={(label) => `Sampled at ${label}`}
                />
                <Area
                  type="step"
                  dataKey="sample"
                  stroke="#2563eb"
                  fill="#dbeafe"
                  strokeWidth={1}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
