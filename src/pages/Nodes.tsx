import { Cpu, MemoryStick, Server, Timer } from 'lucide-react';
import { useNodes } from '../hooks/queries';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { formatBytes, formatUptime } from '../lib/format';
import { stateTone } from '../lib/status';
import type { StatusTone } from '../lib/status';
import type { NodeRecord } from '../types/netapp';

interface HealthFlag {
  label: string;
  tone: StatusTone;
  detail: string;
}

function healthFlags(node: NodeRecord): HealthFlag[] {
  const controller = node.controller;
  const failedFans = controller?.failed_fan?.count ?? 0;
  const failedPsus = controller?.failed_power_supply?.count ?? 0;
  const overTemp = controller?.over_temperature;
  const battery = node.nvram?.battery_state;

  return [
    {
      label: 'Fans',
      tone: failedFans > 0 ? 'crit' : 'ok',
      detail: failedFans > 0 ? `${failedFans} failed` : 'OK',
    },
    {
      label: 'PSUs',
      tone: failedPsus > 0 ? 'crit' : 'ok',
      detail: failedPsus > 0 ? `${failedPsus} failed` : 'OK',
    },
    {
      label: 'Temp',
      tone: overTemp === 'normal' ? 'ok' : overTemp ? 'crit' : 'neutral',
      detail: overTemp ?? 'unknown',
    },
    {
      label: 'NVRAM',
      tone: battery === 'battery_ok' ? 'ok' : battery ? 'crit' : 'neutral',
      detail: battery?.replace(/^battery_/, '') ?? 'unknown',
    },
  ];
}

function NodeCard({ node }: { node: NodeRecord }) {
  const version = node.version?.full?.match(/NetApp Release ([^:]+)/)?.[1] ?? node.version?.full;
  const haPartner = node.ha?.partners?.[0]?.name;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Server className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <div className="min-w-0">
            <h2 className="truncate font-mono text-sm font-semibold text-slate-800">{node.name}</h2>
            <p className="text-[11px] text-slate-400">
              {node.model ?? 'unknown model'}
              {node.serial_number && (
                <span className="font-mono"> · SN {node.serial_number}</span>
              )}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs capitalize text-slate-500">
          <StatusDot tone={stateTone(node.state)} label={`State: ${node.state ?? 'unknown'}`} />
          {node.state ?? 'unknown'}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="col-span-2">
          <dt className="text-slate-400">ONTAP</dt>
          <dd className="font-mono text-slate-700">{version ?? '—'}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <dt className="text-slate-400">Uptime</dt>
          <dd className="tabular-nums text-slate-700">{formatUptime(node.uptime)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MemoryStick className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <dt className="text-slate-400">Memory</dt>
          <dd className="tabular-nums text-slate-700">{formatBytes(node.controller?.memory_size)}</dd>
        </div>
        <div className="col-span-2 flex items-start gap-1.5">
          <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <div>
            <dt className="text-slate-400">CPU</dt>
            <dd className="text-slate-700">
              {node.controller?.cpu?.count ?? '—'} cores
              {node.controller?.cpu?.processor && (
                <span className="block text-[11px] text-slate-400">{node.controller.cpu.processor}</span>
              )}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
        <div className="mb-1 font-medium text-slate-500">High Availability</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
          <span>
            Partner: <span className="font-mono">{haPartner ?? '—'}</span>
          </span>
          <span className="flex items-center gap-1">
            Interconnect:
            <StatusDot
              tone={stateTone(node.ha?.interconnect?.state)}
              label={`Interconnect: ${node.ha?.interconnect?.state ?? 'unknown'}`}
            />
            {node.ha?.interconnect?.state ?? '—'}
          </span>
          <span>Takeover: {node.ha?.takeover?.state?.replace(/_/g, ' ') ?? '—'}</span>
          {node.ha?.auto_giveback !== undefined && (
            <span>Auto-giveback: {node.ha.auto_giveback ? 'on' : 'off'}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {healthFlags(node).map((flag) => (
          <span
            key={flag.label}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600"
          >
            <StatusDot tone={flag.tone} label={`${flag.label}: ${flag.detail}`} />
            {flag.label}: {flag.detail}
          </span>
        ))}
        {node.service_processor && (
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
            <StatusDot
              tone={stateTone(node.service_processor.state)}
              label={`Service processor: ${node.service_processor.state ?? 'unknown'}`}
            />
            SP: {node.service_processor.state ?? '—'} (fw {node.service_processor.firmware_version ?? '—'})
          </span>
        )}
      </div>
    </article>
  );
}

export function Nodes() {
  const { data, isPending, isError, error, refetch } = useNodes();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  if (!data || data.length === 0) {
    return <EmptyState title="No nodes returned" description="The ingestion API returned no node records." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {data.map((node) => (
        <NodeCard key={node.uuid} node={node} />
      ))}
    </div>
  );
}
