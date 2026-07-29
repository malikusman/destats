import type { AiReasoning } from '../types/scorpius';

export const MOCK_REASONING: Record<string, AiReasoning> = {
  'RSN-001': {
    id: 'RSN-001',
    incident_id: 'INC-001',
    model_version: 'scorpius-ai-v2.1.4',
    generated_at: new Date(Date.now() - 42 * 60_000).toISOString(),
    incident_summary:
      'Aggregate aggr1_n2_nvme on node uspdc-nac01-02 is at 91% capacity and rising. ' +
      'The primary driver is the volume uspdc_tdk_factory_data which has grown 340 GiB in ' +
      'the past 48 hours due to an active simulation workload. At current growth rate (170 GiB/day), ' +
      'the aggregate will reach the 96% full threshold in approximately 6 hours, after which ' +
      'all 160 volumes on this aggregate will be taken offline by ONTAP.',
    root_cause_hypothesis:
      'A long-running TDK factory simulation job began 48 hours ago and is writing data at ' +
      'an unusually high rate to uspdc_tdk_factory_data. This volume has no auto-grow policy ' +
      'and the aggregate has insufficient free space to absorb the growth. Contributing factor: ' +
      'two scheduled snapshot policies ran overnight, consuming an additional 28 GiB of space.',
    confidence_score: 94,
    risk_level: 'high',
    evidence: [
      {
        id: 'E1',
        type: 'metric',
        source: 'ONTAP aggregate metrics',
        summary: 'Aggregate utilization: 91% (127.1 TiB / 139.3 TiB)',
        value: '91%',
        relevance_score: 1.0,
      },
      {
        id: 'E2',
        type: 'metric',
        source: 'Volume growth analysis',
        summary: 'uspdc_tdk_factory_data: +340 GiB in 48h (+170 GiB/day avg)',
        value: '340 GiB growth',
        relevance_score: 0.97,
      },
      {
        id: 'E3',
        type: 'event',
        source: 'ONTAP EMS',
        summary: 'wafl.aggr.nearlyFull event at 85%, 88%, and 91% thresholds in last 18h',
        relevance_score: 0.92,
      },
      {
        id: 'E4',
        type: 'historical',
        source: 'Incident history',
        summary: 'Similar event on aggr1_n1_nvme 4 months ago — resolved via volume migration',
        relevance_score: 0.81,
      },
      {
        id: 'E5',
        type: 'metric',
        source: 'Snapshot inventory',
        summary: 'Snapshots consumed 28 GiB on this aggregate in last 24h',
        value: '28 GiB',
        relevance_score: 0.74,
      },
    ],
    knowledge_references: [
      {
        id: 'KB-001',
        title: 'NetApp Aggregate Capacity Management Runbook',
        type: 'runbook',
        excerpt:
          'When aggregate utilization exceeds 90%, immediate action is required. ' +
          'Recommended: move one or more large volumes to an aggregate with >40% free space. ' +
          'Prefer volumes with low IOPS to minimize disruption during migration.',
        similarity_score: 0.95,
        source_url: '/knowledge/KB-001',
      },
      {
        id: 'KB-015',
        title: 'Volume Migration Procedure — NVMe to SSD Aggregates',
        type: 'runbook',
        excerpt:
          'Volume migrations from NVMe to SSD aggregates are non-disruptive for NFS/CIFS clients. ' +
          'Expected throughput: 500 MiB/s. Estimated time for 100 GiB volume: ~3.5 minutes.',
        similarity_score: 0.88,
        source_url: '/knowledge/KB-015',
      },
      {
        id: 'IH-042',
        title: 'INC-2026-0042: aggr1_n1_nvme near-full — resolved',
        type: 'incident_history',
        excerpt:
          'Similar situation on aggr1_n1_nvme (March 2026). Resolved by migrating ' +
          'uspdc_chirpsim01 (11.1 TiB) to aggr1_n7_ssd. Migration completed in 22 minutes ' +
          'with zero client disruption.',
        similarity_score: 0.82,
        source_url: '/knowledge/IH-042',
      },
      {
        id: 'UC-007',
        title: 'Use Case: Predictive Capacity Management',
        type: 'use_case',
        excerpt:
          'Scorpius predictive capacity engine monitors aggregate fill rates and triggers ' +
          'proactive migration before thresholds are breached. This use case demonstrates ' +
          'Scorpius preventing unplanned volume offline events.',
        similarity_score: 0.76,
        source_url: '/knowledge/UC-007',
      },
    ],
    recommended_actions: [
      {
        id: 'ACT-001',
        rank: 1,
        action: 'Migrate uspdc_tdk_factory_data to aggr1_n7_ssd',
        rationale:
          'This is the largest and fastest-growing volume on the affected aggregate. ' +
          'aggr1_n7_ssd currently has 52% free space (72 GiB available). ' +
          'Migration is non-disruptive and estimated to take 18–22 minutes.',
        estimated_risk: 'low',
        estimated_duration_minutes: 22,
        reversible: true,
        requires_approval: false,
      },
      {
        id: 'ACT-002',
        rank: 2,
        action: 'Temporarily suspend snapshot schedules on aggr1_n2_nvme',
        rationale:
          'Suspending snapshots will free 28 GiB and slow the fill rate by ~15%, ' +
          'buying additional time. This is a temporary measure only.',
        estimated_risk: 'low',
        estimated_duration_minutes: 1,
        reversible: true,
        requires_approval: false,
      },
      {
        id: 'ACT-003',
        rank: 3,
        action: 'Alert storage admin and request simulation job throttle',
        rationale:
          'Contact the job owner to reduce I/O rate or pause the job until migration completes.',
        estimated_risk: 'low',
        estimated_duration_minutes: 5,
        reversible: false,
        requires_approval: false,
      },
    ],
    reasoning_trace:
      'Step 1: Retrieved aggregate metrics. Utilization at 91%, rising 3.2% per 24h.\n' +
      'Step 2: Identified top consumers. uspdc_tdk_factory_data: 2.2 TiB total, ' +
      '340 GiB growth in 48h (rank #1 by growth rate).\n' +
      'Step 3: Searched knowledge base for "aggregate near full" + "nvme aggregate". ' +
      'Found 4 relevant documents (KB-001, KB-015, IH-042, UC-007).\n' +
      'Step 4: Historical precedent (IH-042) confirms volume migration is the correct resolution.\n' +
      'Step 5: Evaluated target aggregates. aggr1_n7_ssd: 52% free, compatible storage type, ' +
      'sufficient capacity for migration target.\n' +
      'Step 6: Generated action plan. Primary: migrate volume. Secondary: suspend snapshots. ' +
      'Tertiary: alert owner.\n' +
      'Step 7: Confidence 94% — high historical similarity, clear root cause, proven resolution path.',
  },

  'RSN-002': {
    id: 'RSN-002',
    incident_id: 'INC-002',
    model_version: 'scorpius-ai-v2.1.4',
    generated_at: new Date(Date.now() - 20 * 60_000).toISOString(),
    incident_summary:
      'Observed secd.unexpectedFailure EMS events indicate the cluster admin vserver is failing ' +
      'LDAP/NIS authentication lookups. The signal supports a cluster-login problem, but it does ' +
      'not establish broad NAS client impact on its own.',
    root_cause_hypothesis:
      'Most likely the SecD path is failing during LDAP certificate or external name-service ' +
      'validation. The repeated TLS hostname mismatch and no-server-available entries make the ' +
      'authentication stack suspicious, but the evidence does not prove a DNS-only root cause or ' +
      'single-node scope.',
    confidence_score: 46,
    risk_level: 'medium',
    confidence_note:
      'Confidence is intentionally reduced because the observed EMS/log evidence is real, but the ' +
      'cause and blast radius are still partly inferred from operator notes rather than proven by a ' +
      'single authoritative source.',
    evidence: [
      {
        id: 'E6',
        type: 'event',
        source: 'ONTAP EMS event log',
        summary: 'Multiple secd.unexpectedFailure events observed for Vserver "admin"',
        relevance_score: 1.0,
        provenance_note: 'Directly observed EMS event stream from the cluster.',
        confidence_impact: 'high',
      },
      {
        id: 'E7',
        type: 'log',
        source: 'secd.log diagnostic output',
        summary: 'TLS hostname mismatch and LDAP/NIS connection failures precede RESULT_ERROR_SECD_NO_SERVER_AVAILABLE',
        relevance_score: 0.95,
        provenance_note: 'Observed diagnostic log excerpt supplied by the operator.',
        confidence_impact: 'high',
      },
      {
        id: 'E8',
        type: 'historical',
        source: 'Operator note',
        summary: 'Operator reports the issue was fixed already and only affected cluster login',
        relevance_score: 0.62,
        provenance_note: 'Human annotation; useful context, but not an authoritative telemetry feed.',
        confidence_impact: 'medium',
      },
    ],
    knowledge_references: [
      {
        id: 'KB-022',
        title: 'ONTAP SecD authentication troubleshooting guide',
        type: 'runbook',
        excerpt:
          'For secd.unexpectedFailure on the admin vserver, verify secd.log, LDAP server reachability, ' +
          'certificate CN/SAN matching, and name-service configuration before restarting services.',
        similarity_score: 0.91,
        source_label: 'ONTAP runbook',
        caveat: 'Reference material only; not proof that DNS was the root cause in this incident.',
      },
    ],
    recommended_actions: [
      {
        id: 'ACT-010',
        rank: 1,
        action: 'Validate LDAP certificate identity and name-service reachability for the admin vserver',
        rationale: 'The supplied secd.log points more directly to TLS/CN validation and external service reachability than to a proven DNS-only issue.',
        estimated_risk: 'low',
        estimated_duration_minutes: 10,
        reversible: true,
        requires_approval: false,
      },
      {
        id: 'ACT-011',
        rank: 2,
        action: 'Only restart SecD after evidence collection if the authentication path is still failing',
        rationale: 'Restart may clear symptoms temporarily, but it should follow validation so the operator does not lose the root-cause trail.',
        estimated_risk: 'medium',
        estimated_duration_minutes: 5,
        reversible: false,
        requires_approval: true,
      },
    ],
    reasoning_trace:
      'Step 1: Parsed EMS events and confirmed secd.unexpectedFailure against the admin vserver.\n' +
      'Step 2: Reviewed supplied secd.log evidence. TLS hostname mismatch and LDAP/NIS connection failures are directly observed.\n' +
      'Step 3: Compared operator notes with the telemetry. Current evidence supports cluster-login impact, not confirmed NAS disruption.\n' +
      'Step 4: Retrieved ONTAP troubleshooting guidance. Candidate causes include certificate identity, LDAP reachability, or broader name-service validation.\n' +
      'Confidence 46% — strong evidence of authentication failure, weak evidence for a single precise root cause.',
  },

  'RSN-003': {
    id: 'RSN-003',
    incident_id: 'INC-003',
    model_version: 'scorpius-ai-v2.1.4',
    generated_at: new Date(Date.now() - 64 * 60_000).toISOString(),
    incident_summary:
      'A cluster peer warning indicates address 10.61.64.28 no longer appears in the remote ' +
      'intercluster address list. The warning is actionable, but by itself it does not prove total ' +
      'SnapMirror outage.',
    root_cause_hypothesis:
      'The local peer definition likely still references an obsolete intercluster address. ' +
      'However, the event alone cannot confirm that all replication paths are broken because ' +
      'SnapMirror can continue operating when at least one valid intercluster LIF remains.',
    confidence_score: 58,
    risk_level: 'medium',
    confidence_note:
      'Confidence is moderate because the warning clearly points to stale peer metadata, but the ' +
      'reviewer notes show the prior analysis overstated impact and certainty.',
    evidence: [
      {
        id: 'E9',
        type: 'event',
        source: 'ONTAP EMS event log',
        summary: 'cpeer.addr.warn.host: 10.61.64.28 not in peer cluster address list',
        relevance_score: 1.0,
        provenance_note: 'Direct EMS warning from the cluster.',
        confidence_impact: 'high',
      },
      {
        id: 'E10',
        type: 'historical',
        source: 'Operator note',
        summary: 'Reviewer notes SnapMirror would still work, although more slowly, as long as one good intercluster LIF remains',
        relevance_score: 0.76,
        provenance_note: 'Operator domain guidance used to calibrate impact and wording.',
        confidence_impact: 'medium',
      },
    ],
    knowledge_references: [
      {
        id: 'KB-031',
        title: 'SnapMirror Peer Reconfiguration Runbook',
        type: 'runbook',
        excerpt:
          'To update a cluster peer address: cluster peer modify -peer-cluster <name> ' +
          '-peer-addrs <new-ip>. First verify whether replication still has a healthy intercluster path.',
        similarity_score: 0.93,
        source_label: 'ONTAP runbook',
        caveat: 'This runbook describes a valid corrective action, but not every peer-address warning means replication is fully down.',
      },
    ],
    recommended_actions: [
      {
        id: 'ACT-020',
        rank: 1,
        action: 'Verify active intercluster LIFs, then clean up the stale cluster peer address record if still present',
        rationale: 'The warning should be corrected, but the operator should confirm whether replication still has a healthy path before assuming service outage.',
        estimated_risk: 'low',
        estimated_duration_minutes: 8,
        reversible: true,
        requires_approval: false,
      },
    ],
    reasoning_trace:
      'Step 1: Parsed cpeer.addr.warn.host and confirmed the peer address mismatch warning.\n' +
      'Step 2: Compared the warning semantics against operator notes: stale peer metadata is likely, but replication impact may be partial.\n' +
      'Step 3: Retrieved the peer reconfiguration runbook and downgraded certainty until path health is verified.\n' +
      'Confidence 58% — actionable warning, but the prior analysis overstated blast radius.',
  },

  'RSN-004': {
    id: 'RSN-004',
    incident_id: 'INC-004',
    model_version: 'scorpius-ai-v2.1.4',
    generated_at: new Date(Date.now() - 175 * 60_000).toISOString(),
    incident_summary:
      '12 volumes in uspdc_proj01 have no snapshots in the last 72 hours. ' +
      'These volumes were recently migrated and their snapshot policies were not reattached.',
    root_cause_hypothesis:
      'A volume migration script performed 12 volume moves 4 days ago. ' +
      'The script correctly moved data but did not preserve the snapshot policy assignments. ' +
      'The default snapshot policy was not applied to the destination volumes.',
    confidence_score: 96,
    risk_level: 'medium',
    evidence: [
      {
        id: 'E12',
        type: 'log',
        source: 'Compliance scanner',
        summary: '12 volumes: snapshot_policy = "none", last_snapshot_time > 72h',
        relevance_score: 1.0,
      },
    ],
    knowledge_references: [
      {
        id: 'KB-008',
        title: 'Volume Migration Checklist',
        type: 'runbook',
        excerpt: 'After volume move: verify snapshot policy, export policy, and QoS policy are preserved.',
        similarity_score: 0.94,
      },
    ],
    recommended_actions: [
      {
        id: 'ACT-030',
        rank: 1,
        action: 'Apply default snapshot policy to 12 affected volumes',
        rationale: 'Restores compliance and ensures data protection going forward.',
        estimated_risk: 'low',
        estimated_duration_minutes: 2,
        reversible: true,
        requires_approval: false,
      },
    ],
    reasoning_trace:
      'Step 1: Compliance scan identified 12 volumes with no snapshot in 72h.\n' +
      'Step 2: All 12 were migrated by the same script 4 days ago — strong correlation.\n' +
      'Step 3: Confirmed snapshot_policy = "none" on all affected volumes.\n' +
      'Step 4: Standard fix: apply default policy. Confidence 96%.',
  },

  'RSN-005': {
    id: 'RSN-005',
    incident_id: 'INC-005',
    model_version: 'scorpius-ai-v2.1.4',
    generated_at: new Date(Date.now() - 28 * 60_000).toISOString(),
    incident_summary:
      'Volume uspdc_wvfltdt03 is at 78.7% capacity and growing at 180 GiB/day. ' +
      'Predictive model forecasts exhaustion in 14 days. Early intervention recommended.',
    root_cause_hypothesis:
      'WV (Waveform) simulation workload growth is accelerating. ' +
      'Week-over-week data growth is up 15% compared to the 30-day baseline.',
    confidence_score: 78,
    risk_level: 'low',
    evidence: [
      {
        id: 'E15',
        type: 'metric',
        source: 'Predictive capacity model',
        summary: 'Linear regression on 30-day growth: exhaustion in 14 days (±3 days)',
        relevance_score: 0.95,
      },
    ],
    knowledge_references: [
      {
        id: 'UC-003',
        title: 'Use Case: Predictive Capacity Planning',
        type: 'use_case',
        excerpt:
          'Scorpius automatically detects volumes on a trajectory to fill within 30 days ' +
          'and triggers proactive capacity actions before service disruption occurs.',
        similarity_score: 0.90,
      },
    ],
    recommended_actions: [
      {
        id: 'ACT-040',
        rank: 1,
        action: 'Expand volume uspdc_wvfltdt03 by 4 TiB on aggr1_n8_ssd',
        rationale: 'aggr1_n8_ssd has 72 TiB available. Expansion is non-disruptive.',
        estimated_risk: 'low',
        estimated_duration_minutes: 1,
        reversible: false,
        requires_approval: true,
      },
      {
        id: 'ACT-041',
        rank: 2,
        action: 'Enable auto-grow policy on volume (max 20 TiB)',
        rationale: 'Prevents future incidents from similar growth patterns.',
        estimated_risk: 'low',
        estimated_duration_minutes: 1,
        reversible: true,
        requires_approval: false,
      },
    ],
    reasoning_trace:
      'Step 1: Retrieved 30-day write rate history for uspdc_wvfltdt03.\n' +
      'Step 2: Applied linear regression. R² = 0.94 — strong upward trend.\n' +
      'Step 3: Calculated time-to-full at current rate: 14 days.\n' +
      'Step 4: Checked aggr1_n8_ssd capacity: 72 TiB free — sufficient for expansion.\n' +
      'Confidence 78% — trend extrapolation inherently uncertain.',
  },
};

export function getMockReasoning(id: string): AiReasoning | undefined {
  return Object.values(MOCK_REASONING).find((r) => r.id === id || r.incident_id === id);
}
