import { useMemo, useState, type ReactNode } from 'react';
import { Bot, Gauge, ListOrdered, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  useCheckPolicyAction,
  useConfidenceScore,
  useEvaluateIncident,
  useRankRecommendations,
} from '../hooks/control-plane';
import { useIncidentDetail, useIncidentRecommendations } from '../hooks/incident-service';
import { useIncident } from '../hooks/scorpius';
import { isDemoIncidentId } from '../lib/incident-adapters';
import { formatRelative } from '../lib/format';
import type { CandidateAction } from '../types/control-plane';

const DEFAULT_ACTIONS: CandidateAction[] = [
  {
    action_id: 'A-1',
    name: 'investigate',
    description: 'Read-only investigation of the affected entity',
    estimated_risk: 'LOW',
    requires_approval: false,
  },
  {
    action_id: 'A-2',
    name: 'remediate',
    description: 'Apply a high-risk remediation change',
    estimated_risk: 'HIGH',
    requires_approval: true,
  },
];

function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

function formatEvidenceItem(item: unknown): string {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    if (record.metric != null && record.value != null) {
      return `${String(record.metric)}: ${String(record.value)}`;
    }
    if (record.source != null) return String(record.source);
  }
  return JSON.stringify(item);
}

function formatRiskLabel(risk: unknown): string {
  if (typeof risk === 'string') return risk;
  if (typeof risk === 'object' && risk !== null) return JSON.stringify(risk);
  return String(risk);
}

function ResultBox({
  title,
  loading,
  error,
  children,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {loading && <p className="mt-2 text-xs text-slate-400">Running…</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!loading && !error && children}
    </div>
  );
}

