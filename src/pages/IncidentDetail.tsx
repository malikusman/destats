import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  Clock,
  GitBranch,
  LayoutList,
  Play,
} from 'lucide-react';
import { useIncidentDetail } from '../hooks/incident-service';
import { formatRelative } from '../lib/format';
import { SEVERITY_BG, severityTone, statusBadgeClass } from '../lib/incident-display';

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncidentDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (isError || !incident) {
    const isLegacyId = id?.startsWith('INC-');
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">
          {isError ? 'Failed to load incident.' : `Incident ${id} not found.`}
        </p>
        {isLegacyId && (
          <p className="text-red-600">
            IDs like <span className="font-mono">INC-004</span> are from the old demo data.
            The live API uses UUIDs — go back to the{' '}
            <Link to="/incidents" className="underline">
              incidents list
            </Link>{' '}
            and pick a current incident.
          </p>
        )}
        {!isLegacyId && !isError && (
          <p className="text-red-600">
            This incident may not exist in the API.{' '}
            <Link to="/incidents" className="underline">
              Return to incidents list
            </Link>
          </p>
        )}
      </div>
    );
  }

  const tone = severityTone(incident.severity);

  const subRoutes = [
    { to: 'overview', label: 'Overview', icon: LayoutList, end: true },
    { to: 'reasoning', label: 'AI Reasoning', icon: BrainCircuit },
    { to: 'planning', label: 'Planning', icon: GitBranch },
    { to: 'execution', label: 'Execution', icon: Play },
  ];

  return (
    <div className="space-y-6">
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
              <span className="font-mono text-sm text-slate-400">{incident.incident_id}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_BG[tone]}`}
              >
                {incident.severity}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(incident.status)}`}
              >
                {incident.status}
              </span>
              {incident.priority && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  {incident.priority} priority
                </span>
              )}
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{incident.title}</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">{incident.description}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> First seen {formatRelative(incident.first_seen)}
          </span>
          <span>{incident.source}</span>
          {incident.owner && <span>Owner: {incident.owner}</span>}
        </div>
      </div>

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
