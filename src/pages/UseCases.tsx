import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Search,
  Send,
} from 'lucide-react';
import {
  useApproveUseCase,
  useCreateUseCase,
  useSubmitUseCase,
  useUseCaseSearch,
  useUseCases,
} from '../hooks/platform-api';
import { formatRelative, formatTimestamp } from '../lib/format';
import type { UseCase } from '../types/platform-api';

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes('approved')) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
  if (s.includes('pending') || s.includes('review')) return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
  if (s.includes('draft')) return 'bg-slate-100 text-slate-600 ring-slate-200';
  if (s.includes('archiv')) return 'bg-orange-100 text-orange-700 ring-orange-200';
  return 'bg-blue-100 text-blue-700 ring-blue-200';
}

function UseCaseCard({
  uc,
  selected,
  onSelect,
}: {
  uc: UseCase;
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
        <span className="font-mono text-[10px] text-slate-400">UC-{uc.id}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusBadge(uc.status)}`}
        >
          {uc.status}
        </span>
        {uc.category && (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
            {uc.category}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          Updated {formatRelative(uc.updated_at)}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">{uc.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{uc.description ?? uc.problem}</p>
    </button>
  );
}

export function UseCases() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('capacity');

  const list = useUseCases();
  const search = useUseCaseSearch(query);
  const create = useCreateUseCase();
  const submit = useSubmitUseCase();
  const approve = useApproveUseCase();

  const isSearching = query.trim().length >= 2;
  const items = isSearching ? (search.data ?? []) : (list.data ?? []);
  const selected = useMemo(
    () => items.find((u) => u.id === selectedId) ?? list.data?.find((u) => u.id === selectedId) ?? null,
    [items, list.data, selectedId],
  );

  const isLoading = isSearching ? search.isLoading : list.isLoading;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const created = await create.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      problem: description.trim() || undefined,
      environment: 'lab',
      category,
      status: 'draft',
    });
    setTitle('');
    setDescription('');
    setShowCreate(false);
    setSelectedId(created.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Use Cases</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Epic 4 repository — draft, submit, and approve operational use cases
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Lightbulb className="h-4 w-4" />
          {showCreate ? 'Cancel' : 'New draft'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <label className="text-xs font-medium text-slate-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g. Aggregate near-full remediation"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Problem and intended resolution path"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create draft'}
          </button>
          {create.isError && (
            <p className="text-xs text-red-600">{(create.error as Error).message}</p>
          )}
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search use cases…"
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
          {!isLoading && items.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No use cases found.
            </div>
          )}
          {!isLoading &&
            items.map((uc) => (
              <UseCaseCard
                key={uc.id}
                uc={uc}
                selected={selectedId === uc.id}
                onSelect={() => setSelectedId(uc.id)}
              />
            ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          {!selected ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <ClipboardList className="h-8 w-8" />
              <p className="text-sm">Select a use case to view details</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">UC-{selected.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusBadge(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{selected.description}</p>
              </div>
              {selected.problem && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">Problem</p>
                  <p className="mt-1 text-sm text-slate-700">{selected.problem}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Environment</dt>
                  <dd className="font-medium text-slate-700">{selected.environment ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Category</dt>
                  <dd className="font-medium text-slate-700">{selected.category ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Created</dt>
                  <dd className="font-medium text-slate-700">
                    {formatTimestamp(selected.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Approved by</dt>
                  <dd className="font-medium text-slate-700">{selected.approved_by ?? '—'}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {selected.status.toLowerCase() === 'draft' && (
                  <button
                    type="button"
                    disabled={submit.isPending}
                    onClick={() => submit.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit for review
                  </button>
                )}
                {(selected.status.toLowerCase().includes('pending') ||
                  selected.status.toLowerCase().includes('review')) && (
                  <button
                    type="button"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </button>
                )}
              </div>
              {(submit.isError || approve.isError) && (
                <p className="text-xs text-red-600">
                  {((submit.error || approve.error) as Error).message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
