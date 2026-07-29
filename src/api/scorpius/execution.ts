/**
 * Execution API module.
 *
 * Currently returns mock data.
 * To swap in a real API:
 *   return apiGet<ExecutionRun>(`/api/scorpius/incidents/${id}/execution`);
 */
import type { ExecutionRun, ExecutionHistoryEntry } from '../../types/scorpius';
import { USE_MOCK_INCIDENTS } from '../../lib/data-source';
import { getMockExecution, getMockExecutionHistory } from '../../mocks/execution';

export async function fetchExecutionStatus(incidentId: string): Promise<ExecutionRun | null> {
  if (!USE_MOCK_INCIDENTS) return null;
  await delay(250);
  return getMockExecution(incidentId) ?? null;
}

export async function fetchExecutionHistory(): Promise<ExecutionHistoryEntry[]> {
  if (!USE_MOCK_INCIDENTS) return [];
  await delay(220);
  return getMockExecutionHistory();
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
