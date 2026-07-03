/**
 * System Status API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<SystemStatusResponse>('/api/scorpius/system/status');
 */
import type { SystemStatusResponse } from '../../types/scorpius';
import { getMockSystemStatus } from '../../mocks/systemStatus';

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  await delay(200);
  return getMockSystemStatus();
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
