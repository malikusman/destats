import { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  useLearningFeedback,
  useLearningList,
  useLearningRankings,
  useLearningStats,
} from '../hooks/platform-api';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { LearningRecord } from '../types/platform-api';

function outcomeBadge(status: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'success') return 'bg-emerald-100 text-emerald-700';
  if (s === 'failed' || s === 'failure') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function LearningCard({
  record,
  selected,
  onSelect,
}: {
  record: LearningRecord;
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
        <span className="font-mono text-[10px] text-slate-400">{record.learning_id}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${outcomeBadge(record.outcome_status)}`}
        >
          {record.outcome_status ?? 'pending'}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          {formatRelative(record.updated_at)}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {record.recommendation ?? 'Learning record'}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{record.incident_id}</p>
    </button>
  );
}

export function Learning() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useLearningList();
  const stats = useLearningStats();
  const rankings = useLearningRankings();
  const feedback = useLearningFeedback();

  const filtered = useMemo(() => {
    const items = list.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.learning_id.toLowerCase().includes(q) ||
        r.incident_id.toLowerCase().includes(q) ||
        (r.recommendation ?? '').toLowerCase().includes(q),
    );
  }, [list.data, query]);

  const selected =
    filtered.find((r) => r.learning_id === selectedId) ??
    list.data?.find((r) => r.learning_id === selectedId) ??
    null;

  const statsEntries = useMemo(() => {
    const s = stats.data;
    if (!s || typeof s !== 'object') return [];
    return Object.entries(s).filter(
      ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
    );
  }, [stats.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Learning</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Outcome history, rankings, and feedback that adjust recommendation confidence
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading &&
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        {!stats.isLoading && statsEntries.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <BarChart3 className="h-4 w-4" />
              Stats
            </div>
            <p className="mt-1">
              {list.data?.length ?? 0} learning record{(list.data?.length ?? 0) !== 1 ? 's' : ''}{' '}
              loaded
            </p>
          </div>
        )}
        {statsEntries.slice(0, 8).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{key}</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{String(value)}</p>
          </div>
        ))}
      </div>

      {rankings.data != null && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Trophy className="h-4 w-4 text-amber-500" />
            Rankings
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600">
            {JSON.stringify(rankings.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by learning id, incident, or recommendation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {list.isLoading &&
            [1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          {!list.isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No learning records.
            </div>
          )}
          {!list.isLoading &&
            filtered.map((r) => (
              <LearningCard
                key={r.learning_id}
                record={r}
                selected={selectedId === r.learning_id}
                onSelect={() => setSelectedId(r.learning_id)}
              />
            ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          {!selected ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <GraduationCap className="h-8 w-8" />
              <p className="text-sm">Select a record for detail and feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-slate-400">{selected.learning_id}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  {selected.recommendation}
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Incident</dt>
                  <dd className="font-mono font-medium text-slate-700">{selected.incident_id}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Outcome</dt>
                  <dd className="font-medium text-slate-700">
                    {selected.outcome_status ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Success</dt>
                  <dd className="font-medium text-slate-700">
                    {selected.success == null ? '—' : selected.success ? 'true' : 'false'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Confidence after</dt>
                  <dd className="font-medium text-slate-700">
                    {selected.confidence_after != null
                      ? selected.confidence_after.toFixed(3)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Created</dt>
                  <dd className="font-medium text-slate-700">
                    {formatTimestamp(selected.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Use case</dt>
                  <dd className="font-medium text-slate-700">
                    {selected.usecase_id ?? '—'}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">Submit feedback</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={feedback.isPending}
                    onClick={() =>
                      feedback.mutate({
                        learningId: selected.learning_id,
                        payload: { success: true, rating: 5 },
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Mark success
                  </button>
                  <button
                    type="button"
                    disabled={feedback.isPending}
                    onClick={() =>
                      feedback.mutate({
                        learningId: selected.learning_id,
                        payload: { success: false, rating: 1 },
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Mark failure
                  </button>
                </div>
                {feedback.isSuccess && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Feedback saved
                  </p>
                )}
                {feedback.isError && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {(feedback.error as Error).message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
