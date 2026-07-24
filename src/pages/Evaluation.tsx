import { useMemo, useState } from 'react';
import { ClipboardCheck, Play, Search } from 'lucide-react';
import {
  useEvaluationHistory,
  useEvaluations,
  useRunEvaluation,
} from '../hooks/platform-api';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { EvaluationRecord } from '../types/platform-api';

function scoreColor(score: number | null) {
  if (score == null) return 'text-slate-500';
  if (score >= 0.8) return 'text-emerald-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function EvaluationCard({
  ev,
  selected,
  onSelect,
}: {
  ev: EvaluationRecord;
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
        <span className="font-mono text-[10px] text-slate-400">{ev.evaluation_id}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {ev.status}
        </span>
        <span className="ml-auto text-xs text-slate-400">{formatRelative(ev.updated_at)}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{ev.evaluation_type}</p>
        <p className={`text-sm font-bold ${scoreColor(ev.overall_score)}`}>
          {ev.overall_score != null ? ev.overall_score.toFixed(3) : '—'}
        </p>
      </div>
      {ev.learning_id && (
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">{ev.learning_id}</p>
      )}
    </button>
  );
}

export function Evaluation() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [learningId, setLearningId] = useState('LRN-749118C28398');
  const [showRun, setShowRun] = useState(false);

  const list = useEvaluations();
  const history = useEvaluationHistory();
  const run = useRunEvaluation();

  const combined = useMemo(() => {
    const map = new Map<string, EvaluationRecord>();
    for (const ev of [...(list.data ?? []), ...(history.data ?? [])]) {
      map.set(ev.evaluation_id, ev);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [list.data, history.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return combined;
    return combined.filter(
      (ev) =>
        ev.evaluation_id.toLowerCase().includes(q) ||
        (ev.learning_id ?? '').toLowerCase().includes(q) ||
        (ev.incident_id ?? '').toLowerCase().includes(q) ||
        ev.evaluation_type.toLowerCase().includes(q),
    );
  }, [combined, query]);

  const selected =
    filtered.find((e) => e.evaluation_id === selectedId) ??
    combined.find((e) => e.evaluation_id === selectedId) ??
    null;

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!learningId.trim()) return;
    const result = await run.mutateAsync({
      learning_id: learningId.trim(),
      evaluation_type: 'learning_outcome',
      retrieved_items: 5,
      relevant_retrieved_items: 4,
      total_known_relevant_items: 5,
      user_feedback_score: 0.9,
      response_time_ms: 420,
      response_time_threshold_ms: 1000,
      created_by: 'destats-ui',
    });
    setSelectedId(result.evaluation.evaluation_id);
    setShowRun(false);
  }

  const isLoading = list.isLoading && history.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Evaluation</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Outcome scores and metric breakdowns for learning runs
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRun((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Play className="h-4 w-4" />
          {showRun ? 'Cancel' : 'Run evaluation'}
        </button>
      </div>

      {showRun && (
        <form
          onSubmit={handleRun}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <label className="text-xs font-medium text-slate-600">Learning ID</label>
            <input
              value={learningId}
              onChange={(e) => setLearningId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={run.isPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {run.isPending ? 'Running…' : 'Run'}
          </button>
          {run.isError && (
            <p className="text-xs text-red-600">{(run.error as Error).message}</p>
          )}
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter evaluations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {isLoading &&
            [1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No evaluations yet.
            </div>
          )}
          {!isLoading &&
            filtered.map((ev) => (
              <EvaluationCard
                key={ev.evaluation_id}
                ev={ev}
                selected={selectedId === ev.evaluation_id}
                onSelect={() => setSelectedId(ev.evaluation_id)}
              />
            ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          {!selected ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <ClipboardCheck className="h-8 w-8" />
              <p className="text-sm">Select an evaluation to view metrics</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-slate-400">{selected.evaluation_id}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  {selected.evaluation_type}
                </h2>
                <p className={`mt-1 text-2xl font-bold ${scoreColor(selected.overall_score)}`}>
                  {selected.overall_score != null ? selected.overall_score.toFixed(4) : '—'}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium text-slate-700">{selected.status}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Learning</dt>
                  <dd className="font-mono font-medium text-slate-700">
                    {selected.learning_id ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Incident</dt>
                  <dd className="font-mono font-medium text-slate-700">
                    {selected.incident_id ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Completed</dt>
                  <dd className="font-medium text-slate-700">
                    {formatTimestamp(selected.completed_at)}
                  </dd>
                </div>
              </dl>
              {selected.metrics && selected.metrics.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-slate-400">Metrics</p>
                  <div className="space-y-2">
                    {selected.metrics.map((m) => (
                      <div
                        key={m.metric_id}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {m.metric_name}
                          </span>
                          <span
                            className={`text-sm font-semibold ${m.passed ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {m.metric_value.toFixed(3)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          threshold {m.threshold} · {m.passed ? 'passed' : 'failed'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
