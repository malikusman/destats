/** Epic 2/3 Scorpius Incident Service API contracts. */

export interface IncidentListItem {
  incident_id: string;
  title: string;
  description: string;
  entity: string;
  severity: string;
  priority: string;
  status: string;
  first_seen: string;
  last_seen: string;
  alert_count: number;
  correlation_key?: string;
}

export interface IncidentDetail {
  incident_id: string;
  title: string;
  description: string;
  source: string;
  entity: string;
  asset_type: string;
  severity: string;
  priority: string;
  status: string;
  owner?: string;
  first_seen: string;
  last_seen: string;
  alert_count: number;
  related_alert_ids: string[];
  correlation_key: string;
  raw_alerts: unknown[];
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  details: string;
}

export interface RelatedIncident {
  incident_id: string;
  title: string;
  severity: string;
  status: string;
}

export interface Recommendation {
  recommendation_id: string;
  title: string;
  confidence: number;
  risk: string;
}

export interface IncidentSignal {
  signal_id?: string;
  incident_id?: string;
  type?: string;
  severity?: string;
  status?: string;
  confidence?: number;
  title?: string;
  description?: string;
  event_code?: string;
  observed_at?: string;
  created_at?: string;
  raw_data?: {
    metric_name?: string;
    metric_value?: number;
    metric_unit?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface IncidentAsset {
  asset_id?: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface IncidentStats {
  total: number;
  new: number;
  open?: number;
  investigating: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface HealthResponse {
  status: string;
}

export interface AlertPayload {
  alert_id?: string;
  entity?: string;
  host?: string;
  severity?: string;
  title?: string;
  description?: string;
  event_code?: string;
  intent?: string;
  timestamp?: string;
}

export interface IncidentPatch {
  status?: string;
  owner?: string;
  priority?: string;
}
