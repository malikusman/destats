import { incidentGet, incidentPost } from './client';
import type {
  KnowledgeCreatePayload,
  KnowledgeCreateResponse,
  KnowledgeIngestRequest,
  KnowledgeIngestResponse,
  KnowledgeItem,
  KnowledgeRetrieveRequest,
  KnowledgeRetrieveResponse,
  KnowledgeSimilarRequest,
  KnowledgeSimilarResponse,
} from '../../types/platform-api';
import type {
  KnowledgeDocument,
  KnowledgeResponse,
  KnowledgeSearchResponse,
} from '../../types/scorpius';

function asKnowledgeList(data: unknown): KnowledgeItem[] {
  if (Array.isArray(data)) return data as KnowledgeItem[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['knowledge', 'items', 'records', 'knowledge_items', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as KnowledgeItem[];
    }
  }
  return [];
}

function mapDocumentType(raw: string | null | undefined): KnowledgeDocument['type'] {
  const t = (raw ?? '').toLowerCase().replace(/\s+/g, '_');
  if (t === 'runbook') return 'runbook';
  if (t === 'incident_history' || t === 'history') return 'incident_history';
  if (t === 'use_case' || t === 'usecase') return 'use_case';
  if (t === 'policy') return 'policy';
  return 'documentation';
}

/** Map live KnowledgeItem → UI KnowledgeDocument. */
export function toKnowledgeDocument(item: KnowledgeItem): KnowledgeDocument {
  const content = item.content ?? '';
  const summary =
    content.length > 160 ? `${content.slice(0, 157).trimEnd()}…` : content || item.title;
  return {
    id: String(item.id),
    title: item.title,
    type: mapDocumentType(item.document_type),
    category: item.document_type ?? 'Knowledge',
    summary,
    content_excerpt: content,
    tags: item.tags ?? [],
    related_incident_ids: [],
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function fetchPlatformKnowledge(): Promise<KnowledgeItem[]> {
  const data = await incidentGet<unknown>('/knowledge');
  return asKnowledgeList(data);
}

export async function searchPlatformKnowledge(query: string): Promise<KnowledgeItem[]> {
  const data = await incidentGet<unknown>(
    `/knowledge/search?q=${encodeURIComponent(query)}`,
  );
  return asKnowledgeList(data);
}

export function fetchKnowledgeItem(id: number | string): Promise<KnowledgeItem> {
  return incidentGet<KnowledgeItem>(`/knowledge/${encodeURIComponent(String(id))}`);
}

export function createKnowledge(payload: KnowledgeCreatePayload): Promise<KnowledgeCreateResponse> {
  return incidentPost<KnowledgeCreateResponse>('/knowledge', payload);
}

export function retrieveKnowledge(
  body: KnowledgeRetrieveRequest,
): Promise<KnowledgeRetrieveResponse> {
  return incidentPost<KnowledgeRetrieveResponse>('/knowledge/retrieve', body);
}

export function similarKnowledge(
  body: KnowledgeSimilarRequest,
): Promise<KnowledgeSimilarResponse> {
  return incidentPost<KnowledgeSimilarResponse>('/knowledge/similar', body);
}

export function ingestKnowledge(body: KnowledgeIngestRequest): Promise<KnowledgeIngestResponse> {
  return incidentPost<KnowledgeIngestResponse>('/knowledge/ingest', body);
}

export function reprocessKnowledge(id: number | string): Promise<unknown> {
  return incidentPost(`/knowledge/${encodeURIComponent(String(id))}/reprocess`, {});
}

/** UI-shaped list for Knowledge page (live API). */
export async function fetchKnowledgeAsDocuments(): Promise<KnowledgeResponse> {
  const items = await fetchPlatformKnowledge();
  return {
    documents: items.map(toKnowledgeDocument),
    total: items.length,
    fetched_at: new Date().toISOString(),
  };
}

/** UI-shaped search for Knowledge page (live API). */
export async function searchKnowledgeAsDocuments(query: string): Promise<KnowledgeSearchResponse> {
  const items = await searchPlatformKnowledge(query);
  return {
    query,
    total: items.length,
    results: items.map((item) => ({
      document: toKnowledgeDocument(item),
      score: item.similarity_score ?? 0.5,
      matched_excerpt: (item.content ?? '').slice(0, 200),
    })),
  };
}
