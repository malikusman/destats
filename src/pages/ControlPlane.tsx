import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { Box, FileText, RefreshCw, ScrollText, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useAiLogs,
  useAiModels,
  useAiPrompts,
  usePolicyRules,
} from '../hooks/control-plane';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { AiPromptMetadata } from '../types/control-plane';

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: 'models', label: 'Models', icon: Box },
  { to: 'prompts', label: 'Prompts', icon: FileText },
  { to: 'audit', label: 'AI Audit', icon: ScrollText },
  { to: 'policy', label: 'Policy', icon: Shield },
];

function RefreshButton({
  onClick,
  fetching,
}: {
  onClick: () => void;
  fetching: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={fetching}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );
}

export function ControlPlane() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Control Plane</h1>
        <p className="mt-1 text-sm text-slate-500">
          Models, prompts, request audit, and policy governance for Scorpius.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex sm:flex-wrap">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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

      <Outlet />
    </div>
  );
}

export function ControlPlaneIndex() {
  return <Navigate to="models" replace />;
}

export function ControlPlaneModelsTab() {
  const models = useAiModels();
  const rows = models.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={() => void models.refetch()} fetching={models.isFetching} />
      </div>

      {models.isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}

      {models.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load models right now. Try again in a moment.
        </div>
      )}

      {!models.isLoading && !models.isError && rows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No models configured.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => (
          <div key={m.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Box className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-800">{m.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      m.available
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-slate-200'
                    }`}
                  >
                    {m.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Provider: {m.provider}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  selected,
  onSelect,
}: {
  prompt: AiPromptMetadata;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left shadow-sm transition-colors ${
        selected
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] text-slate-400">{prompt.prompt_id}</span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
          v{prompt.version}
        </span>
        {prompt.model_preference && (
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">
            {prompt.model_preference}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">{prompt.name}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{prompt.purpose}</p>
    </button>
  );
}

export function ControlPlanePromptsTab() {
  const prompts = useAiPrompts();
  const rows = prompts.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((p) => p.prompt_id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={() => void prompts.refetch()} fetching={prompts.isFetching} />
      </div>

      {prompts.isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}

      {prompts.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load prompts right now. Try again in a moment.
        </div>
      )}

      {!prompts.isLoading && !prompts.isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No prompts configured.
              </p>
            )}
            {rows.map((p) => (
              <PromptCard
                key={p.prompt_id}
                prompt={p}
                selected={selected?.prompt_id === p.prompt_id}
                onSelect={() => setSelectedId(p.prompt_id)}
              />
            ))}
          </div>

          {selected && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />
                {selected.name}
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Purpose</dt>
                  <dd className="text-slate-700">{selected.purpose}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Required inputs</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(selected.required_inputs ?? []).map((input) => (
                      <span
                        key={input}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600"
                      >
                        {input}
                      </span>
                    ))}
                    {(selected.required_inputs ?? []).length === 0 && (
                      <span className="text-slate-400">—</span>
                    )}
                  </dd>
                </div>
                {selected.system_prompt && (
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">System prompt</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-600">
                      {selected.system_prompt}
                    </dd>
                  </div>
                )}
                {selected.user_prompt_template && (
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">User template</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-600">
                      {selected.user_prompt_template}
                    </dd>
                  </div>
                )}
                {selected.updated_at && (
                  <p className="text-xs text-slate-400">
                    Updated {formatRelative(selected.updated_at)}
                  </p>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ControlPlaneAuditTab() {
  const logs = useAiLogs();
  const rows = logs.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={() => void logs.refetch()} fetching={logs.isFetching} />
      </div>

      {logs.isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}

      {logs.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load audit activity right now. Try again in a moment.
        </div>
      )}

      {!logs.isLoading && !logs.isError && rows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No recent AI activity.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Component</th>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Latency</th>
                <th className="px-3 py-2 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.request_id} className="align-top">
                  <td
                    className="whitespace-nowrap px-3 py-2 text-xs text-slate-500"
                    title={formatTimestamp(row.created_at)}
                  >
                    {formatRelative(row.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{row.component_name}</span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-400">
                      {row.request_id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.model}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                        row.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-red-50 text-red-700 ring-red-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">
                    {typeof row.latency_ms === 'number' ? `${row.latency_ms.toFixed(2)} ms` : '—'}
                  </td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-500">
                    <p className="line-clamp-2" title={row.input_summary}>
                      {row.input_summary || '—'}
                    </p>
                    {row.error_message && (
                      <p className="mt-1 text-red-600">{row.error_message}</p>
                    )}
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

function outcomeBadge(outcome: string) {
  const o = outcome.toUpperCase();
  if (o.includes('DENY') || o === 'DENIED') return 'bg-red-50 text-red-700 ring-red-200';
  if (o.includes('APPROVAL') || o.includes('REVIEW'))
    return 'bg-amber-50 text-amber-800 ring-amber-200';
  if (o.includes('ALLOW')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export function ControlPlanePolicyTab() {
  const rules = usePolicyRules();
  const rows = [...(rules.data ?? [])].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={() => void rules.refetch()} fetching={rules.isFetching} />
      </div>

      {rules.isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}

      {rules.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load policy rules right now. Try again in a moment.
        </div>
      )}

      {!rules.isLoading && !rules.isError && rows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No policy rules configured.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((rule) => (
          <div
            key={rule.rule_id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {rule.rule_type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      rule.enabled
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-slate-200'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${outcomeBadge(rule.outcome)}`}
                  >
                    {rule.outcome}
                  </span>
                  {rule.risk_level && (
                    <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      {rule.risk_level}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[10px] text-slate-400">
                    Priority {rule.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{rule.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
                  {rule.required_approver && <span>Approver: {rule.required_approver}</span>}
                  {rule.audit_required && <span>Audit required</span>}
                  <span>Updated {formatRelative(rule.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
