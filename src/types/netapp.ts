/**
 * TypeScript contracts for the scorpius-netapp-ingestion-api.
 *
 * Dynamic maps (state_counts, svm_counts, severity_counts, enabled_counts)
 * are intentionally typed as Record<string, number> — never assume keys.
 */

/** Every API payload is wrapped with at least `ok` (and usually `status_code`). */
export interface ApiEnvelope {
  ok: boolean;
  status_code?: number;
  fetched_at?: string;
  source?: string;
  observer?: string;
  source_type?: string;
}

export interface HalLink {
  href: string;
}

export interface HalLinks {
  self?: HalLink;
  next?: HalLink;
}

// ---------------------------------------------------------------------------
// /health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  ok: boolean;
  service: string;
  time: string;
}

// ---------------------------------------------------------------------------
// /api/netapp/summary
// ---------------------------------------------------------------------------

export interface SourceStatus {
  ok: boolean;
  status_code: number;
  count: number;
  source: string;
}

export interface MetaSummaryResponse extends ApiEnvelope {
  fetched_at: string;
  sources: Record<string, SourceStatus>;
}

// ---------------------------------------------------------------------------
// /api/netapp/ems/summary
// ---------------------------------------------------------------------------

export interface EmsSummaryResponse extends ApiEnvelope {
  fetched_at: string;
  events_examined: number;
  severity_counts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// /api/netapp/volumes/summary
// ---------------------------------------------------------------------------

export interface ClusterCapacity {
  total_size_bytes: number;
  total_used_bytes: number;
  total_available_bytes: number;
  total_size_tib: number;
  total_used_tib: number;
  total_available_tib: number;
  used_percent: number;
}

export interface VolumesSummaryResponse extends ApiEnvelope {
  fetched_at: string;
  volumes_examined: number;
  volumes_with_space_data: number;
  state_counts: Record<string, number>;
  svm_counts: Record<string, number>;
  capacity: ClusterCapacity;
}

// ---------------------------------------------------------------------------
// /api/netapp/aggregates/summary
// ---------------------------------------------------------------------------

export interface AggregateSummaryEntry {
  name: string;
  state: string;
  node: string;
  volume_count: number;
  size_tib: number;
  used_tib: number;
  available_tib: number;
  used_percent: number;
  full_threshold_percent: number;
}

export interface AggregatesSummaryResponse extends ApiEnvelope {
  fetched_at: string;
  aggregates_examined: number;
  state_counts: Record<string, number>;
  capacity: ClusterCapacity;
  aggregates: AggregateSummaryEntry[];
}

// ---------------------------------------------------------------------------
// /api/netapp/nodes/summary, /api/netapp/interfaces/summary
// ---------------------------------------------------------------------------

export interface NodesSummaryResponse extends ApiEnvelope {
  nodes_examined: number;
  state_counts: Record<string, number>;
}

/** Note: `enabled_counts` keys are the strings "True"/"False" (Python-style). */
export interface InterfacesSummaryResponse extends ApiEnvelope {
  interfaces_examined: number;
  state_counts: Record<string, number>;
  enabled_counts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// EMS events — /api/netapp/ems and /api/netapp/ems/errors
// ---------------------------------------------------------------------------

export type EmsSeverity =
  | 'emergency'
  | 'alert'
  | 'error'
  | 'warning'
  | 'notice'
  | 'informational'
  | 'debug';

export interface EmsParameter {
  name: string;
  value: string;
}

export interface EmsEvent {
  node?: { name?: string; uuid?: string; _links?: HalLinks };
  index: number;
  time: string;
  message?: { severity?: string; name?: string };
  source?: string;
  parameters?: EmsParameter[];
  log_message?: string;
  _links?: HalLinks;
}

/** /api/netapp/ems — records nested under `data.records`, cursor in `data._links.next`. */
export interface EmsEventsResponse extends ApiEnvelope {
  data: {
    records: EmsEvent[];
    num_records?: number;
    returned_records?: number;
    _links?: HalLinks;
  };
}

/** /api/netapp/ems/errors — records at the top level (different envelope!). */
export interface EmsErrorsResponse extends ApiEnvelope {
  requested_limit?: number;
  returned_records?: number;
  records: EmsEvent[];
}

/** Normalized form both EMS endpoints map to. */
export interface EmsPage {
  events: EmsEvent[];
  nextCursor: string | null;
  fetchedAt?: string;
}

// ---------------------------------------------------------------------------
// /api/netapp/volumes
// ---------------------------------------------------------------------------

export interface VolumeRecord {
  uuid: string;
  name: string;
  state?: string;
  style?: string;
  /** "rw" = read/write, "dp" = data-protection (mirror destination) */
  type?: string;
  create_time?: string;
  svm?: { name?: string; uuid?: string };
  aggregates?: { name?: string; uuid?: string }[];
  space?: { size?: number; used?: number; available?: number };
  snapshot_count?: number;
  snapshot_policy?: { name?: string };
  nas?: { export_policy?: { name?: string } };
  snapmirror?: {
    is_protected?: boolean;
    destinations?: { is_ontap?: boolean; is_cloud?: boolean };
  };
  analytics?: { state?: string };
}

export interface VolumesResponse extends ApiEnvelope {
  data: {
    records: VolumeRecord[];
    num_records?: number;
    returned_records?: number;
    _links?: HalLinks;
  };
}

export interface VolumesPage {
  volumes: VolumeRecord[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// /api/netapp/aggregates
// ---------------------------------------------------------------------------

export interface AggregateRecord {
  uuid: string;
  name: string;
  state?: string;
  node?: { name?: string; uuid?: string };
  volume_count?: number;
  create_time?: string;
  block_storage?: {
    storage_type?: string;
    primary?: { disk_count?: number; raid_type?: string; disk_type?: string };
  };
  space?: {
    block_storage?: {
      size?: number;
      available?: number;
      used?: number;
      used_percent?: number;
      full_threshold_percent?: number;
      physical_used_percent?: number;
    };
    efficiency?: { ratio?: number; logical_used?: number; savings?: number };
    efficiency_without_snapshots?: { ratio?: number; savings?: number };
  };
}

export interface AggregatesResponse extends ApiEnvelope {
  data: {
    records: AggregateRecord[];
    num_records?: number;
  };
}

// ---------------------------------------------------------------------------
// /api/netapp/nodes
// ---------------------------------------------------------------------------

export interface NodeRecord {
  uuid: string;
  name: string;
  model?: string;
  serial_number?: string;
  system_id?: string;
  location?: string;
  version?: { full?: string; generation?: number; major?: number; minor?: number };
  /** seconds */
  uptime?: number;
  state?: string;
  membership?: string;
  controller?: {
    memory_size?: number;
    over_temperature?: string;
    failed_fan?: { count?: number; message?: { message?: string } };
    failed_power_supply?: { count?: number; message?: { message?: string } };
    cpu?: { processor?: string; count?: number };
  };
  ha?: {
    enabled?: boolean;
    auto_giveback?: boolean;
    partners?: { name?: string; uuid?: string }[];
    takeover?: { state?: string };
    interconnect?: { state?: string };
  };
  service_processor?: {
    state?: string;
    firmware_version?: string;
    link_status?: string;
  };
  nvram?: { battery_state?: string };
}

export interface NodesResponse extends ApiEnvelope {
  data: {
    records: NodeRecord[];
    num_records?: number;
  };
}

// ---------------------------------------------------------------------------
// /api/netapp/interfaces
// ---------------------------------------------------------------------------

export interface InterfaceRecord {
  uuid: string;
  name: string;
  ip?: { address?: string; netmask?: string; family?: string };
  enabled?: boolean;
  state?: string;
  /** "svm" | "cluster" */
  scope?: string;
  /** Absent on cluster-scoped LIFs. */
  svm?: { name?: string; uuid?: string };
  services?: string[];
  location?: {
    node?: { name?: string };
    port?: { name?: string };
    is_home?: boolean;
  };
}

export interface InterfacesResponse extends ApiEnvelope {
  data: {
    records: InterfaceRecord[];
    num_records?: number;
  };
}

// ---------------------------------------------------------------------------
// /api/netapp/cluster-metrics
// ---------------------------------------------------------------------------

/**
 * Currently each record only carries `timestamp`; the numeric series may be
 * populated by the backend later. Everything past `timestamp` is optional.
 */
export interface ClusterMetricRecord {
  timestamp: string;
  duration?: string;
  status?: string;
  throughput?: { read?: number; write?: number; other?: number; total?: number };
  iops?: { read?: number; write?: number; other?: number; total?: number };
  latency?: { read?: number; write?: number; other?: number; total?: number };
  _links?: HalLinks;
}

export interface ClusterMetricsResponse extends ApiEnvelope {
  data: {
    records: ClusterMetricRecord[];
    num_records?: number;
  };
}
