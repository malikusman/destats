/**
 * Seed fixtures for the Scorpius Incident Service mock API (Epic 2 & 3).
 * Shapes match the manager's REST spec.
 */

export const PRIMARY_INCIDENT_ID = 'e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9';

/** Seed incident detail records. */
export const incidentDetails = [
  {
    incident_id: PRIMARY_INCIDENT_ID,
    title: 'High latency detected',
    description: 'Latency exceeded threshold',
    source: 'RabbitMQ',
    entity: 'node-01',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'Medium',
    status: 'New',
    owner: undefined,
    first_seen: '2026-07-02T00:00:00Z',
    last_seen: '2026-07-02T00:00:00Z',
    alert_count: 1,
    related_alert_ids: ['alert-101'],
    correlation_key: 'node-01:latency.high:storage_filesystem',
    raw_alerts: [],
  },
  {
    incident_id: 'a3f8b201-4d12-4e90-9c11-2b8e4f6a9012',
    title: 'Aggregate aggr1_n2_nvme approaching capacity limit',
    description:
      'Aggregate aggr1_n2_nvme on node uspdc-nac01-02 has reached 91% utilization.',
    source: 'EMS',
    entity: 'aggr1_n2_nvme',
    asset_type: 'NetApp',
    severity: 'CRITICAL',
    priority: 'High',
    status: 'Investigating',
    owner: 'storage-team',
    first_seen: '2026-07-01T14:22:00Z',
    last_seen: '2026-07-02T08:15:00Z',
    alert_count: 3,
    related_alert_ids: ['alert-201', 'alert-202', 'alert-203'],
    correlation_key: 'aggr1_n2_nvme:wafl.aggr.nearlyFull:capacity',
    raw_alerts: [],
  },
  {
    incident_id: 'b7c2d904-8e31-4f5a-a2b6-9d1e3f7c8045',
    title: 'SecD authentication failures on uspdc-nac01-02',
    description:
      'Repeated secd.unexpectedFailure events. NFS/CIFS clients intermittently losing access.',
    source: 'EMS',
    entity: 'uspdc-nac01-02',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'Medium',
    status: 'New',
    owner: undefined,
    first_seen: '2026-07-02T06:01:00Z',
    last_seen: '2026-07-02T06:23:00Z',
    alert_count: 4,
    related_alert_ids: ['alert-301'],
    correlation_key: 'uspdc-nac01-02:secd.unexpectedFailure:authentication',
    raw_alerts: [],
  },
  {
    incident_id: 'c9e4a106-1f42-4b8c-b3d7-5e2a8c9d0156',
    title: 'Cluster peer address mismatch — SnapMirror disrupted',
    description:
      'cpeer.addr.warn.host: peer address 10.61.64.28 not in configured intercluster LIF list.',
    source: 'EMS',
    entity: 'uspdc-nac01-02',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'Medium',
    status: 'Resolved',
    owner: 'Arman',
    first_seen: '2026-06-28T10:00:00Z',
    last_seen: '2026-06-30T16:45:00Z',
    alert_count: 2,
    related_alert_ids: ['alert-401', 'alert-402'],
    correlation_key: 'uspdc-nac01-02:cpeer.addr.warn.host:replication',
    raw_alerts: [],
  },
  {
    incident_id: 'inc-related-001',
    title: 'Storage latency anomaly',
    description: 'Historical latency spike on node-01 storage filesystem path.',
    source: 'EMS',
    entity: 'node-01',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'Medium',
    status: 'Resolved',
    owner: 'storage-team',
    first_seen: '2026-06-15T08:00:00Z',
    last_seen: '2026-06-16T14:30:00Z',
    alert_count: 2,
    related_alert_ids: ['alert-hist-001'],
    correlation_key: 'node-01:latency.high:storage_filesystem',
    raw_alerts: [],
  },
  {
    incident_id: 'inc-related-002',
    title: 'aggr1_n1_nvme near-full (March 2026)',
    description: 'Resolved capacity incident on aggr1_n1_nvme via volume migration.',
    source: 'EMS',
    entity: 'aggr1_n1_nvme',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'High',
    status: 'Resolved',
    owner: 'Arman',
    first_seen: '2026-03-10T10:00:00Z',
    last_seen: '2026-03-11T09:00:00Z',
    alert_count: 5,
    related_alert_ids: ['alert-hist-002'],
    correlation_key: 'aggr1_n1_nvme:wafl.aggr.nearlyFull:capacity',
    raw_alerts: [],
  },
  {
    incident_id: 'inc-related-003',
    title: 'AD DNS resolution intermittent',
    description: 'Intermittent DNS failures affecting SecD authentication on uspdc-nac01-02.',
    source: 'EMS',
    entity: 'uspdc-nac01-02',
    asset_type: 'NetApp',
    severity: 'WARNING',
    priority: 'Medium',
    status: 'Investigating',
    owner: undefined,
    first_seen: '2026-07-01T12:00:00Z',
    last_seen: '2026-07-02T06:00:00Z',
    alert_count: 3,
    related_alert_ids: ['alert-hist-003'],
    correlation_key: 'uspdc-nac01-02:dns.timeout:authentication',
    raw_alerts: [],
  },
];

