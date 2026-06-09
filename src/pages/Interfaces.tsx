import { useMemo, useState } from 'react';
import { Globe, Network } from 'lucide-react';
import { useInterfaces, useInterfacesSummary } from '../hooks/queries';
import { ChartCard } from '../components/ChartCard';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { KpiTile } from '../components/KpiTile';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { StatusDot } from '../components/StatusDot';
import { formatNumber } from '../lib/format';
import { stateTone } from '../lib/status';
import type { InterfaceRecord } from '../types/netapp';

const KEY_SERVICE_PREFIXES = ['data_', 'management_', 'intercluster_'];
const MAX_SERVICE_CHIPS = 4;

function serviceChips(services: string[] | undefined): { shown: string[]; more: number } {
  if (!services || services.length === 0) return { shown: [], more: 0 };
  const key = services.filter((service) =>
    KEY_SERVICE_PREFIXES.some((prefix) => service.startsWith(prefix)),
  );
  const list = key.length > 0 ? key : services;
  return { shown: list.slice(0, MAX_SERVICE_CHIPS), more: Math.max(0, list.length - MAX_SERVICE_CHIPS) };
}

export function Interfaces() {
  const summary = useInterfacesSummary();
  const { data, isPending, isError, error, refetch } = useInterfaces();
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [svmFilter, setSvmFilter] = useState<string>('all');

  const interfaces = useMemo(() => data ?? [], [data]);

  const svmOptions = useMemo(() => {
    const names = new Set<string>();
    for (const lif of interfaces) {
      if (lif.svm?.name) names.add(lif.svm.name);
    }
    return [...names].sort();
  }, [interfaces]);

  const filtered = useMemo(
    () =>
      interfaces.filter((lif) => {
        if (scopeFilter !== 'all' && lif.scope !== scopeFilter) return false;
        if (svmFilter !== 'all' && lif.svm?.name !== svmFilter) return false;
        return true;
      }),
    [interfaces, scopeFilter, svmFilter],
  );

  const scopeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lif of interfaces) {
      const scope = lif.scope ?? 'unknown';
      counts[scope] = (counts[scope] ?? 0) + 1;
    }
    return counts;
  }, [interfaces]);

  const upCount = Object.entries(summary.data?.state_counts ?? {})
    .filter(([state]) => state === 'up')
    .reduce((total, [, count]) => total + count, 0);
  const total = summary.data?.interfaces_examined ?? interfaces.length;
  const enabledCount = summary.data?.enabled_counts?.['True'] ?? 0;

  const columns: Column<InterfaceRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (lif) => <span className="font-mono text-xs text-slate-700">{lif.name}</span>,
      sortValue: (lif) => lif.name,
    },
    {
      key: 'ip',
      header: 'IP Address',
      cell: (lif) => (
        <span className="font-mono text-xs text-slate-600">
          {lif.ip?.address ?? '—'}
          {lif.ip?.netmask && <span className="text-slate-300">/{lif.ip.netmask}</span>}
        </span>
      ),
      sortValue: (lif) => lif.ip?.address ?? '',
    },
    {
      key: 'scope',
      header: 'Scope',
      cell: (lif) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            lif.scope === 'cluster'
              ? 'bg-purple-50 text-purple-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {lif.scope ?? '—'}
        </span>
      ),
      sortValue: (lif) => lif.scope ?? '',
    },
    {
      key: 'svm',
      header: 'SVM',
      cell: (lif) => <span className="text-xs text-slate-600">{lif.svm?.name ?? '—'}</span>,
      sortValue: (lif) => lif.svm?.name ?? '',
    },
    {
      key: 'state',
      header: 'State',
      cell: (lif) => (
        <span className="flex items-center gap-1.5 text-xs capitalize text-slate-600">
          <StatusDot tone={stateTone(lif.state)} label={`State: ${lif.state ?? 'unknown'}`} />
          {lif.state ?? '—'}
        </span>
      ),
      sortValue: (lif) => lif.state ?? '',
    },
    {
      key: 'enabled',
      header: 'Enabled',
      cell: (lif) => (
        <span className={`text-xs font-medium ${lif.enabled ? 'text-green-600' : 'text-red-600'}`}>
          {lif.enabled === undefined ? '—' : lif.enabled ? 'Yes' : 'No'}
        </span>
      ),
      sortValue: (lif) => (lif.enabled ? 1 : 0),
    },
    {
      key: 'home',
      header: 'Home Node · Port',
      cell: (lif) => (
        <span className="font-mono text-xs text-slate-600">
          {lif.location?.node?.name ?? '—'}
          {lif.location?.port?.name && <span className="text-slate-400"> · {lif.location.port.name}</span>}
          {lif.location?.is_home === false && (
            <span className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[10px] font-sans text-amber-700">not home</span>
          )}
        </span>
      ),
      sortValue: (lif) => lif.location?.node?.name ?? '',
    },
    {
      key: 'services',
      header: 'Services',
      cell: (lif) => {
        const { shown, more } = serviceChips(lif.services);
        return (
          <span className="flex flex-wrap gap-1">
            {shown.length === 0 && <span className="text-xs text-slate-300">—</span>}
            {shown.map((service) => (
              <span
                key={service}
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
              >
                {service}
              </span>
            ))}
            {more > 0 && (
              <span
                className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400"
                title={lif.services?.join(', ')}
              >
                +{more}
              </span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          label="Interfaces Up"
          value={`${upCount}/${total || '—'}`}
          tone={total > 0 && upCount === total ? 'ok' : total > 0 ? 'crit' : 'neutral'}
          icon={Network}
          loading={summary.isPending}
        />
        <KpiTile
          label="Enabled"
          value={formatNumber(enabledCount)}
          icon={Globe}
          tone="neutral"
          loading={summary.isPending}
        />
        <KpiTile
          label="SVM-scoped"
          value={formatNumber(scopeCounts.svm ?? 0)}
          tone="neutral"
          loading={isPending}
        />
        <KpiTile
          label="Cluster-scoped"
          value={formatNumber(scopeCounts.cluster ?? 0)}
          tone="neutral"
          loading={isPending}
        />
      </div>

      <ChartCard
        title="Logical Interfaces (LIFs)"
        subtitle={`${formatNumber(filtered.length)} of ${formatNumber(interfaces.length)} shown`}
        actions={
          <div className="flex gap-2">
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              aria-label="Filter by scope"
            >
              <option value="all">All scopes</option>
              <option value="svm">svm</option>
              <option value="cluster">cluster</option>
            </select>
            <select
              value={svmFilter}
              onChange={(event) => setSvmFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              aria-label="Filter by SVM"
            >
              <option value="all">All SVMs</option>
              {svmOptions.map((svm) => (
                <option key={svm} value={svm}>
                  {svm}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isPending ? (
          <LoadingSkeleton rows={10} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} compact />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(lif) => lif.uuid}
            initialSort={{ key: 'name', dir: 'asc' }}
            emptyMessage="No interfaces match the current filters."
          />
        )}
      </ChartCard>
    </div>
  );
}
