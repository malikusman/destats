import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { DemoWorkflowPlaceholder } from '../components/DemoWorkflowPlaceholder';
import { useExecutionHistory, useExecutionStatus } from '../hooks/scorpius';
import { isDemoIncidentId } from '../lib/incident-adapters';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { ActionStatus, ExecutionAction } from '../types/scorpius';

const ACTION_STATUS_STYLE: Record<
  ActionStatus,
  { icon: React.ReactNode; badge: string }
> = {
  pending: {
    icon: <Clock className="h-4 w-4 text-slate-400" />,
    badge: 'bg-slate-100 text-slate-500 ring-slate-200',
  },
  running: {
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  },
  failed: {
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    badge: 'bg-red-100 text-red-700 ring-red-200',
  },
  skipped: {
    icon: <SkipForward className="h-4 w-4 text-slate-400" />,
    badge: 'bg-slate-100 text-slate-400 ring-slate-200',
  },
};

const RUN_STATUS_STYLE: Record<ActionStatus, string> = {
  pending: 'bg-slate-100 text-slate-500',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-slate-100 text-slate-400',
};

function ActionRow({ action }: { action: ExecutionAction }) {
  const style = ACTION_STATUS_STYLE[action.status];
  return (
    <div
      className={`rounded-lg border p-3 ${
        action.status === 'running'
          ? 'border-blue-200 bg-blue-50'
          : action.status === 'failed'
          ? 'border-red-200 bg-red-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
          {action.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{action.name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${style.badge}`}>
              {style.icon}
              {action.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{action.description}</p>
          {action.output && (
            <div className="mt-2 rounded-md bg-slate-900 p-2 font-mono text-xs text-emerald-400">
              {action.output}
            </div>
          )}
          {action.error && (
            <div className="mt-2 rounded-md bg-red-900 p-2 font-mono text-xs text-red-200">
              {action.error}
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-400">
            {action.started_at && (
              <span>Started {formatTimestamp(action.started_at)}</span>
            )}
            {action.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {action.duration_seconds}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionProgress({ actions }: { actions: ExecutionAction[] }) {
  const total = actions.length;
  const completed = actions.filter((a) => a.status === 'completed').length;
  const failed = actions.filter((a) => a.status === 'failed').length;
  const running = actions.filter((a) => a.status === 'running').length;
  const pct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {completed} completed · {running} running · {failed} failed · {total - completed - running - failed} pending
        </span>
        <span className="font-medium text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** When accessed from /incidents/:id/execution — show single execution run */
export function Execution() {
  const { id } = useParams<{ id: string }>();
  const isDemo = isDemoIncidentId(id);
  const { data: run, isLoading, isError } = useExecutionStatus(isDemo ? id : undefined);

  if (!isDemo) {
    return <DemoWorkflowPlaceholder />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        No execution record found for this incident.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Run summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Play className="h-5 w-5 text-blue-500" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Execution Run — {run.id}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RUN_STATUS_STYLE[run.status]}`}>
                {run.status}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Started {formatTimestamp(run.started_at)}
              {run.completed_at && ` · Completed ${formatTimestamp(run.completed_at)}`}
            </div>
          </div>
          {run.rollback_triggered && (
            <div className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 ring-1 ring-inset ring-red-200">
              <RotateCcw className="h-3 w-3" /> Rollback triggered
            </div>
          )}
        </div>
        <div className="mt-3">
          <ExecutionProgress actions={run.actions} />
        </div>
        {run.outcome_summary && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
            {run.outcome_summary}
          </div>
        )}
      </div>

      {/* Action list */}
      <div className="space-y-2">
        {run.actions.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

/** When accessed from /execution (top-level) — show history across all incidents */
export function ExecutionDashboard() {
  const { data: history, isLoading, isError } = useExecutionHistory();

  const total = history?.length ?? 0;
  const completed = history?.filter((h) => h.status === 'completed').length ?? 0;
  const running = history?.filter((h) => h.status === 'running').length ?? 0;
  const failed = history?.filter((h) => h.status === 'failed').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Execution Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">History of all remediation executions</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Total Runs</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{total}</div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <div className="text-xs text-blue-600">Running</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{running}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs text-emerald-600">Completed</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{completed}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <div className="text-xs text-red-600">Failed</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{failed}</div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load execution history.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Run ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Incident</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Started</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(history ?? []).map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-800">{entry.incident_title}</div>
                    <div className="font-mono text-xs text-slate-400">{entry.incident_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RUN_STATUS_STYLE[entry.status]}`}>
                      {entry.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                      {entry.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {entry.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {entry.actions_completed}/{entry.actions_total} actions
                    {entry.actions_failed > 0 && (
                      <span className="ml-1 text-red-500">({entry.actions_failed} failed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatRelative(entry.started_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/incidents/${entry.incident_id}/execution`}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
