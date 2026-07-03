import type { PlanResult } from '../types/scorpius';

export const MOCK_PLANS: Record<string, PlanResult> = {
  'INC-001': {
    id: 'PLN-001',
    incident_id: 'INC-001',
    generated_at: new Date(Date.now() - 38 * 60_000).toISOString(),
    selected_plan_id: 'CPLAN-001-A',
    candidate_plans: [
      {
        id: 'CPLAN-001-A',
        name: 'Volume Migration (Recommended)',
        description:
          'Migrate uspdc_tdk_factory_data from aggr1_n2_nvme to aggr1_n7_ssd. ' +
          'Non-disruptive, highest risk reduction.',
        steps: [
          'Verify target aggregate aggr1_n7_ssd has ≥ 4 TiB free space',
          'Initiate volume move: vol move start -vserver uspdc_proj01 -volume uspdc_tdk_factory_data -destination-aggregate aggr1_n7_ssd',
          'Monitor move progress until cutover',
          'Verify source aggregate utilization drops below 85%',
          'Re-enable snapshot schedules',
        ],
        estimated_duration_minutes: 25,
        risk_score: 12,
        success_probability: 97,
        is_selected: true,
      },
      {
        id: 'CPLAN-001-B',
        name: 'Expand Aggregate Storage',
        description:
          'Add spare disk shelves to aggr1_n2_nvme to increase capacity. ' +
          'Requires hardware intervention and longer execution time.',
        steps: [
          'Identify available spare NVMe disks in shelf',
          'Add disks to aggregate: storage aggregate add-disks -aggregate aggr1_n2_nvme',
          'Verify new capacity and utilization',
        ],
        estimated_duration_minutes: 45,
        risk_score: 28,
        success_probability: 91,
        is_selected: false,
      },
      {
        id: 'CPLAN-001-C',
        name: 'Emergency Snapshot Deletion',
        description:
          'Delete oldest snapshots on aggr1_n2_nvme volumes to free immediate space. ' +
          'Temporary relief only — does not address root cause.',
        steps: [
          'List snapshots ordered by size: vol snapshot show -vserver uspdc_proj01 -sortby used',
          'Delete top 5 largest snapshots',
          'Verify aggregate utilization drops below 88%',
        ],
        estimated_duration_minutes: 5,
        risk_score: 45,
        success_probability: 70,
        is_selected: false,
      },
    ],
    decision_trace: [
      {
        step: 1,
        description: 'Evaluate candidate plans',
        decision: 'Volume migration selected',
        rationale: 'Lowest risk score (12), highest success probability (97%), non-disruptive',
      },
      {
        step: 2,
        description: 'Verify target resource availability',
        decision: 'aggr1_n7_ssd confirmed available',
        rationale: '52% free (72 TiB) — sufficient for uspdc_tdk_factory_data (2.2 TiB)',
      },
      {
        step: 3,
        description: 'Apply policy constraints',
        decision: 'Plan approved by policy engine',
        rationale: 'All 3 policy checks passed: no maintenance window required, non-disruptive op, storage admin not required',
      },
      {
        step: 4,
        description: 'Confirm rollback feasibility',
        decision: 'Rollback confirmed possible',
        rationale: 'Volume move can be aborted mid-flight; data remains on source until cutover',
      },
    ],
    policy_checks: [
      {
        policy_id: 'POL-001',
        policy_name: 'Maintenance Window Required for Disruptive Operations',
        decision: 'approved',
        reason: 'Volume migration is non-disruptive; no maintenance window required',
      },
      {
        policy_id: 'POL-002',
        policy_name: 'Storage Admin Approval for Aggregate Changes',
        decision: 'approved',
        reason: 'Operation does not modify aggregate configuration; only moves a volume',
      },
      {
        policy_id: 'POL-003',
        policy_name: 'Minimum Free Space on Target Aggregate',
        decision: 'approved',
        reason: 'Target aggr1_n7_ssd: 52% free — above 20% minimum threshold',
      },
    ],
    estimated_outcome:
      'Aggregate aggr1_n2_nvme utilization will drop from 91% to approximately 75% ' +
      'after migration. No volume offline events expected. SnapMirror replication unaffected.',
    rollback_strategy:
      'If volume move encounters an error, issue: vol move abort -vserver uspdc_proj01 -volume uspdc_tdk_factory_data. ' +
      'Volume will remain on source aggregate. Re-evaluate with snapshot deletion as temporary relief.',
  },

  'INC-002': {
    id: 'PLN-002',
    incident_id: 'INC-002',
    generated_at: new Date(Date.now() - 14 * 60_000).toISOString(),
    selected_plan_id: 'CPLAN-002-A',
    candidate_plans: [
      {
        id: 'CPLAN-002-A',
        name: 'DNS Update + SecD Restart',
        description: 'Update DNS configuration to use backup server, then restart Security Daemon.',
        steps: [
          'Update DNS on uspdc-nac01-02: vserver services dns modify -vserver uspdc_nas01 -domains invensense.com -name-servers <backup-dns>',
          'Test DNS resolution: vserver services dns check -vserver uspdc_nas01',
          'Restart SecD: vserver services name-service cache flush -vserver uspdc_nas01',
          'Verify authentication restored',
        ],
        estimated_duration_minutes: 8,
        risk_score: 20,
        success_probability: 89,
        is_selected: true,
      },
      {
        id: 'CPLAN-002-B',
        name: 'SecD Restart Only',
        description: 'Restart Security Daemon without fixing DNS. Likely to recur.',
        steps: [
          'Restart SecD on affected SVMs',
          'Monitor for recurrence',
        ],
        estimated_duration_minutes: 3,
        risk_score: 50,
        success_probability: 55,
        is_selected: false,
      },
    ],
    decision_trace: [
      {
        step: 1,
        description: 'Root cause analysis',
        decision: 'DNS misconfiguration identified as primary cause',
        rationale: 'DNS change preceded first secd failure by 3 minutes; backup DNS is available',
      },
      {
        step: 2,
        description: 'Policy check',
        decision: 'Pending approval',
        rationale: 'SecD restart on production SVM requires storage admin approval',
      },
    ],
    policy_checks: [
      {
        policy_id: 'POL-004',
        policy_name: 'SVM Service Restart Approval',
        decision: 'review_required',
        reason: 'Restarting SecD on production SVM may briefly disrupt active NFS/CIFS sessions. Requires storage admin sign-off.',
      },
    ],
    estimated_outcome:
      'DNS update will restore AD connectivity. SecD restart will clear the failed state. ' +
      'NFS/CIFS clients should reconnect within 30 seconds.',
    rollback_strategy:
      'Revert DNS to original configuration if backup DNS also fails. ' +
      'Contact network team to restore primary DNS server.',
  },

  'INC-003': {
    id: 'PLN-003',
    incident_id: 'INC-003',
    generated_at: new Date(Date.now() - 50 * 60_000).toISOString(),
    selected_plan_id: 'CPLAN-003-A',
    candidate_plans: [
      {
        id: 'CPLAN-003-A',
        name: 'Update Cluster Peer Address',
        description: 'Correct the stale intercluster peer address to restore SnapMirror replication.',
        steps: [
          'Identify correct peer IP: cluster peer show -instance on remote cluster',
          'Update peer address: cluster peer modify -peer-cluster <name> -peer-addrs <new-ip>',
          'Verify connectivity: cluster peer ping -originating-node local -destination-cluster <peer>',
          'Resync lagged SnapMirror relationships: snapmirror resync -destination-path <vserver:volume>',
        ],
        estimated_duration_minutes: 8,
        risk_score: 8,
        success_probability: 99,
        is_selected: true,
      },
    ],
    decision_trace: [
      {
        step: 1,
        description: 'Confirmed correct peer IP from remote cluster',
        decision: 'Peer IP is 10.61.64.30 (updated from 10.61.64.28)',
        rationale: 'Remote cluster reconfigured intercluster LIF during network maintenance',
      },
    ],
    policy_checks: [
      {
        policy_id: 'POL-005',
        policy_name: 'Network Configuration Change Policy',
        decision: 'approved',
        reason: 'Peer address update is a corrective action; does not change network topology',
      },
    ],
    estimated_outcome: '8 SnapMirror relationships will resume replication after peer address update.',
    rollback_strategy: 'Revert peer address to previous value if new IP is incorrect.',
    approved_by: 'storage-admin-01',
    approved_at: new Date(Date.now() - 45 * 60_000).toISOString(),
  },

  'INC-004': {
    id: 'PLN-004',
    incident_id: 'INC-004',
    generated_at: new Date(Date.now() - 155 * 60_000).toISOString(),
    selected_plan_id: 'CPLAN-004-A',
    candidate_plans: [
      {
        id: 'CPLAN-004-A',
        name: 'Reapply Default Snapshot Policy',
        description: 'Apply standard snapshot policy to all 12 affected volumes.',
        steps: [
          'Generate list of affected volumes',
          'For each volume: volume modify -vserver uspdc_proj01 -volume <name> -snapshot-policy default',
          'Verify policy applied: volume show -fields snapshot-policy',
          'Trigger immediate snapshot: volume snapshot create',
        ],
        estimated_duration_minutes: 4,
        risk_score: 2,
        success_probability: 100,
        is_selected: true,
      },
    ],
    decision_trace: [
      {
        step: 1,
        description: 'Identify affected volumes',
        decision: '12 volumes confirmed with snapshot-policy = none',
        rationale: 'All migrated by same script on 2026-06-29',
      },
    ],
    policy_checks: [
      {
        policy_id: 'POL-006',
        policy_name: 'Data Protection Policy',
        decision: 'approved',
        reason: 'Applying snapshot policy restores compliance; no risk to data',
      },
    ],
    estimated_outcome: 'All 12 volumes will be compliant within 5 minutes.',
    rollback_strategy: 'Not applicable — applying a snapshot policy is always reversible.',
    approved_by: 'automation-engine',
    approved_at: new Date(Date.now() - 145 * 60_000).toISOString(),
  },

  'INC-005': {
    id: 'PLN-005',
    incident_id: 'INC-005',
    generated_at: new Date(Date.now() - 18 * 60_000).toISOString(),
    selected_plan_id: 'CPLAN-005-A',
    candidate_plans: [
      {
        id: 'CPLAN-005-A',
        name: 'Volume Expansion + Auto-grow',
        description: 'Expand volume by 4 TiB and enable auto-grow to prevent future incidents.',
        steps: [
          'Expand volume: volume size -vserver uspdc_wv01 -volume uspdc_wvfltdt03 -new-size 21.4t',
          'Enable auto-grow: volume modify -vserver uspdc_wv01 -volume uspdc_wvfltdt03 -space-mgmt-try-first grow -autosize-mode grow_shrink -maximum-size 22t',
          'Verify new size and policy',
        ],
        estimated_duration_minutes: 2,
        risk_score: 5,
        success_probability: 99,
        is_selected: true,
      },
    ],
    decision_trace: [
      {
        step: 1,
        description: 'Confirm target aggregate capacity',
        decision: 'aggr1_n8_ssd has 72 TiB free — approved for expansion',
        rationale: 'Requested 4 TiB << 72 TiB available',
      },
    ],
    policy_checks: [
      {
        policy_id: 'POL-007',
        policy_name: 'Volume Expansion Approval (> 2 TiB)',
        decision: 'review_required',
        reason: 'Expansions > 2 TiB require storage team notification',
      },
    ],
    estimated_outcome: 'Volume will have 30+ days of headroom at current growth rate.',
    rollback_strategy: 'Volume shrink can reduce size back after workload stabilizes.',
  },
};

export function getMockPlan(incidentId: string): PlanResult | undefined {
  return MOCK_PLANS[incidentId];
}
