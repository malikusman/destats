import type { IncidentListItem, IncidentStats } from '../types/incident-service';
import type { Incident, IncidentListResponse } from '../types/scorpius';
import type {
  UnifiedIncidentListItem,
  UnifiedIncidentStats,
} from '../types/unified-incident';

export function isDemoIncidentId(id: string | undefined): boolean {
  return !!id && id.startsWith('INC-');
}

export function demoIncidentToUnified(incident: Incident): UnifiedIncidentListItem {
  return {
    id: incident.id,
    source: 'demo',
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    sortTime: incident.created_at,
    contextLabel: incident.source,
    countLabel: `${incident.assets.length} asset${incident.assets.length !== 1 ? 's' : ''}`,
    tags: incident.tags,
  };
}

export function apiIncidentToUnified(item: IncidentListItem): UnifiedIncidentListItem {
  return {
    id: item.incident_id,
    source: 'api',
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    sortTime: item.first_seen,
    contextLabel: item.entity,
    countLabel: `${item.alert_count} alert${item.alert_count !== 1 ? 's' : ''}`,
  };
}

export function mergeIncidentLists(
  demo: UnifiedIncidentListItem[],
  api: UnifiedIncidentListItem[],
): UnifiedIncidentListItem[] {
  return [...demo, ...api].sort(
    (a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime(),
  );
}

export function mergeIncidentStats(
  demo: IncidentListResponse,
  apiStats: IncidentStats | null,
): UnifiedIncidentStats {
  const demoCritical = demo.incidents.filter((i) => i.severity === 'critical').length;
  const demoHigh = demo.incidents.filter((i) => i.severity === 'high').length;
  const demoResolved = demo.incidents.filter((i) => i.status === 'resolved').length;

  return {
    active: demo.active_count + (apiStats ? apiStats.new + apiStats.investigating : 0),
    critical: demoCritical + (apiStats?.critical ?? 0),
    high: demoHigh + (apiStats?.high ?? 0),
    resolved: demoResolved + (apiStats?.resolved ?? 0),
    total: demo.total + (apiStats?.total ?? 0),
  };
}
