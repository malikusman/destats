import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  Clock,
  GitBranch,
  LayoutList,
  Play,
} from 'lucide-react';
import { useIncident } from '../hooks/scorpius';
import { formatRelative } from '../lib/format';
import type { Severity } from '../types/scorpius';

const SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-blue-50 text-blue-600 ring-blue-100',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
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
    { to: 'overview', label: 'Overview', icon: LayoutList, end: true },
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

      {/* Workflow tabs — each tab owns its full content; assets/timeline live on Overview only */}
      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex sm:flex-wrap">
          {subRoutes.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:justify-start sm:gap-2 sm:px-3 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-4 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
