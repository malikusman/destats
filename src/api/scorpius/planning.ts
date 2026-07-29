/**
 * Planning API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<PlanResult>(`/api/scorpius/incidents/${id}/plan`);
 */
import type { PlanResult } from '../../types/scorpius';
import { USE_MOCK_INCIDENTS } from '../../lib/data-source';
import { getMockPlan } from '../../mocks/planning';

export async function fetchPlanForIncident(incidentId: string): Promise<PlanResult | null> {
  if (!USE_MOCK_INCIDENTS) return null;
  await delay(300);
  return getMockPlan(incidentId) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