/** Timeline events keyed by incident_id. */
export const timelines = {
  [PRIMARY_INCIDENT_ID]: [
    {
      timestamp: '2026-07-02T00:00:00Z',
      event: 'Incident created',
      details: 'Initial anomaly converted into incident',
    },
    {
      timestamp: '2026-07-02T00:03:00Z',
      event: 'Alert correlated',
      details: 'Related alert added',
    },
  ],
  'a3f8b201-4d12-4e90-9c11-2b8e4f6a9012': [
    {
      timestamp: '2026-07-01T14:22:00Z',
      event: 'Incident created',
      details: 'EMS event wafl.aggr.nearlyFull received at 85% threshold',
    },
    {
      timestamp: '2026-07-01T18:00:00Z',
      event: 'Severity escalated',
      details: 'Aggregate utilization reached 91%',
    },
    {
      timestamp: '2026-07-02T08:15:00Z',
      event: 'Status changed to Investigating',
      details: 'Volume migration plan approved',
    },
  ],
  'b7c2d904-8e31-4f5a-a2b6-9d1e3f7c8045': [
    {
      timestamp: '2026-07-02T06:01:00Z',
      event: 'Incident created',
      details: 'secd.unexpectedFailure on uspdc-nac01-02',
    },
    {
      timestamp: '2026-07-02T06:15:00Z',
      event: 'Alert correlated',
      details: '4 related SecD failures grouped',
    },
  ],
  'c9e4a106-1f42-4b8c-b3d7-5e2a8c9d0156': [
    {
      timestamp: '2026-06-28T10:00:00Z',
      event: 'Incident created',
      details: 'Cluster peer address warning detected',
    },
    {
      timestamp: '2026-06-30T16:45:00Z',
      event: 'Incident resolved',
      details: 'Peer address updated; SnapMirror relationships healthy',
    },
  ],
  'inc-related-001': [
    {
      timestamp: '2026-06-15T08:00:00Z',
      event: 'Incident created',
      details: 'Latency threshold exceeded on node-01',
    },
    {
      timestamp: '2026-06-16T14:30:00Z',
      event: 'Incident resolved',
      details: 'Workload throttled; latency returned to normal',
    },
  ],
  'inc-related-002': [
    {
      timestamp: '2026-03-10T10:00:00Z',
      event: 'Incident created',
      details: 'Aggregate aggr1_n1_nvme at 89% capacity',
    },
    {
      timestamp: '2026-03-11T09:00:00Z',
      event: 'Incident resolved',
      details: 'Volume migrated to aggr1_n7_ssd',
    },
  ],
  'inc-related-003': [
    {
      timestamp: '2026-07-01T12:00:00Z',
      event: 'Incident created',
      details: 'DNS resolution timeouts detected',
    },
    {
      timestamp: '2026-07-02T06:00:00Z',
      event: 'Status changed to Investigating',
      details: 'Correlated with SecD failures on uspdc-nac01-02',
    },
  ],
};

