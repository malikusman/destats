/** Control Plane (Epics 7 / 13 / 14) response shapes from TDK handoff. */

export interface AiModelRoute {
  name: string;
  provider: string;
  available: boolean;
}

export interface AiPromptMetadata {
  prompt_id: string;
  name: string;
  purpose: string;
  version: string;
  model_preference?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  templates?: unknown;
  required_inputs?: string[];
  output_schema?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface AiRequestLog {
  request_id: string;
  component_name: string;
  prompt_id: string | null;
  prompt_version: string | null;
  model: string;
  input_summary: string;
  output_summary: string;
  latency_ms: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface PolicyRule {
  rule_id: string;
  name: string;
  description: string;
  rule_type: string;
  enabled: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  outcome: string;
  risk_level: string | null;
  required_approver: string | null;
  audit_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentEvaluationResult {
  accepted: boolean;
  evaluator: string;
  score: number;
  reasons: string[];
  evidence: unknown[];
  risk: unknown;
  created_at: string;
}

export interface RecommendationRankItem {
  action_id: string;
  score: number;
  rank: number;
  reasons: string[];
}

export interface RecommendationRanking {
  recommendations: RecommendationRankItem[];
  ranking_method: string;
  created_at: string;
}

export interface ConfidenceScoreResult {
  score: number;
  level: string;
  reasons: string[];
}

export interface PolicyDecisionResponse {
  decision: string;
  reason: string;
  policy_id: string;
  risk_level: string;
  required_approver: string | null;
  audit_required: boolean;
  created_at: string;
}

export interface CandidateAction {
  action_id: string;
  name: string;
  description: string;
  estimated_risk?: string;
  requires_approval?: boolean;
}