export function IncidentControlPlane() {
  const { id } = useParams<{ id: string }>();
  const isDemo = isDemoIncidentId(id);
  const demoQuery = useIncident(isDemo ? id : undefined);
  const apiQuery = useIncidentDetail(!isDemo ? id : undefined);
  const recommendations = useIncidentRecommendations(!isDemo ? id : undefined);

  const evaluate = useEvaluateIncident();
  const rank = useRankRecommendations();
  const confidence = useConfidenceScore();
  const policyCheck = useCheckPolicyAction();

  const [selectedAction, setSelectedAction] = useState('investigate');

  const incidentMeta = useMemo(() => {
    if (isDemo && demoQuery.data) {
      const demo = demoQuery.data;
      return {
        incident_id: demo.id,
        title: demo.title,
        description: demo.description,
        severity: demo.severity,
        status: demo.status,
        entity: demo.assets[0]?.name ?? demo.source,
        signals: [{ metric: 'demo_signal', value: 1 }],
      };
    }
    if (!isDemo && apiQuery.data) {
      const inc = apiQuery.data;
      return {
        incident_id: inc.incident_id,
        title: inc.title,
        description: inc.description,
        severity: inc.severity,
        status: inc.status,
        entity: inc.entity,
        signals: [{ metric: 'alert_count', value: inc.alert_count }],
      };
    }
    return null;
  }, [isDemo, demoQuery.data, apiQuery.data]);

  const candidateActions = useMemo((): CandidateAction[] => {
    const recs = recommendations.data ?? [];
    if (recs.length === 0) return DEFAULT_ACTIONS;
    return recs.slice(0, 4).map((rec, i) => ({
      action_id: rec.recommendation_id || `R-${i + 1}`,
      name: rec.title,
      description: rec.title,
      estimated_risk: (rec.risk || 'MEDIUM').toUpperCase(),
      requires_approval: (rec.risk || '').toLowerCase().includes('high'),
    }));
  }, [recommendations.data]);

  const actionLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const action of candidateActions) {
      map.set(action.action_id, action.name);
    }
    return map;
  }, [candidateActions]);

  const runEvaluate = () => {
    if (!incidentMeta) return;
    evaluate.mutate({
      incident_id: incidentMeta.incident_id,
      title: incidentMeta.title,
      description: incidentMeta.description,
      severity: incidentMeta.severity,
      status: incidentMeta.status,
      tenant_id: 'tdk',
      asset_ids: incidentMeta.entity ? [incidentMeta.entity] : [],
      signals: incidentMeta.signals,
    });
  };

  const runRank = () => {
    rank.mutate(candidateActions);
  };

  const runConfidence = () => {
    const action = candidateActions[0] ?? DEFAULT_ACTIONS[0];
    confidence.mutate({
      action,
      evidence: [
        { source: 'incident' },
        { source: 'timeline' },
        { source: 'asset' },
      ],
    });
  };

  const runPolicyCheck = () => {
    policyCheck.mutate({
      component_name: 'agent',
      tenant_id: 'tdk',
      user_id: 'operator-1',
      roles: ['operator'],
      resource: incidentMeta?.entity ?? 'unknown',
      action: selectedAction,
      context: {
        risk_level: selectedAction === 'investigate' ? 'LOW' : 'HIGH',
        evidence_complete: true,
      },
    });
  };

  if (!incidentMeta && (demoQuery.isLoading || apiQuery.isLoading)) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!incidentMeta) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Incident context unavailable for Control Plane probes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Assess this incident with agent evaluation, recommendation ranking, confidence, and policy
        checks.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Bot className="h-4 w-4 text-slate-400" />
            Evaluate incident
          </div>
          <p className="text-xs text-slate-500">
            Score whether this incident has enough context and signal evidence to proceed.
          </p>
          <button
            type="button"
            onClick={runEvaluate}
            disabled={evaluate.isPending}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {evaluate.isPending ? 'Evaluating…' : 'Run evaluate'}
          </button>
        </div>

        <ResultBox
          title="Evaluation result"
          loading={evaluate.isPending}
          error={evaluate.isError ? (evaluate.error as Error).message : null}
        >
          {evaluate.data && (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-400">Accepted</dt>
                <dd className="font-medium text-slate-800">{String(evaluate.data.accepted)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-400">Score</dt>
                <dd className="font-mono text-slate-800">{evaluate.data.score}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Reasons</dt>
                <dd className="text-slate-700">
                  <ul className="mt-0.5 list-disc pl-4 text-xs">
                    {evaluate.data.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              {evaluate.data.evaluator && (
                <div className="flex gap-2">
                  <dt className="text-slate-400">Evaluator</dt>
                  <dd className="font-medium text-slate-800">{evaluate.data.evaluator}</dd>
                </div>
              )}
              {evaluate.data.evidence.length > 0 && (
                <div>
                  <dt className="text-slate-400">Evidence</dt>
                  <dd className="text-slate-700">
                    <ul className="mt-0.5 list-disc pl-4 font-mono text-xs">
                      {evaluate.data.evidence.map((item, i) => (
                        <li key={i}>{formatEvidenceItem(item)}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {hasDisplayValue(evaluate.data.risk) && (
                <div className="flex gap-2">
                  <dt className="text-slate-400">Risk</dt>
                  <dd className="text-slate-700">{formatRiskLabel(evaluate.data.risk)}</dd>
                </div>
              )}
              {evaluate.data.created_at && (
                <div className="flex gap-2">
                  <dt className="text-slate-400">Evaluated</dt>
                  <dd className="text-xs text-slate-500">
                    {formatRelative(evaluate.data.created_at)}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {!evaluate.data && !evaluate.isPending && !evaluate.isError && (
            <p className="mt-2 text-xs text-slate-400">Not run yet.</p>
          )}
        </ResultBox>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ListOrdered className="h-4 w-4 text-slate-400" />
            Rank recommendations
          </div>
          <p className="text-xs text-slate-500">
            Order candidate actions by risk and approval requirements.
          </p>
          <button
            type="button"
            onClick={runRank}
            disabled={rank.isPending}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {rank.isPending ? 'Ranking…' : 'Run rank'}
          </button>
        </div>

        <ResultBox
          title="Ranking result"
          loading={rank.isPending}
          error={rank.isError ? (rank.error as Error).message : null}
        >
          {rank.data && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-slate-400">
                Method: {rank.data.ranking_method}
              </p>
              <ul className="space-y-2 text-xs">
                {rank.data.recommendations.map((r) => {
                  const label = actionLabels.get(r.action_id);
                  return (
                    <li
                      key={r.action_id}
                      className="rounded-lg bg-slate-50 px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-700">
                          #{r.rank} {r.action_id}
                          {label && label !== r.action_id ? (
                            <span className="ml-1 font-sans text-slate-500">· {label}</span>
                          ) : null}
                        </span>
                        <span className="font-mono text-slate-500">{r.score}</span>
                      </div>
                      {r.reasons.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-500">
                          {r.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              {rank.data.created_at && (
                <p className="text-[11px] text-slate-400">
                  Ranked {formatRelative(rank.data.created_at)}
                </p>
              )}
            </div>
          )}
          {!rank.data && !rank.isPending && !rank.isError && (
            <p className="mt-2 text-xs text-slate-400">Not run yet.</p>
          )}
        </ResultBox>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Gauge className="h-4 w-4 text-slate-400" />
            Confidence score
          </div>
          <p className="text-xs text-slate-500">
            Estimate confidence from the available incident evidence.
          </p>
          <button
            type="button"
            onClick={runConfidence}
            disabled={confidence.isPending}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {confidence.isPending ? 'Scoring…' : 'Run confidence'}
          </button>
        </div>

        <ResultBox
          title="Confidence result"
          loading={confidence.isPending}
          error={confidence.isError ? (confidence.error as Error).message : null}
        >
          {confidence.data && (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-400">Score</dt>
                <dd className="font-mono text-slate-800">{confidence.data.score}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-400">Level</dt>
                <dd className="font-medium text-slate-800">{confidence.data.level}</dd>
              </div>
              <ul className="list-disc pl-4 text-xs text-slate-600">
                {confidence.data.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </dl>
          )}
          {!confidence.data && !confidence.isPending && !confidence.isError && (
            <p className="mt-2 text-xs text-slate-400">Not run yet.</p>
          )}
        </ResultBox>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            Policy check
          </div>
          <p className="text-xs text-slate-500">
            Check whether a proposed action is allowed under active policy.
          </p>
          <label className="mt-2 block text-xs text-slate-500">
            Action
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="investigate">Investigate</option>
              <option value="remediate">Remediate</option>
              <option value="delete">Delete</option>
            </select>
          </label>
          <button
            type="button"
            onClick={runPolicyCheck}
            disabled={policyCheck.isPending}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {policyCheck.isPending ? 'Checking…' : 'Run policy check'}
          </button>
        </div>

        <ResultBox
          title="Policy decision"
          loading={policyCheck.isPending}
          error={policyCheck.isError ? (policyCheck.error as Error).message : null}
        >
          {policyCheck.data && (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-400">Decision</dt>
                <dd className="font-semibold text-slate-800">{policyCheck.data.decision}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-400">Risk</dt>
                <dd className="text-slate-700">{policyCheck.data.risk_level}</dd>
              </div>
              <p className="text-xs text-slate-600">{policyCheck.data.reason}</p>
              {policyCheck.data.required_approver && (
                <p className="text-xs text-amber-700">
                  Approver: {policyCheck.data.required_approver}
                </p>
              )}
              {policyCheck.data.audit_required && (
                <p className="text-xs text-slate-500">Audit required</p>
              )}
              {policyCheck.data.policy_id && (
                <p className="font-mono text-[11px] text-slate-400">
                  Policy {policyCheck.data.policy_id.slice(0, 8)}…
                </p>
              )}
              {policyCheck.data.created_at && (
                <p className="text-[11px] text-slate-400">
                  Checked {formatRelative(policyCheck.data.created_at)}
                </p>
              )}
            </dl>
          )}
          {!policyCheck.data && !policyCheck.isPending && !policyCheck.isError && (
            <p className="mt-2 text-xs text-slate-400">Not run yet.</p>
          )}
        </ResultBox>
      </div>
    </div>
  );
}