/** Related incidents keyed by incident_id. */
export const relatedIncidents = {
  [PRIMARY_INCIDENT_ID]: [
    {
      incident_id: 'inc-related-001',
      title: 'Storage latency anomaly',
      severity: 'WARNING',
      status: 'Resolved',
    },
  ],
  'a3f8b201-4d12-4e90-9c11-2b8e4f6a9012': [
    {
      incident_id: 'inc-related-002',
      title: 'aggr1_n1_nvme near-full (March 2026)',
      severity: 'WARNING',
      status: 'Resolved',
    },
  ],
  'b7c2d904-8e31-4f5a-a2b6-9d1e3f7c8045': [
    {
      incident_id: 'inc-related-003',
      title: 'AD DNS resolution intermittent',
      severity: 'WARNING',
      status: 'Investigating',
    },
  ],
  'c9e4a106-1f42-4b8c-b3d7-5e2a8c9d0156': [],
};

/** Recommendations keyed by incident_id. */
export const recommendations = {
  [PRIMARY_INCIDENT_ID]: [
    {
      recommendation_id: 'rec-001',
      title: 'Check storage latency',
      confidence: 0.86,
      risk: 'Low',
    },
  ],
  'a3f8b201-4d12-4e90-9c11-2b8e4f6a9012': [
    {
      recommendation_id: 'rec-101',
      title: 'Migrate uspdc_tdk_factory_data to aggr1_n7_ssd',
      confidence: 0.94,
      risk: 'Low',
    },
    {
      recommendation_id: 'rec-102',
      title: 'Suspend snapshot schedules on aggr1_n2_nvme',
      confidence: 0.78,
      risk: 'Low',
    },
  ],
  'b7c2d904-8e31-4f5a-a2b6-9d1e3f7c8045': [
    {
      recommendation_id: 'rec-201',
      title: 'Update DNS configuration on uspdc-nac01-02',
      confidence: 0.81,
      risk: 'Low',
    },
  ],
  'c9e4a106-1f42-4b8c-b3d7-5e2a8c9d0156': [
    {
      recommendation_id: 'rec-301',
      title: 'Update cluster peer address record',
      confidence: 0.88,
      risk: 'Low',
    },
  ],
  'inc-related-001': [
    {
      recommendation_id: 'rec-hist-001',
      title: 'Review I/O workload on node-01',
      confidence: 0.82,
      risk: 'Low',
    },
  ],
  'inc-related-002': [
    {
      recommendation_id: 'rec-hist-002',
      title: 'Migrate large volumes before 90% threshold',
      confidence: 0.91,
      risk: 'Low',
    },
  ],
  'inc-related-003': [
    {
      recommendation_id: 'rec-hist-003',
      title: 'Update DNS server order on uspdc-nac01-02',
      confidence: 0.85,
      risk: 'Low',
    },
  ],
};

/** Active statuses for list endpoint (excludes Resolved/Closed). */
const ACTIVE_STATUSES = new Set(['New', 'Investigating']);

export function toListItem(detail) {
  return {
    incident_id: detail.incident_id,
    title: detail.title,
    description: detail.description,
    entity: detail.entity,
    severity: detail.severity,
    priority: detail.priority,
    status: detail.status,
    first_seen: detail.first_seen,
    last_seen: detail.last_seen,
    alert_count: detail.alert_count,
    correlation_key: detail.correlation_key,
  };
}

export function computeStats(details) {
  const stats = {
    total: details.length,
    new: 0,
    investigating: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const d of details) {
    const statusKey = d.status.toLowerCase();
    if (statusKey === 'new') stats.new++;
    else if (statusKey === 'investigating') stats.investigating++;
    else if (statusKey === 'resolved') stats.resolved++;
    else if (statusKey === 'closed') stats.closed++;

    const sev = d.severity.toUpperCase();
    if (sev === 'CRITICAL') stats.critical++;
    else if (sev === 'HIGH' || sev === 'WARNING') stats.high++;
    else if (sev === 'MEDIUM') stats.medium++;
    else stats.low++;
  }

  return stats;
}

export function isActive(detail) {
  return ACTIVE_STATUSES.has(detail.status);
}
