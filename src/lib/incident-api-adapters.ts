import type {
  IncidentAsset,
  IncidentDetail,
  IncidentListItem,
  Recommendation,
  TimelineEvent,
} from '../types/incident-service';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

export function normalizeIncidentListItem(raw: IncidentListItem): IncidentListItem {
  return {
    ...raw,
    correlation_key: raw.correlation_key ?? '',
  };
}

export function normalizeIncidentDetail(raw: IncidentDetail): IncidentDetail {
  return {
    ...raw,
    related_alert_ids: raw.related_alert_ids ?? [],
    correlation_key: raw.correlation_key ?? '',
    raw_alerts: raw.raw_alerts ?? [],
  };
}

export function normalizeTimelineEvent(raw: unknown): TimelineEvent {
  const obj = asRecord(raw) ?? {};
  const metadata = asRecord(obj.metadata);
  const detailParts = [pickString(obj, 'message', 'details')];
  if (metadata) {
    const alertId = pickString(metadata, 'alert_id');
    const entity = pickString(metadata, 'entity');
    if (alertId) detailParts.push(`alert ${alertId}`);
    if (entity) detailParts.push(`entity ${entity}`);
  }

  return {
    timestamp: pickString(obj, 'created_at', 'timestamp', 'observed_at'),
    event: pickString(obj, 'event_type', 'event'),
    details: detailParts.filter(Boolean).join(' · '),
  };
}

export function normalizeTimelineEvents(raw: unknown): TimelineEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTimelineEvent).filter((event) => event.timestamp || event.event);
}

export function normalizeIncidentAsset(raw: unknown): IncidentAsset {
  const obj = asRecord(raw) ?? {};
  const entity = pickString(obj, 'entity', 'hostname', 'name');
  return {
    ...obj,
    asset_id: pickString(obj, 'asset_id') || undefined,
    name: entity || pickString(obj, 'asset_id') || undefined,
    type: pickString(obj, 'asset_type', 'type') || undefined,
  };
}

export function normalizeIncidentAssets(raw: unknown): IncidentAsset[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeIncidentAsset);
}

export function normalizeRecommendation(raw: unknown): Recommendation {
  const obj = asRecord(raw) ?? {};
  const confidence = pickNumber(obj, 'confidence');
  return {
    recommendation_id: pickString(obj, 'recommendation_id') || randomId('rec'),
    title: pickString(obj, 'title', 'recommendation') || 'Recommendation',
    confidence: confidence > 1 ? confidence / 100 : confidence,
    risk: pickString(obj, 'risk', 'risk_level') || 'Unknown',
  };
}

export function normalizeRecommendations(raw: unknown): Recommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeRecommendation);
}
