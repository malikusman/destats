/**
 * TypeScript contracts for the Scorpius platform APIs.
 *
 * These types are written to match the expected real API contracts.
 * All API modules in src/api/scorpius/ currently return mock data shaped
 * to these types. When real endpoints are available, swap the mock import
 * for a real apiGet() call — no page or hook changes needed.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'active' | 'investigating' | 'resolved' | 'suppressed';
export type ActionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type ServiceHealth = 'healthy' | 'degraded' | 'down' | 'unknown';
export type RiskLevel = 'high' | 'medium' | 'low';
export type PolicyDecision = 'approved' | 'rejected' | 'review_required';

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export interface IncidentAsset {
  id: string;
  name: string;
  type: 'node' | 'aggregate' | 'volume' | 'svm' | 'lif' | 'cluster';
  details?: string;
}

export interface IncidentTimelineEvent {
  timestamp: string;
  event: string;
  actor: 'system' | 'ai' | 'user' | 'policy';
  detail?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  priority: number;           // 1 = highest
  status: IncidentStatus;
  source: string;             // e.g. "EMS / wafl.aggr.full"
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assets: IncidentAsset[];
  tags: string[];
  timeline: IncidentTimelineEvent[];
  /** ID of the AI reasoning record for this incident */
  reasoning_id?: string;
}

export interface IncidentListResponse {
  incidents: Incident[];
  total: number;
  active_count: number;
  fetched_at: string;
}

// ---------------------------------------------------------------------------
// AI Reasoning
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  id: string;
  type: 'metric' | 'event' | 'log' | 'historical';
  source: string;
  summary: string;
  value?: string;
  relevance_score: number;    // 0–1
  provenance_note?: string;
  confidence_impact?: 'high' | 'medium' | 'low';
}

export interface KnowledgeReference {
  id: string;
  title: string;
  type: 'runbook' | 'incident_history' | 'use_case' | 'documentation';
  excerpt: string;
  similarity_score: number;   // 0–1
  source_url?: string;
  source_label?: string;
  caveat?: string;
}

export interface RecommendedAction {
  id: string;
  rank: number;
  action: string;
  rationale: string;
  estimated_risk: RiskLevel;
  estimated_duration_minutes: number;
  reversible: boolean;
  requires_approval: boolean;
}

export interface AiReasoning {
  id: string;
  incident_id: string;
  model_version: string;
  generated_at: string;
  incident_summary: string;
  root_cause_hypothesis: string;
  confidence_score: number;   // 0–100
  risk_level: RiskLevel;
  confidence_note?: string;
  evidence: EvidenceItem[];
  knowledge_references: KnowledgeReference[];
  recommended_actions: RecommendedAction[];
  reasoning_trace: string;    // full chain-of-thought text
}

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

export interface CandidatePlan {
  id: string;
  name: string;
  description: string;
  steps: string[];
  estimated_duration_minutes: number;
  risk_score: number;         // 0–100 (lower = safer)
  success_probability: number; // 0–100
  is_selected: boolean;
}

export interface PolicyCheck {
  policy_id: string;
  policy_name: string;
  decision: PolicyDecision;
  reason: string;
}

export interface DecisionTraceStep {
  step: number;
  description: string;
  decision: string;
  rationale: string;
}

export interface PlanResult {
  id: string;
  incident_id: string;
  generated_at: string;
  candidate_plans: CandidatePlan[];
  selected_plan_id: string;
  decision_trace: DecisionTraceStep[];
  policy_checks: PolicyCheck[];
  estimated_outcome: string;
  rollback_strategy: string;
  operator_caveats?: string[];
  approved_by?: string;
  approved_at?: string;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

export interface ExecutionAction {
  id: string;
  rank: number;
  name: string;
  description: string;
  status: ActionStatus;
  started_at?: string;
  completed_at?: string;
  output?: string;
  error?: string;
  duration_seconds?: number;
}

export interface ExecutionRun {
  id: string;
  incident_id: string;
  plan_id: string;
  status: ActionStatus;
  started_at: string;
  completed_at?: string;
  actions: ExecutionAction[];
  rollback_triggered: boolean;
  rollback_reason?: string;
  outcome_summary?: string;
}

export interface ExecutionHistoryEntry {
  id: string;
  incident_id: string;
  incident_title: string;
  started_at: string;
  completed_at?: string;
  status: ActionStatus;
  actions_total: number;
  actions_completed: number;
  actions_failed: number;
}

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: 'runbook' | 'incident_history' | 'use_case' | 'documentation' | 'policy';
  category: string;
  summary: string;
  content_excerpt: string;
  tags: string[];
  related_incident_ids: string[];
  created_at: string;
  updated_at: string;
  author?: string;
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocument;
  score: number;              // semantic similarity 0–1
  matched_excerpt: string;
}

export interface KnowledgeResponse {
  documents: KnowledgeDocument[];
  total: number;
  fetched_at: string;
}

export interface KnowledgeSearchResponse {
  query: string;
  results: KnowledgeSearchResult[];
  total: number;
}

// ---------------------------------------------------------------------------
// System Status
// ---------------------------------------------------------------------------

export interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  health: ServiceHealth;
  uptime_seconds?: number;
  last_check: string;
  version?: string;
  endpoint?: string;
  metrics?: Record<string, string | number>;
  error_message?: string;
}

export interface SystemStatusResponse {
  overall_health: ServiceHealth;
  fetched_at: string;
  services: ServiceStatus[];
}
