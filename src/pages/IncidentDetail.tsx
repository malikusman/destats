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
import { useIncident } from '../hooks/scorpius';
import { formatRelative } from '../lib/format';
import { isDemoIncidentId } from '../lib/incident-adapters';
import { SEVERITY_BG, severityTone, statusBadgeClass } from '../lib/incident-display';
import type { Severity } from '../types/scorpius';

const DEMO_SEVERITY_BG: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-blue-50 text-blue-600 ring-blue-100',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const DEMO_STATUS_BADGE: Record<string, string> = {
  active: 'bg-red-50 text-red-600 ring-red-100',
  investigating: 'bg-yellow-50 text-yellow-700 ring-yellow-100',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  suppressed: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const isDemo = isDemoIncidentId(id);

  const demoQuery = useIncident(isDemo ? id : undefined);
  const apiQuery = useIncidentDetail(!isDemo ? id : undefined);

  const isLoading = isDemo ? demoQuery.isLoading : apiQuery.isLoading;
  const isError = isDemo ? demoQuery.isError : apiQuery.isError;
  const demoIncident = demoQuery.data;
  const apiIncident = apiQuery.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const notFound = isDemo ? !demoIncident : !apiIncident;
  if (isError || notFound) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">
          {isError ? 'Failed to load incident.' : `Incident ${id} not found.`}
        </p>
        <p className="text-red-600">
          <Link to="/incidents" className="underline">
            Return to incidents list
          </Link>
        </p>
      </div>
    );
  }

  const subRoutes = [
    { to: 'overview', label: 'Overview', icon: LayoutList, end: true, demoOnly: false },
    { to: 'reasoning', label: 'AI Reasoning', icon: BrainCircuit, demoOnly: true },
    { to: 'planning', label: 'Planning', icon: GitBranch, demoOnly: true },
    { to: 'execution', label: 'Execution', icon: Play, demoOnly: true },
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

        {isDemo && demoIncident && (
          <>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-slate-400">{demoIncident.id}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${DEMO_SEVERITY_BG[demoIncident.severity]}`}
                  >
                    {demoIncident.severity}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${DEMO_STATUS_BADGE[demoIncident.status] ?? ''}`}
                  >
                    {demoIncident.status}
                  </span>
                </div>
                <h1 className="mt-1 text-xl font-bold text-slate-900">{demoIncident.title}</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">{demoIncident.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Created {formatRelative(demoIncident.created_at)}
              </span>
              <span>{demoIncident.source}</span>
            </div>
          </>
        )}

        {!isDemo && apiIncident && (
          <>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-slate-400">{apiIncident.incident_id}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
                    Live
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_BG[severityTone(apiIncident.severity)]}`}
                  >
                    {apiIncident.severity}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(apiIncident.status)}`}
                  >
                    {apiIncident.status}
                  </span>
                  {apiIncident.priority && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                      {apiIncident.priority} priority
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-xl font-bold text-slate-900">{apiIncident.title}</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">{apiIncident.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> First seen {formatRelative(apiIncident.first_seen)}
              </span>
              <span>{apiIncident.source}</span>
              {apiIncident.owner && <span>Owner: {apiIncident.owner}</span>}
            </div>
          </>
        )}
      </div>

      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex sm:flex-wrap">
          {subRoutes.map(({ to, label, icon: Icon, end, demoOnly }) => {
            const disabled = demoOnly && !isDemo;
            const tabClass = (isActive: boolean) =>
              `flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:justify-start sm:gap-2 sm:px-3 ${
                disabled
                  ? 'cursor-not-allowed text-slate-300'
                  : isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`;

            if (disabled) {
              return (
                <span
                  key={to}
                  className={tabClass(false)}
                  title="Workflow tabs are available for INC-* incidents only"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{label}</span>
                </span>
              );
            }

            return (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-4 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
