import { fetchIncidents } from '../scorpius/incidents';
import { fetchIncidentList, fetchIncidentStats } from '../incident-service/incidents';
import {
  apiIncidentToUnified,
  demoIncidentToUnified,
  mergeIncidentLists,
  mergeIncidentStats,
  statsFromApi,
} from '../../lib/incident-adapters';
import { USE_MOCK_INCIDENTS } from '../../lib/data-source';
import type { UnifiedIncidentsResult } from '../../types/unified-incident';
import type { IncidentListResponse } from '../../types/scorpius';

const EMPTY_DEMO: IncidentListResponse = {
  incidents: [],
  total: 0,
  active_count: 0,
  fetched_at: new Date().toISOString(),
};

export async function fetchUnifiedIncidents(): Promise<UnifiedIncidentsResult> {
  if (!USE_MOCK_INCIDENTS) {
    const [apiListResult, apiStatsResult] = await Promise.allSettled([
      fetchIncidentList(),
      fetchIncidentStats(),
    ]);

    const apiList = apiListResult.status === 'fulfilled' ? apiListResult.value : [];
    const apiStats = apiStatsResult.status === 'fulfilled' ? apiStatsResult.value : null;
    const apiAvailable = apiListResult.status === 'fulfilled';

    return {
      incidents: apiList.map(apiIncidentToUnified),
      stats: statsFromApi(apiStats),
      apiAvailable,
      sourceState: apiAvailable ? 'live' : 'unavailable',
    };
  }

  const [demoResult, apiListResult, apiStatsResult] = await Promise.allSettled([
    fetchIncidents(),
    fetchIncidentList(),
    fetchIncidentStats(),
  ]);

  const demoData =
    demoResult.status === 'fulfilled' ? demoResult.value : EMPTY_DEMO;
  const apiList = apiListResult.status === 'fulfilled' ? apiListResult.value : [];
  const apiStats = apiStatsResult.status === 'fulfilled' ? apiStatsResult.value : null;
  const apiAvailable = apiListResult.status === 'fulfilled';

  const incidents = mergeIncidentLists(
    demoData.incidents.map(demoIncidentToUnified),
    apiList.map(apiIncidentToUnified),
  );

  return {
    incidents,
    stats: mergeIncidentStats(demoData, apiStats),
    apiAvailable,
    sourceState: apiAvailable ? 'live' : demoData.incidents.length > 0 ? 'demo' : 'unavailable',
  };
}
