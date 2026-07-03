import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  ChevronRight,
  Clock,
  GitBranch,
  Play,
  Server,
} from 'lucide-react';
import { useIncident } from '../hooks/scorpius';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { Severity } from '../types/scorpius';

const SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-blue-50 text-blue-600 ring-blue-100',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const ACTOR_COLORS: Record<string, string> = {
  system: 'bg-slate-200 text-slate-600',
  ai: 'bg-violet-100 text-violet-700',
  user: 'bg-blue-100 text-blue-700',
  policy: 'bg-amber-100 text-amber-700',
};

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {isError ? 'Failed to load incident.' : `Incident ${id} not found.`}
      </div>
    );
  }

  const subRoutes = [
    { to: 'reasoning', label: 'AI Reasoning', icon: BrainCircuit },
    { to: 'planning', label: 'Planning', icon: GitBranch },
    { to: 'execution', label: 'Execution', icon: Play },
  ];

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div>
        <Link
          to="/incidents"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Incidents
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-slate-400">{incident.id}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${SEVERITY_BG[incident.severity]}`}
              >
                {incident.severity}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 ring-1 ring-inset ring-slate-200">
                {incident.status}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{incident.title}</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">{incident.description}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Created {formatRelative(incident.created_at)}
          </span>
          <span>{incident.source}</span>
        </div>
      </div>

      {/* Assets */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Server className="h-4 w-4 text-slate-400" />
          Affected Assets
        </div>
        <div className="flex flex-wrap gap-2">
          {incident.assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
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

      {/* Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          Incident Timeline
        </div>
        <ol className="relative border-l border-slate-200 pl-6">
          {incident.timeline.map((event, i) => (
            <li key={i} className={`${i < incident.timeline.length - 1 ? 'mb-5' : ''}`}>
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

      {/* Sub-route navigation */}
      <div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {subRoutes.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <ChevronRight className="h-3 w-3 opacity-50" />
            </NavLink>
          ))}
        </div>

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
