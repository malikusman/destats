import { BookOpen, BrainCircuit, CheckCircle2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { applyLearning } from '../api/incident-service/learning';
import {
  useCreateLearning,
  useKnowledgeRetrieve,
  useLearningFeedback,
  useLearningForIncident,
  useRunEvaluation,
} from '../hooks/platform-api';
import type { Recommendation } from '../types/incident-service';
import type { LearningAppliedRecommendation } from '../types/platform-api';

interface Props {
  incidentId: string;
  title: string;
  description: string;
  recommendations: Recommendation[];
}

export function IncidentPlatformPanels({
  incidentId,
  title,
  description,
  recommendations,
}: Props) {
  const query = useMemo(
    () => [title, description].filter(Boolean).join(' — ').slice(0, 400),
    [title, description],
  );

  const retrieve = useKnowledgeRetrieve(query, 5);
  const learning = useLearningForIncident(incidentId);
  const createLearning = useCreateLearning();
  const feedback = useLearningFeedback();
  const evaluate = useRunEvaluation();

  const [applied, setApplied] = useState<LearningAppliedRecommendation[] | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const recKey = recommendations
    .map((r) => `${r.recommendation_id}:${r.confidence}:${r.title}`)
    .join('|');

  useEffect(() => {
    if (recommendations.length === 0) {
      setApplied(null);
      return;
    }
    let cancelled = false;
    const body = {
      recommendations: recommendations.map((r) => ({
        recommendation: r.title,
        confidence: r.confidence,
      })),
    };
    applyLearning(body)
      .then((res) => {
        if (!cancelled) setApplied(res.recommendations);
      })
      .catch(() => {
        if (!cancelled) setApplied(null);
      });
    return () => {
      cancelled = true;
    };
  }, [incidentId, recKey, recommendations]);

  const knowledgeRecords = retrieve.data?.semantic_search?.records ?? [];
  const learningRecords = learning.data ?? [];

  async function onFeedback(learningId: string, success: boolean) {
    setActionMsg(null);
    try {
      await feedback.mutateAsync({ learningId, payload: { success } });
      setActionMsg(success ? 'Marked learning as success' : 'Marked learning as failure');
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Feedback failed');
    }
  }

  async function onEvaluate(learningId: string) {
    setActionMsg(null);
    try {
      const res = await evaluate.mutateAsync({
        learning_id: learningId,
        evaluation_type: 'learning_outcome',
        retrieved_items: knowledgeRecords.length || 5,
        relevant_retrieved_items: Math.min(4, knowledgeRecords.length || 4),
        total_known_relevant_items: 5,
        user_feedback_score: 0.9,
        response_time_ms: 420,
        response_time_threshold_ms: 1000,
        created_by: 'destats-ui',
        incident_id: incidentId,
      });
      setActionMsg(`Evaluation ${res.evaluation.evaluation_id} score ${res.evaluation.overall_score}`);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Evaluation failed');
    }
  }

  async function onCreateFromRec(rec: LearningAppliedRecommendation | Recommendation) {
    setActionMsg(null);
    const text = 'recommendation' in rec ? rec.recommendation : rec.title;
    try {
      const res = await createLearning.mutateAsync({
        incident_id: incidentId,
        recommendation: text,
        outcome: 'pending',
        notes: 'Created from incident overview',
      });
      setActionMsg(`Created ${res.learning_record.learning_id}`);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Create learning failed');
    }
  }

  return (
    <div className="space-y-6">
      {actionMsg && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {actionMsg}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen className="h-4 w-4 text-blue-500" />
          Knowledge context
        </div>
        {retrieve.isLoading && <p className="text-sm text-slate-400">Retrieving…</p>}
        {retrieve.isError && (
          <p className="text-sm text-red-600">{(retrieve.error as Error).message}</p>
        )}
        {!retrieve.isLoading && knowledgeRecords.length === 0 && (
          <p className="text-sm text-slate-400">No knowledge matches for this incident.</p>
        )}
        <div className="space-y-2">
          {knowledgeRecords.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                {item.similarity_score != null && (
                  <span className="text-xs font-medium text-slate-500">
                    {Math.round(item.similarity_score * 100)}% match
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Recommendations (learning-adjusted)
        </div>
        {recommendations.length === 0 && !applied ? (
          <p className="text-sm text-slate-400">No recommendations yet.</p>
        ) : (
          <div className="space-y-2">
            {(applied ?? []).map((rec) => (
              <div
                key={rec.recommendation_key}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {rec.rank}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {rec.recommendation}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCreateFromRec(rec)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Log learning
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  confidence {Math.round(rec.confidence * 100)}% → adjusted{' '}
                  {Math.round(rec.adjusted_confidence * 100)}%
                  {rec.learning_applied ? ' · learning applied' : ''}
                </p>
              </div>
            ))}
            {!applied &&
              recommendations.map((rec) => (
                <div
                  key={rec.recommendation_id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                    <span className="text-xs font-medium text-slate-500">
                      {Math.round(rec.confidence * 100)}% · {rec.risk} risk
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BrainCircuit className="h-4 w-4 text-violet-500" />
          Learning for this incident
        </div>
        {learning.isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!learning.isLoading && learningRecords.length === 0 && (
          <p className="text-sm text-slate-400">No learning records linked yet.</p>
        )}
        <div className="space-y-2">
          {learningRecords.map((rec) => (
            <div
              key={rec.learning_id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">{rec.learning_id}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                  {rec.outcome_status ?? 'pending'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-800">{rec.recommendation}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFeedback(rec.learning_id, true)}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white"
                >
                  <ThumbsUp className="h-3 w-3" /> Success
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(rec.learning_id, false)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
                >
                  <ThumbsDown className="h-3 w-3" /> Failure
                </button>
                <button
                  type="button"
                  onClick={() => onEvaluate(rec.learning_id)}
                  className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700"
                >
                  Run evaluation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
