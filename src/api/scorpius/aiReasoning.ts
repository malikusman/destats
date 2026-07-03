/**
 * AI Reasoning API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<AiReasoning>(`/api/scorpius/incidents/${id}/reasoning`);
 */
import type { AiReasoning } from '../../types/scorpius';
import { getMockReasoning } from '../../mocks/aiReasoning';

export async function fetchReasoningForIncident(incidentId: string): Promise<AiReasoning | null> {
  await delay(350);
  return getMockReasoning(incidentId) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
