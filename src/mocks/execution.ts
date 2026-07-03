import type { ExecutionRun, ExecutionHistoryEntry } from '../types/scorpius';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const MOCK_EXECUTIONS: Record<string, ExecutionRun> = {
  'INC-001': {
    id: 'EXEC-001',
    incident_id: 'INC-001',
    plan_id: 'PLN-001',
    status: 'running',
    started_at: ago(30),
    actions: [
      {
        id: 'EXEC-001-A1',
        rank: 1,
        name: 'Verify target aggregate capacity',
        description: 'Check aggr1_n7_ssd has ≥ 4 TiB free space',
        status: 'completed',
        started_at: ago(30),
        completed_at: ago(29),
        duration_seconds: 8,
        output: 'aggr1_n7_ssd: 52.3% used, 72.1 TiB available. ✓',
      },
      {
        id: 'EXEC-001-A2',
        rank: 2,
        name: 'Suspend snapshot schedules',
        description: 'Temporarily disable snapshot policies on aggr1_n2_nvme volumes',
        status: 'completed',
        started_at: ago(29),
        completed_at: ago(28),
        duration_seconds: 12,
        output: 'Suspended 4 snapshot schedules on aggr1_n2_nvme.',
      },
      {
        id: 'EXEC-001-A3',
        rank: 3,
        name: 'Initiate volume move',
        description: 'Move uspdc_tdk_factory_data → aggr1_n7_ssd',
        status: 'running',
        started_at: ago(28),
        output: 'Volume move in progress. 68% complete (1.5 TiB of 2.2 TiB transferred). Est. 7 min remaining.',
      },
      {
        id: 'EXEC-001-A4',
        rank: 4,
        name: 'Verify aggregate utilization',
        description: 'Confirm aggr1_n2_nvme drops below 85%',
        status: 'pending',
      },
      {
        id: 'EXEC-001-A5',
        rank: 5,
        name: 'Re-enable snapshot schedules',
        description: 'Restore snapshot policies after successful migration',
        status: 'pending',
      },
    ],
    rollback_triggered: false,
  },

  'INC-003': {
    id: 'EXEC-003',
    incident_id: 'INC-003',
    plan_id: 'PLN-003',
    status: 'completed',
    started_at: ago(40),
    completed_at: ago(20),
    actions: [
      {
        id: 'EXEC-003-A1',
        rank: 1,
        name: 'Update cluster peer address',
        description: 'Correct peer address from 10.61.64.28 to 10.61.64.30',
        status: 'completed',
        started_at: ago(40),
        completed_at: ago(38),
        duration_seconds: 95,
        output: 'cluster peer modify completed. New address: 10.61.64.30',
      },
      {
        id: 'EXEC-003-A2',
        rank: 2,
        name: 'Verify peer connectivity',
        description: 'Ping cluster peer via new address',
        status: 'completed',
        started_at: ago(38),
        completed_at: ago(37),
        duration_seconds: 22,
        output: 'Ping to 10.61.64.30 successful. Round-trip: 0.8ms',
      },
      {
        id: 'EXEC-003-A3',
        rank: 3,
        name: 'Resync SnapMirror relationships',
        description: 'Resync 8 lagged SnapMirror destination volumes',
        status: 'completed',
        started_at: ago(37),
        completed_at: ago(22),
        duration_seconds: 900,
        output: '8 SnapMirror relationships resynced. All now in healthy state.',
      },
    ],
    rollback_triggered: false,
    outcome_summary: 'Cluster peering restored. All 8 SnapMirror relationships healthy.',
  },

  'INC-004': {
    id: 'EXEC-004',
    incident_id: 'INC-004',
    plan_id: 'PLN-004',
    status: 'completed',
    started_at: ago(140),
    completed_at: ago(136),
    actions: [
      {
        id: 'EXEC-004-A1',
        rank: 1,
        name: 'Reapply snapshot policy to 12 volumes',
        description: 'Apply default snapshot policy to all affected volumes',
        status: 'completed',
        started_at: ago(140),
        completed_at: ago(138),
        duration_seconds: 44,
        output: 'Policy applied to 12 volumes: [uspdc_proj_vol01 ... uspdc_proj_vol12]. ✓',
      },
      {
        id: 'EXEC-004-A2',
        rank: 2,
        name: 'Trigger immediate snapshot',
        description: 'Create snapshots on all 12 volumes to restore data protection immediately',
        status: 'completed',
        started_at: ago(138),
        completed_at: ago(136),
        duration_seconds: 78,
        output: '12 snapshots created successfully.',
      },
    ],
    rollback_triggered: false,
    outcome_summary: 'Data protection compliance restored for 12 volumes. Snapshots created.',
  },
};

export const MOCK_EXECUTION_HISTORY: ExecutionHistoryEntry[] = [
  {
    id: 'EXEC-004',
    incident_id: 'INC-004',
    incident_title: 'Snapshot policy drift on 12 volumes',
    started_at: ago(140),
    completed_at: ago(136),
    status: 'completed',
    actions_total: 2,
    actions_completed: 2,
    actions_failed: 0,
  },
  {
    id: 'EXEC-003',
    incident_id: 'INC-003',
    incident_title: 'Cluster peer address mismatch',
    started_at: ago(40),
    completed_at: ago(20),
    status: 'completed',
    actions_total: 3,
    actions_completed: 3,
    actions_failed: 0,
  },
  {
    id: 'EXEC-001',
    incident_id: 'INC-001',
    incident_title: 'Aggregate aggr1_n2_nvme approaching capacity limit',
    started_at: ago(30),
    status: 'running',
    actions_total: 5,
    actions_completed: 2,
    actions_failed: 0,
  },
];

export function getMockExecution(incidentId: string): ExecutionRun | undefined {
  return MOCK_EXECUTIONS[incidentId];
}

export function getMockExecutionHistory(): ExecutionHistoryEntry[] {
  return MOCK_EXECUTION_HISTORY;
}
