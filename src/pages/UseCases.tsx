import { useMemo, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Download,
  Lightbulb,
  ListFilter,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useApproveUseCase,
  useArchiveUseCase,
  useCreateUseCase,
  useExportUseCases,
  useImportUseCases,
  useSubmitUseCase,
  useUseCaseIncidents,
  useUseCaseRelated,
  useUseCaseSearch,
  useUseCases,
  useUseCaseVersions,
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

function UseCaseDetailExtras({
  usecaseId,
  onSelectRelated,
}: {
  usecaseId: number;
  onSelectRelated: (id: number) => void;
}) {
  const versions = useUseCaseVersions(usecaseId);
  const incidents = useUseCaseIncidents(usecaseId);
  const related = useUseCaseRelated(usecaseId);

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Versions</p>
        {versions.isLoading && <p className="mt-1 text-xs text-slate-400">Loading…</p>}
        {!versions.isLoading && (versions.data?.length ?? 0) === 0 && (
          <p className="mt-1 text-xs text-slate-400">No prior versions recorded.</p>
        )}
        <ul className="mt-1 space-y-1">
          {(versions.data ?? []).slice(0, 5).map((v, i) => {
            const row = v as Record<string, unknown>;
            return (
              <li key={i} className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                {String(row.title ?? row.version ?? row.updated_at ?? `Version ${i + 1}`)}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Linked incidents</p>
        {incidents.isLoading && <p className="mt-1 text-xs text-slate-400">Loading…</p>}
        {!incidents.isLoading && (incidents.data?.length ?? 0) === 0 && (
          <p className="mt-1 text-xs text-slate-400">No linked incidents.</p>
        )}
        <ul className="mt-1 flex flex-wrap gap-2">
          {(incidents.data ?? []).map((id) => (
            <li key={id}>
              {id.startsWith('INC-') || id.includes('-') ? (
                <Link
                  to={`/incidents/${id}`}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {id}
                </Link>
              ) : (
                <span className="font-mono text-xs text-slate-600">{id}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-slate-400">Related use cases</p>
        {related.isLoading && <p className="mt-1 text-xs text-slate-400">Loading…</p>}
        {!related.isLoading && (related.data?.length ?? 0) === 0 && (
          <p className="mt-1 text-xs text-slate-400">No related use cases.</p>
        )}
        <ul className="mt-1 space-y-1">
          {(related.data ?? []).map((uc) => (
            <li key={uc.id}>
              <button
                type="button"
                onClick={() => onSelectRelated(uc.id)}
                className="text-left text-xs text-blue-600 hover:underline"
              >
                UC-{uc.id}: {uc.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function UseCases() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('capacity');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const list = useUseCases();
  const search = useUseCaseSearch(query);
  const create = useCreateUseCase();
  const submit = useSubmitUseCase();
  const approve = useApproveUseCase();
  const archive = useArchiveUseCase();
  const exportUc = useExportUseCases();
  const importUc = useImportUseCases();

  const isSearching = query.trim().length >= 2;
  const items = isSearching ? (search.data ?? []) : (list.data ?? []);
  const filteredItems = useMemo(() => {
    return items.filter((uc) => {
      if (statusFilter !== 'all' && uc.status.toLowerCase() !== statusFilter) return false;
      if (categoryFilter !== 'all' && (uc.category ?? 'uncategorized') !== categoryFilter) return false;
      return true;
    });
  }, [items, statusFilter, categoryFilter]);
  const selected = useMemo(
    () =>
      filteredItems.find((u) => u.id === selectedId) ??
      items.find((u) => u.id === selectedId) ??
      list.data?.find((u) => u.id === selectedId) ??
      null,
    [filteredItems, items, list.data, selectedId],
  );

  const isLoading = isSearching ? search.isLoading : list.isLoading;
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set((list.data ?? []).map((uc) => uc.status.toLowerCase())),
      ).sort(),
    [list.data],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set((list.data ?? []).map((uc) => uc.category ?? 'uncategorized')),
      ).sort(),
    [list.data],
  );
  const hasFilters = statusFilter !== 'all' || categoryFilter !== 'all';
  const canArchive =
    !!selected && !selected.status.toLowerCase().includes('archiv');

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

  async function handleExport() {
    setActionMsg(null);
    try {
      const data = await exportUc.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usecases-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionMsg('Export downloaded.');
    } catch (err) {
      setActionMsg((err as Error).message);
    }
  }

  async function handleImportFile(file: File) {
    setActionMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const payload =
        parsed && typeof parsed === 'object' && 'usecases' in (parsed as object)
          ? parsed
          : Array.isArray(parsed)
            ? { usecases: parsed }
            : parsed && typeof parsed === 'object' && 'records' in (parsed as object)
              ? { usecases: (parsed as { records: unknown }).records }
              : { usecases: [parsed] };
      await importUc.mutateAsync(payload);
      setActionMsg('Import completed.');
    } catch (err) {
      setActionMsg((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Use Cases</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Operational runbooks in lifecycle stages from draft to approval.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exportUc.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importUc.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleImportFile(file);
            }}
          />
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
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Lightbulb className="h-4 w-4" />
            {showCreate ? 'Cancel' : 'New draft'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <p className="text-xs text-slate-600">{actionMsg}</p>
      )}

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

      {filtersOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Filter use cases</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === status ? 'all' : status))}
                className={`rounded-full border px-2.5 py-1 text-xs capitalize ${
                  statusFilter === status
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((categoryOption) => (
              <button
                key={categoryOption}
                type="button"
                onClick={() =>
                  setCategoryFilter((prev) => (prev === categoryOption ? 'all' : categoryOption))
                }
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  categoryFilter === categoryOption
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {categoryOption}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 capitalize">
              {statusFilter}
              <button type="button" aria-label="Clear status filter" onClick={() => setStatusFilter('all')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              {categoryFilter}
              <button
                type="button"
                aria-label="Clear category filter"
                onClick={() => setCategoryFilter('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {isLoading &&
            [1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          {!isLoading && filteredItems.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No use cases match the current filters.
            </div>
          )}
          {!isLoading &&
            filteredItems.map((uc) => (
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
                {canArchive && (
                  <button
                    type="button"
                    disabled={archive.isPending}
                    onClick={() => archive.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                )}
              </div>
              {(submit.isError || approve.isError || archive.isError) && (
                <p className="text-xs text-red-600">
                  {((submit.error || approve.error || archive.error) as Error).message}
                </p>
              )}

              <UseCaseDetailExtras
                usecaseId={selected.id}
                onSelectRelated={(id) => setSelectedId(id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
