import { incidentGet, incidentPatch, incidentPost } from './client';
import {
  normalizeIncidentAssets,
  normalizeIncidentDetail,
  normalizeIncidentListItem,
  normalizeRecommendations,
  normalizeTimelineEvents,
} from '../../lib/incident-api-adapters';
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

export async function fetchIncidentList(): Promise<IncidentListItem[]> {
  const data = await incidentGet<IncidentListItem[]>('/incidents');
  return data.map(normalizeIncidentListItem);
}

export function fetchIncidentStats(): Promise<IncidentStats> {
  return incidentGet<IncidentStats>('/incidents/stats');
}

export function fetchIncidentSignals(): Promise<IncidentSignal[]> {
  return incidentGet<IncidentSignal[]>('/signals');
}

export async function fetchIncidentById(id: string): Promise<IncidentDetail> {
  const data = await incidentGet<IncidentDetail>(`/incidents/${encodeURIComponent(id)}`);
  return normalizeIncidentDetail(data);
}

export function createIncidentFromAlert(alert: AlertPayload): Promise<IncidentDetail> {
  return incidentPost<IncidentDetail>('/incidents', alert).then(normalizeIncidentDetail);
}

export function patchIncident(id: string, patch: IncidentPatch): Promise<IncidentDetail> {
  return incidentPatch<IncidentDetail>(`/incidents/${encodeURIComponent(id)}`, patch).then(
    normalizeIncidentDetail,
  );
}

export async function fetchIncidentTimeline(id: string): Promise<TimelineEvent[]> {
  const data = await incidentGet<unknown>(`/incidents/${encodeURIComponent(id)}/timeline`);
  return normalizeTimelineEvents(data);
}

export function fetchRelatedIncidents(id: string): Promise<RelatedIncident[]> {
  return incidentGet<RelatedIncident[]>(`/incidents/${encodeURIComponent(id)}/related`);
}

export async function fetchIncidentRecommendations(id: string): Promise<Recommendation[]> {
  const data = await incidentGet<unknown>(`/incidents/${encodeURIComponent(id)}/recommendations`);
  return normalizeRecommendations(data);
}

export async function fetchIncidentAssets(id: string): Promise<IncidentAsset[]> {
  const data = await incidentGet<unknown>(`/incidents/${encodeURIComponent(id)}/assets`);
  return normalizeIncidentAssets(data);
}
