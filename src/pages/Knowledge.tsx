import { useState } from 'react';
import {
  BookOpen,
  FileText,
  History,
  Lightbulb,
  Search,
  Tag,
} from 'lucide-react';
import { useKnowledge, useKnowledgeSearch } from '../hooks/scorpius';
import { formatRelative } from '../lib/format';
import type { KnowledgeDocument } from '../types/scorpius';

const TYPE_ICON: Record<KnowledgeDocument['type'], React.ReactNode> = {
  runbook: <BookOpen className="h-4 w-4 text-blue-500" />,
  incident_history: <History className="h-4 w-4 text-violet-500" />,
  use_case: <Lightbulb className="h-4 w-4 text-yellow-500" />,
  documentation: <FileText className="h-4 w-4 text-slate-400" />,
  policy: <Tag className="h-4 w-4 text-orange-400" />,
};

const TYPE_BADGE: Record<KnowledgeDocument['type'], string> = {
  runbook: 'bg-blue-100 text-blue-700',
  incident_history: 'bg-violet-100 text-violet-700',
  use_case: 'bg-yellow-100 text-yellow-700',
  documentation: 'bg-slate-100 text-slate-600',
  policy: 'bg-orange-100 text-orange-700',
};

function DocumentCard({ doc }: { doc: KnowledgeDocument }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{TYPE_ICON[doc.type]}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${TYPE_BADGE[doc.type]}`}
            >
              {doc.type.replace('_', ' ')}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{doc.id}</span>
            <span className="ml-auto text-xs text-slate-400">{doc.category}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{doc.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{doc.summary}</p>

          {expanded && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                {doc.content_excerpt}
              </p>
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show less ↑' : 'Show excerpt ↓'}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {doc.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
              >
                {t}
              </span>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              Updated {formatRelative(doc.updated_at)}
            </span>
          </div>

          {doc.related_incident_ids.length > 0 && (
            <div className="mt-1 text-xs text-slate-400">
              Linked incidents:{' '}
              {doc.related_incident_ids.map((id) => (
                <a
                  key={id}
                  href={`/incidents/${id}`}
                  className="mr-1 font-mono text-blue-600 hover:underline"
                >
                  {id}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Knowledge() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('all');

  const { data: allDocs, isLoading: loadingAll } = useKnowledge();
  const { data: searchResults, isLoading: loadingSearch } = useKnowledgeSearch(query);

  const isSearching = query.trim().length >= 2;
  const isLoading = isSearching ? loadingSearch : loadingAll;

  const documents = isSearching
    ? (searchResults?.results ?? []).map((r) => r.document)
    : (allDocs?.documents ?? []);

  const filtered =
    activeType === 'all' ? documents : documents.filter((d) => d.type === activeType);

  const typeCounts: Record<string, number> = {};
  (allDocs?.documents ?? []).forEach((d) => {
    typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;
  });

  const typeFilters: Array<{ key: string; label: string }> = [
    { key: 'all', label: `All (${allDocs?.total ?? 0})` },
    { key: 'runbook', label: `Runbooks (${typeCounts.runbook ?? 0})` },
    { key: 'incident_history', label: `History (${typeCounts.incident_history ?? 0})` },
    { key: 'use_case', label: `Use Cases (${typeCounts.use_case ?? 0})` },
    { key: 'policy', label: `Policies (${typeCounts.policy ?? 0})` },
    { key: 'documentation', label: `Docs (${typeCounts.documentation ?? 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Knowledge Repository</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Runbooks and historical resolutions used by Scorpius
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search knowledge base (e.g. aggregate capacity, secd, snapmirror)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {loadingSearch && query.length >= 2 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Searching…
          </div>
        )}
      </div>

      {/* Type filter */}
      {!isSearching && (
        <div className="flex flex-wrap gap-2">
          {typeFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeType === key
                  ? 'border-blue-300 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && isSearching && (
        <div className="text-xs text-slate-400">
          {searchResults?.total ?? 0} result{(searchResults?.total ?? 0) !== 1 ? 's' : ''} for &quot;{query}&quot;
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              {isSearching ? `No results for "${query}"` : 'No documents found.'}
            </div>
          ) : (
            filtered.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </div>
      )}
    </div>
  );
}
