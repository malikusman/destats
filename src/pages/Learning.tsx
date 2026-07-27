import { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  GraduationCap,
  ListFilter,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  X,
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [useCaseFilter, setUseCaseFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useLearningList();
  const stats = useLearningStats();
  const rankings = useLearningRankings();
  const feedback = useLearningFeedback();

  const filtered = useMemo(() => {
    const items = list.data ?? [];
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const outcome = (r.outcome_status ?? 'pending').toLowerCase();
      if (outcomeFilter !== 'all' && outcome !== outcomeFilter) return false;
      if (useCaseFilter !== 'all' && String(r.usecase_id ?? 'none') !== useCaseFilter) return false;
      if (!q) return true;
      return (
        r.learning_id.toLowerCase().includes(q) ||
        r.incident_id.toLowerCase().includes(q) ||
        (r.recommendation ?? '').toLowerCase().includes(q)
      );
    });
  }, [list.data, query, outcomeFilter, useCaseFilter]);

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
  const useCaseOptions = useMemo(
    () =>
      Array.from(
        new Set((list.data ?? []).map((record) => String(record.usecase_id ?? 'none'))),
      ).sort(),
    [list.data],
  );
  const hasFilters = Boolean(query.trim() || outcomeFilter !== 'all' || useCaseFilter !== 'all');
  const rankingItems = useMemo(() => {
    const raw = rankings.data;
    if (!raw || typeof raw !== 'object') return [] as Array<{ recommendation: string; success_rate: number }>;
    const maybeArray = (raw as { rankings?: unknown }).rankings;
    if (!Array.isArray(maybeArray)) return [];
    return maybeArray
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rec = (item as { recommendation?: unknown }).recommendation;
        const rate = (item as { success_rate?: unknown }).success_rate;
        if (typeof rec !== 'string' || typeof rate !== 'number') return null;
        return { recommendation: rec, success_rate: rate };
      })
      .filter((item): item is { recommendation: string; success_rate: number } => item !== null);
  }, [rankings.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Learning</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tracks recommendation outcomes and confidence shifts based on operator feedback.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
            filtersOpen || hasFilters
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Filters
        </button>
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

      {rankingItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top recommendations by learning performance
          </div>
          <ul className="space-y-2">
            {rankingItems.slice(0, 5).map((item) => (
              <li key={item.recommendation} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{item.recommendation}</p>
                  <span className="text-xs text-slate-500">
                    success {Math.round(item.success_rate * 100)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
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

      {filtersOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Filter learning records</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setOutcomeFilter('all');
                  setUseCaseFilter('all');
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['success', 'failed', 'pending'] as const).map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => setOutcomeFilter((prev) => (prev === outcome ? 'all' : outcome))}
                className={`rounded-full border px-2.5 py-1 text-xs capitalize ${
                  outcomeFilter === outcome
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {outcome}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {useCaseOptions.map((useCaseId) => (
              <button
                key={useCaseId}
                type="button"
                onClick={() => setUseCaseFilter((prev) => (prev === useCaseId ? 'all' : useCaseId))}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  useCaseFilter === useCaseId
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {useCaseId === 'none' ? 'No use case' : `Use case ${useCaseId}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {outcomeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 capitalize">
              {outcomeFilter}
              <button type="button" onClick={() => setOutcomeFilter('all')} aria-label="Clear outcome filter">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {useCaseFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              {useCaseFilter === 'none' ? 'No use case' : `Use case ${useCaseFilter}`}
              <button type="button" onClick={() => setUseCaseFilter('all')} aria-label="Clear use case filter">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {list.isLoading &&
            [1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          {!list.isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No learning records match the current filters.
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
                <p className="mb-2 text-xs font-medium text-slate-500">Did this recommendation work?</p>
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
