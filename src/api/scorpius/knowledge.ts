/**
 * Knowledge API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<KnowledgeResponse>('/api/scorpius/knowledge');
 *   return apiGet<KnowledgeSearchResponse>(`/api/scorpius/knowledge/search?q=${query}`);
 */
import type { KnowledgeDocument, KnowledgeResponse, KnowledgeSearchResponse } from '../../types/scorpius';
import {
  getMockKnowledgeResponse,
  getMockKnowledgeForIncident,
  searchMockKnowledge,
} from '../../mocks/knowledge';

export async function fetchKnowledge(): Promise<KnowledgeResponse> {
  await delay(260);
  return getMockKnowledgeResponse();
}

export async function fetchKnowledgeForIncident(incidentId: string): Promise<KnowledgeDocument[]> {
  await delay(200);
  return getMockKnowledgeForIncident(incidentId);
}

export async function searchKnowledge(query: string): Promise<KnowledgeSearchResponse> {
  await delay(400);
  return searchMockKnowledge(query);
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
