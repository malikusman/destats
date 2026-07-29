import { Navigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useAiReasoning } from '../hooks/scorpius';
import { isDemoIncidentId } from '../lib/incident-adapters';
import { formatTimestamp } from '../lib/format';
import type { EvidenceItem, KnowledgeReference, RecommendedAction, RiskLevel } from '../types/scorpius';

const RISK_BG: Record<RiskLevel, string> = {
  high: 'bg-red-100 text-red-700 ring-red-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const EVIDENCE_ICON: Record<EvidenceItem['type'], React.ReactNode> = {
  metric: <TrendingUp className="h-3.5 w-3.5 text-blue-500" />,
  event: <Sparkles className="h-3.5 w-3.5 text-orange-500" />,
  log: <BookOpen className="h-3.5 w-3.5 text-slate-500" />,
  historical: <BrainCircuit className="h-3.5 w-3.5 text-violet-500" />,
};

function ConfidenceGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-4xl font-bold ${color}`}>{pct}%</div>
      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${bgColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-slate-400">AI Confidence</div>
    </div>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const provenanceLabel =
    item.type === 'historical'
      ? 'Correlative context'
      : item.type === 'log'
        ? 'Observed diagnostic evidence'
        : item.type === 'event'
          ? 'Observed EMS evidence'
          : 'Observed telemetry';
  const confidenceTone =
    item.confidence_impact === 'high'
      ? 'text-emerald-700 bg-emerald-50'
      : item.confidence_impact === 'medium'
        ? 'text-amber-700 bg-amber-50'
        : 'text-slate-600 bg-slate-100';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mt-0.5 shrink-0">{EVIDENCE_ICON[item.type]}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
              {item.type}
            </span>
            <span className="text-xs text-slate-400">{item.source}</span>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-600">
            {Math.round(item.relevance_score * 100)}% relevant
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            {provenanceLabel}
          </span>
          {item.confidence_impact && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${confidenceTone}`}>
              {item.confidence_impact} confidence impact
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-700">{item.summary}</p>
        {item.value && (
          <span className="mt-1 inline-block font-mono text-xs font-semibold text-blue-700">
            {item.value}
          </span>
        )}
        {item.provenance_note && (
          <p className="mt-2 text-[11px] text-slate-500">{item.provenance_note}</p>
        )}
      </div>
    </div>
  );
}

function KnowledgeRefCard({ knowledgeRef: kref }: { knowledgeRef: KnowledgeReference }) {
  const TYPE_COLOR: Record<KnowledgeReference['type'], string> = {
    runbook: 'bg-blue-100 text-blue-700',
    incident_history: 'bg-violet-100 text-violet-700',
    use_case: 'bg-emerald-100 text-emerald-700',
    documentation: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${TYPE_COLOR[kref.type]}`}>
              {kref.type.replace('_', ' ')}
            </span>
            <span className="font-mono text-xs text-slate-400">{kref.id}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-800">{kref.title}</p>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-3">{kref.excerpt}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-700">
            {Math.round(kref.similarity_score * 100)}%
          </div>
          <div className="text-[10px] text-slate-400">match</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
        {kref.source_label && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{kref.source_label}</span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5">
          Similarity ranks related references, not root-cause certainty
        </span>
      </div>
      {kref.caveat && <p className="mt-2 text-[11px] text-amber-700">{kref.caveat}</p>}
    </div>
  );
}

function ActionCard({ action, rank }: { action: RecommendedAction; rank: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{action.action}</p>
          <p className="mt-1 text-xs text-slate-500">{action.rationale}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset capitalize ${RISK_BG[action.estimated_risk]}`}>
              {action.estimated_risk} risk
            </span>
            <span className="text-slate-500">~{action.estimated_duration_minutes} min</span>
            {action.reversible && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Reversible
              </span>
            )}
            {action.requires_approval && (
              <span className="flex items-center gap-1 text-amber-600">
                <ShieldAlert className="h-3 w-3" /> Requires approval
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiReasoning() {
  const { id } = useParams<{ id: string }>();
  const isDemo = isDemoIncidentId(id);
  const { data: reasoning, isLoading, isError } = useAiReasoning(isDemo ? id : undefined);
  const [showTrace, setShowTrace] = useState(false);

  if (!isDemo && id) {
    return <Navigate to={`/incidents/${id}/overview`} replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError || !reasoning) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        No AI reasoning available for this incident.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Summary header — stacked on all widths so text never squeezes beside the gauge */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0 self-center sm:self-start">
            <ConfidenceGauge score={reasoning.confidence_score} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <BrainCircuit className="h-4 w-4 shrink-0 text-violet-500" />
              <span className="text-sm font-semibold text-slate-700">AI Analysis Summary</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${RISK_BG[reasoning.risk_level]}`}
              >
                {reasoning.risk_level} risk
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{reasoning.incident_summary}</p>
            {reasoning.confidence_note && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {reasoning.confidence_note}
              </div>
            )}
            <div className="mt-3 rounded-lg bg-violet-50 p-3">
              <p className="mb-1 text-xs font-semibold text-violet-700">Root Cause Hypothesis</p>
              <p className="text-sm text-violet-900">{reasoning.root_cause_hypothesis}</p>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {reasoning.model_version} · Generated {formatTimestamp(reasoning.generated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          <Lightbulb className="h-4 w-4 shrink-0 text-yellow-500" />
          Supporting Evidence
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 sm:ml-auto">
            {reasoning.evidence.length} items
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Observed EMS and diagnostic evidence is separated from correlative or human-supplied
          context so operators can judge how much of the analysis is grounded.
        </p>
        <div className="space-y-2">
          {reasoning.evidence.map((e) => (
            <EvidenceCard key={e.id} item={e} />
          ))}
        </div>
      </div>

      {/* Knowledge refs */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen className="h-4 w-4 shrink-0 text-blue-500" />
          Knowledge References
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 sm:ml-auto">
            {reasoning.knowledge_references.length} docs
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          These references are semantic matches that may help investigation. They are not proof that
          the suggested root cause is correct.
        </p>
        <div className="space-y-2">
          {reasoning.knowledge_references.map((ref) => (
            <KnowledgeRefCard key={ref.id} knowledgeRef={ref} />
          ))}
        </div>
      </div>

      {/* Recommended actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Recommended Actions
        </div>
        <div className="space-y-2">
          {reasoning.recommended_actions.map((action) => (
            <ActionCard key={action.id} action={action} rank={action.rank} />
          ))}
        </div>
      </div>

      {/* Reasoning trace */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setShowTrace((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <BrainCircuit className="h-4 w-4 text-violet-500" />
          Chain-of-Thought Trace
          {showTrace ? (
            <ChevronUp className="ml-auto h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />
          )}
        </button>
        {showTrace && (
          <div className="border-t border-slate-100 p-4">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-600">
              {reasoning.reasoning_trace}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
