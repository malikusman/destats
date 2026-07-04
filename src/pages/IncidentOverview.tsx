import { useParams } from 'react-router-dom';
import { Clock, Server } from 'lucide-react';
import { useIncident } from '../hooks/scorpius';
import { formatTimestamp } from '../lib/format';

const ACTOR_COLORS: Record<string, string> = {
  system: 'bg-slate-200 text-slate-600',
  ai: 'bg-violet-100 text-violet-700',
  user: 'bg-blue-100 text-blue-700',
  policy: 'bg-amber-100 text-amber-700',
};

export function IncidentOverview() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (isError || !incident) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Server className="h-4 w-4 text-slate-400" />
          Affected Assets
        </div>
        <div className="flex flex-wrap gap-2">
          {incident.assets.map((asset) => (
            <div
              key={asset.id}
              className="flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-700">{asset.name}</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                {asset.type}
              </span>
              {asset.details && (
                <span className="text-xs text-slate-400">{asset.details}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          Incident Timeline
        </div>
        <ol className="relative border-l border-slate-200 pl-6">
          {incident.timeline.map((event, i) => (
            <li key={i} className={i < incident.timeline.length - 1 ? 'mb-5' : ''}>
              <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">{formatTimestamp(event.timestamp)}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${ACTOR_COLORS[event.actor] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {event.actor}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{event.event}</p>
              {event.detail && (
                <p className="mt-0.5 text-xs text-slate-500">{event.detail}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
