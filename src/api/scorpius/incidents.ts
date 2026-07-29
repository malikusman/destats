/**
 * Incident API module.
 *
 * Currently returns mock data.
 * To swap in a real API, replace the mock calls below with:
 *   return apiGet<IncidentListResponse>('/api/scorpius/incidents');
 */
import type { Incident, IncidentListResponse } from '../../types/scorpius';
import { USE_MOCK_INCIDENTS } from '../../lib/data-source';
import { getMockIncidentListResponse, getMockIncidentById } from '../../mocks/incidents';

export async function fetchIncidents(): Promise<IncidentListResponse> {
  if (!USE_MOCK_INCIDENTS) {
    return {
      incidents: [],
      total: 0,
      active_count: 0,
      fetched_at: new Date().toISOString(),
    };
  }
  await delay(280);
  return getMockIncidentListResponse();
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  if (!USE_MOCK_INCIDENTS) return null;
  await delay(180);
  return getMockIncidentById(id) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
