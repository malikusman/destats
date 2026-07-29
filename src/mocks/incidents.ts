import type { Incident, IncidentListResponse } from '../types/scorpius';

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-001',
    title: 'Aggregate aggr1_n2_nvme approaching capacity limit',
    description:
      'Aggregate aggr1_n2_nvme on node uspdc-nac01-02 has reached 91% utilization. ' +
      'At the current write rate it will reach the 96% full threshold within 6 hours, ' +
      'causing volumes to go offline.',
    severity: 'critical',
    priority: 1,
    status: 'investigating',
    source: 'EMS / wafl.aggr.nearlyFull',
    created_at: ago(47),
    updated_at: ago(3),
    assets: [
      { id: 'a1', name: 'aggr1_n2_nvme', type: 'aggregate', details: '91% used, 94.9 TiB / 139.3 TiB' },
      { id: 'a2', name: 'uspdc-nac01-02', type: 'node' },
      { id: 'a3', name: 'uspdc_proj01', type: 'svm', details: '160 volumes on this aggregate' },
    ],
    tags: ['capacity', 'aggregate', 'critical-path'],
    reasoning_id: 'RSN-001',
    timeline: [
      { timestamp: ago(47), event: 'Incident created', actor: 'system', detail: 'EMS event wafl.aggr.nearlyFull received' },
      { timestamp: ago(45), event: 'AI analysis started', actor: 'ai', detail: 'Initiating root cause analysis' },
      { timestamp: ago(42), event: 'Knowledge retrieval complete', actor: 'ai', detail: '4 relevant runbooks found' },
      { timestamp: ago(40), event: 'Root cause identified', actor: 'ai', detail: 'Rapid growth in uspdc_tdk_factory_data volume' },
      { timestamp: ago(38), event: 'Plan generated', actor: 'ai', detail: '3 candidate plans evaluated' },
      { timestamp: ago(35), event: 'Policy check passed', actor: 'policy', detail: 'Volume migration approved' },
      { timestamp: ago(30), event: 'Execution started', actor: 'system', detail: 'Running volume migration to aggr1_n7_ssd' },
      { timestamp: ago(3), event: 'Status update', actor: 'system', detail: 'Migration 68% complete' },
    ],
  },
  {
    id: 'INC-002',
    title: 'SecD authentication failures affecting cluster admin login',
    description:
      'Repeated secd.unexpectedFailure EMS events indicate the cluster admin vserver is failing ' +
      'LDAP/NIS authentication lookups. The current evidence points to cluster login impact and ' +
      'certificate or name-service validation issues, not confirmed NAS client disruption.',
    severity: 'medium',
    priority: 2,
    status: 'active',
    source: 'EMS / secd.unexpectedFailure',
    created_at: ago(22),
    updated_at: ago(8),
    assets: [
      { id: 'b1', name: 'uspdc-admin', type: 'svm', details: 'Admin vserver authentication path' },
      { id: 'b2', name: 'uspdc-nac01-01', type: 'node', details: 'Observed secd.unexpectedFailure entries' },
      { id: 'b3', name: 'uspdc-nac01-02', type: 'node', details: 'Observed secd.unexpectedFailure entries' },
    ],
    tags: ['authentication', 'secd', 'ldap', 'admin-vserver'],
    reasoning_id: 'RSN-002',
    timeline: [
      { timestamp: ago(22), event: 'Incident created', actor: 'system', detail: '2 secd.unexpectedFailure events in 5 minutes' },
      { timestamp: ago(20), event: 'AI analysis started', actor: 'ai' },
      { timestamp: ago(16), event: 'Operator review added', actor: 'user', detail: 'Evidence suggests admin-vserver login scope, not confirmed NAS outage' },
      { timestamp: ago(14), event: 'Plan generated', actor: 'ai', detail: 'Recommended validation of LDAP certificate and name-service path' },
      { timestamp: ago(10), event: 'Policy check pending', actor: 'policy', detail: 'Any service restart requires storage admin confirmation' },
      { timestamp: ago(8), event: 'Issue mitigated manually', actor: 'system', detail: 'Operator notes indicate the login issue was already corrected' },
    ],
  },
  {
    id: 'INC-003',
    title: 'Cluster peer address mismatch warning requires verification',
    description:
      'cpeer.addr.warn.host reports that peer address 10.61.64.28 is not in the current ' +
      'remote intercluster address list. This is a peer-warning condition that merits review, ' +
      'but it does not by itself prove that SnapMirror is fully broken.',
    severity: 'medium',
    priority: 3,
    status: 'investigating',
    source: 'EMS / cpeer.addr.warn.host',
    created_at: ago(67),
    updated_at: ago(20),
    assets: [
      { id: 'c1', name: 'remote-cluster-peer', type: 'cluster', details: 'Peer address record includes 10.61.64.28' },
      { id: 'c2', name: 'intercluster-lif-set', type: 'lif', details: 'Verify at least one valid remote intercluster LIF remains reachable' },
    ],
    tags: ['snapmirror', 'peering', 'network', 'replication'],
    reasoning_id: 'RSN-003',
    timeline: [
      { timestamp: ago(67), event: 'Incident created', actor: 'system' },
      { timestamp: ago(64), event: 'AI analysis started', actor: 'ai' },
      { timestamp: ago(58), event: 'Operator review added', actor: 'user', detail: 'Warning is real, but root cause and impact need softer wording' },
      { timestamp: ago(50), event: 'Plan generated', actor: 'ai', detail: 'Verify active peer addresses before applying any corrective change' },
      { timestamp: ago(45), event: 'Policy check passed', actor: 'policy' },
      { timestamp: ago(40), event: 'Execution started', actor: 'system' },
      { timestamp: ago(20), event: 'Execution completed', actor: 'system', detail: 'Peer address warning cleared after peer record cleanup' },
    ],
  },
  {
    id: 'INC-004',
    title: 'Snapshot policy drift detected across 12 volumes',
    description:
      '12 volumes in SVM uspdc_proj01 have drifted from the standard snapshot policy. ' +
      'Snapshots have not been taken for more than 72 hours, violating RPO requirements.',
    severity: 'medium',
    priority: 4,
    status: 'resolved',
    source: 'Scorpius / policy-compliance-check',
    created_at: ago(180),
    updated_at: ago(90),
    resolved_at: ago(90),
    assets: [
      { id: 'd1', name: 'uspdc_proj01', type: 'svm', details: '12 of 524 volumes affected' },
    ],
    tags: ['snapshot', 'compliance', 'rpo', 'policy'],
    reasoning_id: 'RSN-004',
    timeline: [
      { timestamp: ago(180), event: 'Incident created', actor: 'system', detail: 'Compliance scan detected 12 volumes without recent snapshots' },
      { timestamp: ago(175), event: 'AI analysis started', actor: 'ai' },
      { timestamp: ago(165), event: 'Root cause: policy removed during volume migration', actor: 'ai' },
      { timestamp: ago(155), event: 'Plan generated', actor: 'ai', detail: 'Reapply default snapshot policy' },
      { timestamp: ago(145), event: 'Policy check passed', actor: 'policy' },
      { timestamp: ago(140), event: 'Execution completed', actor: 'system', detail: 'Snapshot policy reapplied to all 12 volumes' },
      { timestamp: ago(90), event: 'Incident resolved', actor: 'system', detail: 'Snapshots confirmed for all affected volumes' },
    ],
  },
  {
    id: 'INC-005',
    title: 'Volume uspdc_wvfltdt03 growth rate exceeds projection',
    description:
      'Predictive capacity model indicates volume uspdc_wvfltdt03 (SVM uspdc_wv01) ' +
      'will exhaust available space in approximately 14 days at the current write rate of 180 GiB/day. ' +
      'Current usage: 13.7 TiB of 17.4 TiB (78.7%).',
    severity: 'medium',
    priority: 5,
    status: 'active',
    source: 'Scorpius / predictive-capacity',
    created_at: ago(30),
    updated_at: ago(5),
    assets: [
      { id: 'e1', name: 'uspdc_wvfltdt03', type: 'volume', details: '78.7% used, 13.7 TiB / 17.4 TiB' },
      { id: 'e2', name: 'uspdc_wv01', type: 'svm' },
      { id: 'e3', name: 'aggr1_n8_ssd', type: 'aggregate', details: '48% used' },
    ],
    tags: ['capacity', 'predictive', 'volume', 'wv01'],
    reasoning_id: 'RSN-005',
    timeline: [
      { timestamp: ago(30), event: 'Incident created', actor: 'system', detail: 'Predictive model triggered at 78% with 14-day horizon' },
      { timestamp: ago(28), event: 'AI analysis started', actor: 'ai' },
      { timestamp: ago(22), event: 'Root cause: workload growth', actor: 'ai', detail: 'WV simulation data volume increasing 15% week-over-week' },
      { timestamp: ago(18), event: 'Plan generated', actor: 'ai', detail: '2 options: volume expansion or tiering to aggr1_n8_ssd' },
      { timestamp: ago(5), event: 'Awaiting approval', actor: 'system' },
    ],
  },
];

export function getMockIncidentListResponse(): IncidentListResponse {
  return {
    incidents: MOCK_INCIDENTS,
    total: MOCK_INCIDENTS.length,
    active_count: MOCK_INCIDENTS.filter((i) => i.status !== 'resolved').length,
    fetched_at: new Date().toISOString(),
  };
}

export function getMockIncidentById(id: string): Incident | undefined {
  return MOCK_INCIDENTS.find((i) => i.id === id);
}
