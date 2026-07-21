/**
 * Knowledge API module.
 *
 * Default: live Epic 5 API via `/incident-api`.
 * Offline/demo fallback: set VITE_USE_MOCK_KNOWLEDGE=1
 */
import type { KnowledgeDocument, KnowledgeResponse, KnowledgeSearchResponse } from '../../types/scorpius';
import {
  getMockKnowledgeResponse,
  getMockKnowledgeForIncident,
  searchMockKnowledge,
} from '../../mocks/knowledge';
import {
  fetchKnowledgeAsDocuments,
  searchKnowledgeAsDocuments,
} from '../incident-service/knowledge';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_KNOWLEDGE === '1';

export async function fetchKnowledge(): Promise<KnowledgeResponse> {
  if (USE_MOCK) {
    await delay(260);
    return getMockKnowledgeResponse();
  }
  return fetchKnowledgeAsDocuments();
}

export async function fetchKnowledgeForIncident(incidentId: string): Promise<KnowledgeDocument[]> {
  if (USE_MOCK) {
    await delay(200);
    return getMockKnowledgeForIncident(incidentId);
  }
  // Live API has no incident-scoped list; return empty — retrieve is used on incident pages.
  void incidentId;
  return [];
}

export async function searchKnowledge(query: string): Promise<KnowledgeSearchResponse> {
  if (USE_MOCK) {
    await delay(400);
    return searchMockKnowledge(query);
  }
  return searchKnowledgeAsDocuments(query);
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
