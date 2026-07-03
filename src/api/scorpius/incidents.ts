/**
 * Incident API module.
 *
 * Currently returns mock data.
 * To swap in a real API, replace the mock calls below with:
 *   return apiGet<IncidentListResponse>('/api/scorpius/incidents');
 */
import type { Incident, IncidentListResponse } from '../../types/scorpius';
import { getMockIncidentListResponse, getMockIncidentById } from '../../mocks/incidents';

export async function fetchIncidents(): Promise<IncidentListResponse> {
  await delay(280);
  return getMockIncidentListResponse();
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  await delay(180);
  return getMockIncidentById(id) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
