import { incidentGet, incidentPatch, incidentPost } from './client';
import type {
  AlertPayload,
  HealthResponse,
  IncidentDetail,
  IncidentListItem,
  IncidentPatch,
  IncidentAsset,
  IncidentSignal,
  IncidentStats,
  Recommendation,
  RelatedIncident,
  TimelineEvent,
} from '../../types/incident-service';

export function fetchIncidentHealth(): Promise<HealthResponse> {
  return incidentGet<HealthResponse>('/health');
}

export function fetchIncidentList(): Promise<IncidentListItem[]> {
  return incidentGet<IncidentListItem[]>('/incidents');
}

export function fetchIncidentStats(): Promise<IncidentStats> {
  return incidentGet<IncidentStats>('/incidents/stats');
}

export function fetchIncidentSignals(): Promise<IncidentSignal[]> {
  return incidentGet<IncidentSignal[]>('/signals');
}

export function fetchIncidentById(id: string): Promise<IncidentDetail> {
  return incidentGet<IncidentDetail>(`/incidents/${encodeURIComponent(id)}`);
}

export function createIncidentFromAlert(alert: AlertPayload): Promise<IncidentDetail> {
  return incidentPost<IncidentDetail>('/incidents', alert);
}

export function patchIncident(id: string, patch: IncidentPatch): Promise<IncidentDetail> {
  return incidentPatch<IncidentDetail>(`/incidents/${encodeURIComponent(id)}`, patch);
}

export function fetchIncidentTimeline(id: string): Promise<TimelineEvent[]> {
  return incidentGet<TimelineEvent[]>(`/incidents/${encodeURIComponent(id)}/timeline`);
}

export function fetchRelatedIncidents(id: string): Promise<RelatedIncident[]> {
  return incidentGet<RelatedIncident[]>(`/incidents/${encodeURIComponent(id)}/related`);
}

export function fetchIncidentRecommendations(id: string): Promise<Recommendation[]> {
  return incidentGet<Recommendation[]>(`/incidents/${encodeURIComponent(id)}/recommendations`);
}

export function fetchIncidentAssets(id: string): Promise<IncidentAsset[]> {
  return incidentGet<IncidentAsset[]>(`/incidents/${encodeURIComponent(id)}/assets`);
}
