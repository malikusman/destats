import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Activity,
  AlertOctagon,
  Database,
  Gauge,
  HardDrive,
  Network,
  Server,
} from 'lucide-react';
import {
  useAggregatesSummary,
  useEmsErrors,
  useEmsSummary,
  useInterfacesSummary,
  useMetaSummary,
  useNodesSummary,
  useVolumesSummary,
} from '../hooks/queries';
import { KpiTile } from '../components/KpiTile';
import { ChartCard } from '../components/ChartCard';
import { CapacityBar } from '../components/CapacityBar';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusDot } from '../components/StatusDot';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { ClusterActivityCard } from '../components/ClusterActivityCard';
import { formatNumber, formatPercent, formatRelative, formatTiB, formatTimestamp } from '../lib/format';
import { capacityTone, severityChartColor, SEVERITY_ORDER, stateTone } from '../lib/status';
import type { StatusTone } from '../lib/status';

function sumCounts(counts: Record<string, number> | undefined): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function upCount(counts: Record<string, number> | undefined, healthyKeys: string[]): number {
  if (!counts) return 0;
  return healthyKeys.reduce((total, key) => total + (counts[key] ?? 0), 0);
}

function ratioTone(up: number, total: number): StatusTone {
  if (total === 0) return 'neutral';
  return up === total ? 'ok' : 'crit';
}

interface DegradedReason {
  label: string;
  to: string;
}

