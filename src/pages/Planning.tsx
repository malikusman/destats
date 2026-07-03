import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  GitBranch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import { usePlan } from '../hooks/scorpius';
import { formatTimestamp } from '../lib/format';
import type { CandidatePlan, PolicyCheck, PolicyDecision } from '../types/scorpius';

const POLICY_STYLE: Record<PolicyDecision, { icon: React.ReactNode; className: string }> = {
  approved: {
    icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  rejected: {
    icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
    className: 'bg-red-50 border-red-200 text-red-700',
  },
  review_required: {
    icon: <Shield className="h-4 w-4 text-amber-500" />,
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
};

function RiskBar({ score }: { score: number }) {
  const color =
    score <= 20 ? 'bg-emerald-500' : score <= 50 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{score}/100</span>
    </div>
  );
}

function PlanCard({ plan, isSelected }: { plan: CandidatePlan; isSelected: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white shadow-sm opacity-75'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{plan.name}</span>
            {isSelected && (
              <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                <Star className="h-2.5 w-2.5" /> Selected
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-emerald-700">{plan.success_probability}%</div>
          <div className="text-[10px] text-slate-400">success prob.</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Duration</div>
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Clock className="h-3 w-3 text-slate-400" />
            {plan.estimated_duration_minutes} min
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Risk</div>
          <RiskBar score={plan.risk_score} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">Steps</div>
        <ol className="space-y-1">
          {plan.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PolicyRow({ check }: { check: PolicyCheck }) {
  const style = POLICY_STYLE[check.decision];
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${style.className}`}>
      <div className="mt-0.5 shrink-0">{style.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{check.policy_name}</span>
          <span className="font-mono text-[10px] opacity-60">{check.policy_id}</span>
          <span className="ml-auto rounded-full bg-white bg-opacity-60 px-2 py-0.5 text-[10px] font-medium uppercase">
            {check.decision.replace('_', ' ')}
          </span>
        </div>
        <p className="mt-0.5 text-xs opacity-80">{check.reason}</p>
      </div>
    </div>
  );
}

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading, isError } = usePlan(id);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        No plan available for this incident yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <GitBranch className="h-5 w-5 text-blue-500" />
        <div>
          <div className="text-sm font-semibold text-slate-800">Remediation Plan — {plan.id}</div>
          <div className="text-xs text-slate-400">Generated {formatTimestamp(plan.generated_at)}</div>
        </div>
        {plan.approved_by && (
          <div className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Approved by {plan.approved_by}
          </div>
        )}
      </div>

      {/* Candidate plans */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Candidate Plans ({plan.candidate_plans.length})
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {plan.candidate_plans.map((p) => (
            <PlanCard key={p.id} plan={p} isSelected={p.id === plan.selected_plan_id} />
          ))}
        </div>
      </div>

      {/* Decision trace */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ChevronRight className="h-4 w-4 text-blue-500" />
          Decision Trace
        </div>
        <ol className="relative border-l border-slate-200 pl-6">
          {plan.decision_trace.map((step) => (
            <li key={step.step} className="mb-5 last:mb-0">
              <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-400" />
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  Step {step.step}
                </span>
                <span className="text-sm font-medium text-slate-800">{step.description}</span>
              </div>
              <div className="mt-1 rounded-md bg-slate-50 p-2 text-xs">
                <span className="font-semibold text-slate-700">Decision: </span>
                <span className="text-slate-600">{step.decision}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{step.rationale}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Policy checks */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Shield className="h-4 w-4 text-slate-400" />
          Policy Checks
        </div>
        <div className="space-y-2">
          {plan.policy_checks.map((c) => (
            <PolicyRow key={c.policy_id} check={c} />
          ))}
        </div>
      </div>

      {/* Outcome and rollback */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Estimated Outcome
          </div>
          <p className="text-sm text-emerald-900">{plan.estimated_outcome}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <XCircle className="h-4 w-4" /> Rollback Strategy
          </div>
          <p className="text-sm text-amber-900">{plan.rollback_strategy}</p>
        </div>
      </div>
    </div>
  );
}
