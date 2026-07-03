import type { KnowledgeDocument, KnowledgeResponse, KnowledgeSearchResponse } from '../types/scorpius';

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const MOCK_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'KB-001',
    title: 'NetApp Aggregate Capacity Management Runbook',
    type: 'runbook',
    category: 'Capacity Management',
    summary:
      'Step-by-step procedures for resolving aggregate capacity issues, including volume migration, ' +
      'snapshot management, and emergency recovery procedures.',
    content_excerpt:
      'When aggregate utilization exceeds 90%, immediate action is required. ' +
      'Recommended approach: identify the largest or fastest-growing volumes using ' +
      '"volume show -vserver * -fields size,used,available -sortby used". ' +
      'Move suitable volumes to aggregates with >40% free space using vol move. ' +
      'Prefer volumes with low IOPS to minimize disruption during migration.',
    tags: ['aggregate', 'capacity', 'volume-move', 'runbook'],
    related_incident_ids: ['INC-001'],
    created_at: ago(120),
    updated_at: ago(14),
    author: 'storage-team@company.com',
  },
  {
    id: 'KB-008',
    title: 'Volume Migration Checklist',
    type: 'runbook',
    category: 'Operations',
    summary: 'Pre/post migration checklist to ensure data protection and policies are preserved.',
    content_excerpt:
      'Before migration: note current snapshot policy, export policy, QoS policy, and security style. ' +
      'After migration: verify all policies are preserved. Common pitfall: vol move does not ' +
      'preserve snapshot policies in ONTAP 9.12+. Always manually verify: ' +
      '"volume show -vserver <svm> -volume <vol> -fields snapshot-policy".',
    tags: ['volume-move', 'checklist', 'snapshot', 'policy'],
    related_incident_ids: ['INC-004'],
    created_at: ago(90),
    updated_at: ago(7),
    author: 'storage-team@company.com',
  },
  {
    id: 'KB-015',
    title: 'Volume Migration — NVMe to SSD Aggregates',
    type: 'runbook',
    category: 'Capacity Management',
    summary: 'Procedure for non-disruptive volume moves between NVMe and SSD aggregate tiers.',
    content_excerpt:
      'Volume migrations from NVMe to SSD aggregates are non-disruptive for NFS/CIFS clients. ' +
      'Performance: approx 500 MiB/s transfer rate. Estimate: 100 GiB per 3.5 minutes. ' +
      'Monitor progress: "vol move show -vserver <svm> -volume <vol>". ' +
      'Abort if needed: "vol move abort -vserver <svm> -volume <vol>".',
    tags: ['volume-move', 'nvme', 'ssd', 'non-disruptive'],
    related_incident_ids: ['INC-001'],
    created_at: ago(60),
    updated_at: ago(21),
    author: 'storage-team@company.com',
  },
  {
    id: 'KB-022',
    title: 'SecD Failure Troubleshooting Guide',
    type: 'runbook',
    category: 'Authentication & Security',
    summary:
      'Troubleshooting guide for secd.unexpectedFailure events. Covers DNS, AD, Kerberos and LDAP issues.',
    content_excerpt:
      'secd.unexpectedFailure root causes (in order of frequency): ' +
      '(1) AD/LDAP connectivity issues — verify DNS resolution from node; ' +
      '(2) Expired machine account password — check AD account status; ' +
      '(3) Clock skew > 5 minutes — sync NTP. ' +
      'First step: "vserver services dns check -vserver <svm>" to test DNS. ' +
      'Restart SecD: "vserver services name-service cache flush -vserver <svm>".',
    tags: ['secd', 'authentication', 'ldap', 'ad', 'dns', 'kerberos'],
    related_incident_ids: ['INC-002'],
    created_at: ago(180),
    updated_at: ago(30),
    author: 'security-team@company.com',
  },
  {
    id: 'KB-031',
    title: 'SnapMirror Cluster Peer Reconfiguration',
    type: 'runbook',
    category: 'Replication',
    summary: 'Procedure for updating cluster peer addresses to restore SnapMirror replication.',
    content_excerpt:
      'To update a cluster peer address after network change: ' +
      '"cluster peer modify -peer-cluster <name> -peer-addrs <new-ip>". ' +
      'Verify connectivity: "cluster peer ping -originating-node local -destination-cluster <peer>". ' +
      'After updating, resync lagged relationships: "snapmirror resync -destination-path <vserver:volume>". ' +
      'If peer cluster is inaccessible, use -force-peer flag with caution.',
    tags: ['snapmirror', 'peering', 'replication', 'network'],
    related_incident_ids: ['INC-003'],
    created_at: ago(200),
    updated_at: ago(45),
    author: 'storage-team@company.com',
  },
  {
    id: 'IH-042',
    title: 'INC-2026-0042: aggr1_n1_nvme near-full — Resolved March 2026',
    type: 'incident_history',
    category: 'Incident History',
    summary:
      'Historical resolution: aggregate near-full on aggr1_n1_nvme resolved by migrating ' +
      'uspdc_chirpsim01 to aggr1_n7_ssd. Zero client disruption. 22-minute resolution.',
    content_excerpt:
      'Root cause: Chirp simulation workload generated 280 GiB/day over 3 days. ' +
      'Resolution: non-disruptive volume move of uspdc_chirpsim01 (11.1 TiB) to aggr1_n7_ssd. ' +
      'Migration completed in 22 minutes. Source aggregate dropped from 93% to 74%. ' +
      'Lesson: large simulation workloads should have auto-grow enabled and aggregate capacity monitoring alerts.',
    tags: ['aggregate', 'capacity', 'volume-move', 'simulation', 'resolved'],
    related_incident_ids: ['INC-001'],
    created_at: ago(95),
    updated_at: ago(95),
    author: 'automation@scorpius',
  },
  {
    id: 'UC-003',
    title: 'Use Case: Predictive Capacity Planning',
    type: 'use_case',
    category: 'Use Cases',
    summary:
      'Scorpius predictive capacity engine identifies volumes and aggregates at risk before ' +
      'service disruption occurs, enabling proactive remediation.',
    content_excerpt:
      'Scorpius monitors write rate trends and applies linear regression to project time-to-full. ' +
      'Alert thresholds: 30-day (low), 14-day (medium), 7-day (high), 3-day (critical). ' +
      'When a threshold is crossed, an incident is automatically created and AI analysis begins. ' +
      'Historical accuracy: 91% of capacity incidents predicted ≥ 7 days in advance.',
    tags: ['predictive', 'capacity', 'use-case', 'automation'],
    related_incident_ids: ['INC-005'],
    created_at: ago(50),
    updated_at: ago(5),
    author: 'product@scorpius',
  },
  {
    id: 'UC-007',
    title: 'Use Case: Automated Aggregate Capacity Management',
    type: 'use_case',
    category: 'Use Cases',
    summary:
      'Full automation of aggregate capacity management: detect → analyze → plan → execute → verify.',
    content_excerpt:
      'This use case demonstrates Scorpius detecting aggregate near-full conditions, ' +
      'automatically identifying the best candidate volume for migration, evaluating ' +
      'target aggregate options, executing a non-disruptive volume move, and verifying ' +
      'resolution — all within minutes of the initial EMS event.',
    tags: ['aggregate', 'automation', 'use-case', 'volume-move'],
    related_incident_ids: ['INC-001'],
    created_at: ago(40),
    updated_at: ago(2),
    author: 'product@scorpius',
  },
  {
    id: 'POL-001',
    title: 'Storage Operations Policy — Maintenance Windows',
    type: 'policy',
    category: 'Policy',
    summary: 'Defines which storage operations require a maintenance window.',
    content_excerpt:
      'Operations classified as non-disruptive (volume moves, policy changes, snapshot management) ' +
      'may be executed at any time without a maintenance window. ' +
      'Operations classified as potentially disruptive (SVM restarts, aggregate addition, node reboots) ' +
      'require a 4-hour maintenance window and storage admin approval. ' +
      'Emergency exceptions require VP-Infrastructure approval.',
    tags: ['policy', 'maintenance-window', 'approval'],
    related_incident_ids: [],
    created_at: ago(365),
    updated_at: ago(60),
    author: 'infra-ops@company.com',
  },
];

export function getMockKnowledgeResponse(): KnowledgeResponse {
  return {
    documents: MOCK_KNOWLEDGE_DOCS,
    total: MOCK_KNOWLEDGE_DOCS.length,
    fetched_at: new Date().toISOString(),
  };
}

export function getMockKnowledgeForIncident(incidentId: string): KnowledgeDocument[] {
  return MOCK_KNOWLEDGE_DOCS.filter((d) => d.related_incident_ids.includes(incidentId));
}

export function searchMockKnowledge(query: string): KnowledgeSearchResponse {
  const q = query.toLowerCase();
  const results = MOCK_KNOWLEDGE_DOCS.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.content_excerpt.toLowerCase().includes(q) ||
      d.tags.some((t) => t.includes(q))
  ).map((document) => ({
    document,
    score: 0.85,
    matched_excerpt: document.content_excerpt.slice(0, 200) + '...',
  }));

  return {
    query,
    results,
    total: results.length,
  };
}