export function Overview() {
  const navigate = useNavigate();
  const nodes = useNodesSummary();
  const aggregates = useAggregatesSummary();
  const volumes = useVolumesSummary();
  const interfaces = useInterfacesSummary();
  const ems = useEmsSummary();
  const emsErrors = useEmsErrors(ems.data?.events_examined ?? 1000);
  const meta = useMetaSummary();

  // --- KPI derivations -----------------------------------------------------
  const nodesUp = upCount(nodes.data?.state_counts, ['up']);
  const nodesTotal = sumCounts(nodes.data?.state_counts);
  const aggsOnline = upCount(aggregates.data?.state_counts, ['online']);
  const aggsTotal = sumCounts(aggregates.data?.state_counts);
  const lifsUp = upCount(interfaces.data?.state_counts, ['up']);
  const lifsTotal = sumCounts(interfaces.data?.state_counts);
  const volsOnline = upCount(volumes.data?.state_counts, ['online']);
  const volsTotal = sumCounts(volumes.data?.state_counts);
  const usedPercent = volumes.data?.capacity.used_percent;
  const severity = ems.data?.severity_counts ?? {};
  const openIssues = (severity.emergency ?? 0) + (severity.alert ?? 0) + (severity.error ?? 0);

  const allHealthy =
    nodesTotal > 0 &&
    nodesUp === nodesTotal &&
    aggsOnline === aggsTotal &&
    lifsUp === lifsTotal &&
    volsOnline === volsTotal &&
    openIssues === 0;

  const degradedReasons = useMemo((): DegradedReason[] => {
    const reasons: DegradedReason[] = [];
    if (nodesTotal > 0 && nodesUp < nodesTotal) {
      reasons.push({
        label: `${nodesTotal - nodesUp} node(s) not up`,
        to: '/nodes',
      });
    }
    if (aggsTotal > 0 && aggsOnline < aggsTotal) {
      reasons.push({
        label: `${aggsTotal - aggsOnline} aggregate(s) offline`,
        to: '/aggregates',
      });
    }
    if (lifsTotal > 0 && lifsUp < lifsTotal) {
      reasons.push({
        label: `${lifsTotal - lifsUp} interface(s) down`,
        to: '/interfaces',
      });
    }
    if (volsTotal > 0 && volsOnline < volsTotal) {
      reasons.push({
        label: `${volsTotal - volsOnline} volume(s) offline`,
        to: '/capacity',
      });
    }
    if (openIssues > 0) {
      reasons.push({
        label: `${openIssues} EMS error/alert event(s)`,
        to: '/events?severity=emergency,alert,error',
      });
    }
    return reasons;
  }, [nodesTotal, nodesUp, aggsTotal, aggsOnline, lifsTotal, lifsUp, volsTotal, volsOnline, openIssues]);

  const primaryDegraded = degradedReasons[0];

  // --- Chart data ----------------------------------------------------------
  const capacityDonut = useMemo(() => {
    const capacity = volumes.data?.capacity;
    if (!capacity) return [];
    return [
      { name: 'Used', value: capacity.total_used_tib, color: '#2563eb' },
      { name: 'Available', value: capacity.total_available_tib, color: '#dbeafe' },
    ];
  }, [volumes.data]);

  const severityDonut = useMemo(() => {
    const counts = ems.data?.severity_counts ?? {};
    const ordered = [...SEVERITY_ORDER.filter((s) => s in counts), ...Object.keys(counts).filter((s) => !SEVERITY_ORDER.includes(s as (typeof SEVERITY_ORDER)[number]))];
    return ordered
      .map((name) => ({ name, value: counts[name] ?? 0, color: severityChartColor[name] ?? '#cbd5e1' }))
      .filter((entry) => entry.value > 0);
  }, [ems.data]);

  const recentErrors = (emsErrors.data?.events ?? []).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-700">Operations snapshot</p>
        <p className="mt-1 text-xs text-slate-500">
          This page summarizes storage health, capacity, and event severity from recent NetApp telemetry.
          Use KPI tiles and charts to drill into incidents and EMS event detail.
        </p>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiTile
          label="Cluster Health"
          value={nodes.isPending ? '…' : allHealthy ? 'Healthy' : 'Degraded'}
          tone={nodes.isPending ? 'neutral' : allHealthy ? 'ok' : 'crit'}
          icon={Gauge}
          loading={nodes.isPending}
          sublabel={!allHealthy && primaryDegraded ? primaryDegraded.label : undefined}
          to={!allHealthy && primaryDegraded ? primaryDegraded.to : undefined}
          hint={allHealthy ? 'All subsystems and EMS within normal range' : undefined}
        />
        <KpiTile
          label="Nodes Up"
          value={`${nodesUp}/${nodesTotal || '—'}`}
          tone={ratioTone(nodesUp, nodesTotal)}
          icon={Server}
          loading={nodes.isPending}
          to={nodesTotal > 0 && nodesUp < nodesTotal ? '/nodes' : undefined}
          hint="Node availability ratio"
        />
        <KpiTile
          label="Aggregates Online"
          value={`${aggsOnline}/${aggsTotal || '—'}`}
          tone={ratioTone(aggsOnline, aggsTotal)}
          icon={HardDrive}
          loading={aggregates.isPending}
          to={aggsTotal > 0 && aggsOnline < aggsTotal ? '/aggregates' : undefined}
          hint="Aggregate online health"
        />
        <KpiTile
          label="Interfaces Up"
          value={`${lifsUp}/${lifsTotal || '—'}`}
          tone={ratioTone(lifsUp, lifsTotal)}
          icon={Network}
          loading={interfaces.isPending}
          to={lifsTotal > 0 && lifsUp < lifsTotal ? '/interfaces' : undefined}
          hint="Network interface health"
        />
        <KpiTile
          label="Volumes Online"
          value={formatNumber(volsOnline)}
          sublabel={volsTotal ? `of ${formatNumber(volsTotal)}` : undefined}
          tone={ratioTone(volsOnline, volsTotal)}
          icon={Database}
          loading={volumes.isPending}
          hint="Online volume count"
        />
        <KpiTile
          label="Used Capacity"
          value={formatPercent(usedPercent)}
          sublabel={
            volumes.data
              ? `${formatTiB(volumes.data.capacity.total_used_tib)} of ${formatTiB(volumes.data.capacity.total_size_tib)}`
              : undefined
          }
          tone={capacityTone(usedPercent)}
          icon={Gauge}
          loading={volumes.isPending}
          hint="Used vs total cluster capacity"
        />
        <KpiTile
          label="Errors + Alerts"
          value={formatNumber(openIssues)}
          sublabel={
            ems.data
              ? `error, alert, and emergency in last ${formatNumber(ems.data.events_examined)} events`
              : undefined
          }
          tone={openIssues > 0 ? (severity.alert || severity.emergency ? 'crit' : 'warn') : 'ok'}
          icon={AlertOctagon}
          loading={ems.isPending}
          to="/events?severity=emergency,alert,error"
        />
      </div>

      {!allHealthy && degradedReasons.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Cluster degraded — investigate underlying issues</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {degradedReasons.map((reason) => (
              <li key={reason.to}>
                <Link
                  to={reason.to}
                  className="inline-flex items-center rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:border-amber-300 hover:text-blue-700"
                >
                  {reason.label} →
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/incidents"
                className="inline-flex items-center rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:border-amber-300 hover:text-blue-700"
              >
                View incidents →
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Capacity donut */}
        <ChartCard
          title="Cluster Capacity"
          subtitle={volumes.data ? `${formatTiB(volumes.data.capacity.total_size_tib)} total across ${formatNumber(volumes.data.volumes_examined)} volumes` : undefined}
        >
          {volumes.isPending ? (
            <LoadingSkeleton rows={5} />
          ) : volumes.isError ? (
            <ErrorState error={volumes.error} onRetry={() => volumes.refetch()} compact />
          ) : (
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capacityDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {capacityDonut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTiB(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-slate-800">
                  {formatPercent(usedPercent)}
                </span>
                <span className="text-xs text-slate-400">used</span>
              </div>
            </div>
          )}
          {volumes.data && (
            <div className="mt-2 flex justify-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden />
                Used {formatTiB(volumes.data.capacity.total_used_tib)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-100" aria-hidden />
                Available {formatTiB(volumes.data.capacity.total_available_tib)}
              </span>
            </div>
          )}
        </ChartCard>

        {/* Aggregate fill bars */}
        <ChartCard
          title="Aggregate Fill"
          subtitle="Used % per aggregate vs each aggregate's full threshold"
        >
          {aggregates.isPending ? (
            <LoadingSkeleton rows={6} />
          ) : aggregates.isError ? (
            <ErrorState error={aggregates.error} onRetry={() => aggregates.refetch()} compact />
          ) : (
            <ul className="space-y-3">
              {(aggregates.data?.aggregates ?? []).map((aggregate) => (
                <li key={aggregate.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-xs text-slate-600">{aggregate.name}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatTiB(aggregate.used_tib)} / {formatTiB(aggregate.size_tib)}
                    </span>
                  </div>
                  <CapacityBar
                    usedPercent={aggregate.used_percent}
                    thresholdPercent={aggregate.full_threshold_percent}
                  />
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        {/* EMS severity donut */}
        <ChartCard
          title="EMS Severity"
          subtitle={ems.data ? `Last ${formatNumber(ems.data.events_examined)} events` : undefined}
        >
          {ems.isPending ? (
            <LoadingSkeleton rows={5} />
          ) : ems.isError ? (
            <ErrorState error={ems.error} onRetry={() => ems.refetch()} compact />
          ) : severityDonut.length === 0 ? (
            <EmptyState title="No events recorded" />
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityDonut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="88%"
                      paddingAngle={2}
                      strokeWidth={0}
                      style={{ cursor: 'pointer' }}
                      onClick={(_, index) => {
                        const entry = severityDonut[index];
                        if (entry) {
                          navigate(`/events?severity=${encodeURIComponent(entry.name)}`);
                        }
                      }}
                    >
                      {severityDonut.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                {severityDonut.map((entry) => (
                  <Link
                    key={entry.name}
                    to={`/events?severity=${encodeURIComponent(entry.name)}`}
                    className="flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-100 hover:text-blue-700"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
                    {entry.name} ({formatNumber(entry.value)})
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Click a segment or label to filter events</p>
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent errors */}
        <ChartCard
          title="Recent Errors & Alerts"
          subtitle="Top 5 from the EMS error feed"
          actions={
            <Link to="/events" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          }
        >
          {emsErrors.isPending ? (
            <LoadingSkeleton rows={5} />
          ) : emsErrors.isError ? (
            <ErrorState error={emsErrors.error} onRetry={() => emsErrors.refetch()} compact />
          ) : recentErrors.length === 0 ? (
            <EmptyState
              title="No open errors or alerts"
              description="No error, alert, or emergency severity events in the recent EMS feed."
              icon={<Activity className="h-6 w-6 text-green-500" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentErrors.map((event) => (
                <li key={`${event.node?.name}-${event.index}`}>
                  <Link
                    to="/events?severity=emergency,alert,error"
                    className="flex items-start gap-3 py-2 transition-colors hover:bg-slate-50"
                  >
                    <SeverityBadge severity={event.message?.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-slate-700" title={event.log_message}>
                        {event.log_message ?? event.message?.name ?? '—'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {event.node?.name ?? 'unknown node'} · {formatRelative(event.time)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        {/* Cluster activity time series */}
        <ClusterActivityCard />
      </div>

      {/* Ingestion health strip */}
      <ChartCard
        title="Ingestion Health"
        subtitle={meta.data ? `Data fetched ${formatTimestamp(meta.data.fetched_at)}` : undefined}
      >
        {meta.isPending ? (
          <LoadingSkeleton rows={2} />
        ) : meta.isError ? (
          <ErrorState error={meta.error} onRetry={() => meta.refetch()} compact />
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(meta.data?.sources ?? {}).map(([name, source]) => (
              <div key={name} className="flex items-center gap-2">
                <StatusDot
                  tone={source.ok ? 'ok' : 'crit'}
                  label={`${name}: ${source.ok ? 'healthy' : 'failing'}`}
                  pulse={!source.ok}
                />
                <span className="text-xs font-medium text-slate-600">{name}</span>
                <span className={`text-[11px] tabular-nums ${stateTone(source.ok ? 'ok' : 'down') === 'ok' ? 'text-slate-400' : 'text-red-500'}`}>
                  {formatNumber(source.count)} records
                </span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
