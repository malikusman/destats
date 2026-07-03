import { RefreshCw } from 'lucide-react';
import { useSystemStatus } from '../hooks/scorpius';
import { formatRelative } from '../lib/format';
import type { ServiceHealth, ServiceStatus } from '../types/scorpius';

const HEALTH_DOT: Record<ServiceHealth, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-yellow-400',
  down: 'bg-red-500',
  unknown: 'bg-slate-300',
};

const HEALTH_CARD: Record<ServiceHealth, string> = {
  healthy: 'border-emerald-100',
  degraded: 'border-yellow-200 bg-yellow-50',
  down: 'border-red-200 bg-red-50',
  unknown: 'border-slate-200',
};

const HEALTH_LABEL: Record<ServiceHealth, string> = {
  healthy: 'text-emerald-700',
  degraded: 'text-yellow-700',
  down: 'text-red-700',
  unknown: 'text-slate-500',
};

const OVERALL_STYLE: Record<ServiceHealth, { bg: string; text: string; label: string }> = {
  healthy: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    label: 'All Systems Operational',
  },
  degraded: {
    bg: 'bg-yellow-50 border-yellow-300',
    text: 'text-yellow-900',
    label: 'Partial Degradation Detected',
  },
  down: {
    bg: 'bg-red-50 border-red-300',
    text: 'text-red-900',
    label: 'Critical Outage',
  },
  unknown: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    label: 'Status Unknown',
  },
};

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ServiceCard({ svc }: { svc: ServiceStatus }) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${HEALTH_CARD[svc.health]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${HEALTH_DOT[svc.health]}`}
            />
            <span className="text-sm font-semibold text-slate-800 truncate">{svc.name}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{svc.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${HEALTH_LABEL[svc.health]}`}
        >
          {svc.health}
        </span>
      </div>

      {svc.error_message && (
        <div className="mt-2 rounded-md bg-red-50 border border-red-100 p-2 text-xs text-red-700">
          {svc.error_message}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase text-slate-400">Uptime</div>
          <div className="text-sm font-medium text-slate-700">{formatUptime(svc.uptime_seconds)}</div>
        </div>
        {svc.version && (
          <div>
            <div className="text-[10px] uppercase text-slate-400">Version</div>
            <div className="font-mono text-sm text-slate-700">{svc.version}</div>
          </div>
        )}
      </div>

      {svc.metrics && Object.keys(svc.metrics).length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(svc.metrics).map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] text-slate-400 truncate">{k.replace(/_/g, ' ')}</div>
                <div className="font-mono text-xs font-medium text-slate-700">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 text-[10px] text-slate-400">
        Checked {formatRelative(svc.last_check)}
      </div>
    </div>
  );
}

export function SystemStatus() {
  const { data, isLoading, isError, refetch, isFetching } = useSystemStatus();

  const overall = data?.overall_health ?? 'unknown';
  const overallStyle = OVERALL_STYLE[overall];

  const healthCount = (h: ServiceHealth) =>
    (data?.services ?? []).filter((s) => s.health === h).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Status</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Health of all Scorpius platform services
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

      {/* Overall banner */}
      {!isLoading && !isError && (
        <div className={`rounded-xl border p-4 ${overallStyle.bg}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block h-3 w-3 rounded-full ${HEALTH_DOT[overall]}`}
            />
            <span className={`text-base font-semibold ${overallStyle.text}`}>
              {overallStyle.label}
            </span>
            <span className="ml-auto text-xs text-slate-400">
              {healthCount('healthy')} healthy · {healthCount('degraded')} degraded · {healthCount('down')} down
            </span>
          </div>
          {data?.fetched_at && (
            <div className="mt-1 text-xs text-slate-400">
              Last updated: {formatRelative(data.fetched_at)}
            </div>
          )}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Total Services</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {data?.services?.length ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs text-emerald-600">Healthy</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{healthCount('healthy')}</div>
        </div>
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm">
          <div className="text-xs text-yellow-600">Degraded</div>
          <div className="mt-1 text-2xl font-bold text-yellow-700">{healthCount('degraded')}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <div className="text-xs text-red-600">Down</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{healthCount('down')}</div>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load system status.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.services ?? []).map((svc) => (
            <ServiceCard key={svc.id} svc={svc} />
          ))}
        </div>
      )}
    </div>
  );
}
