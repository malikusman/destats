/**
 * Planning API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<PlanResult>(`/api/scorpius/incidents/${id}/plan`);
 */
import type { PlanResult } from '../../types/scorpius';
import { getMockPlan } from '../../mocks/planning';

export async function fetchPlanForIncident(incidentId: string): Promise<PlanResult | null> {
  await delay(300);
  return getMockPlan(incidentId) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
