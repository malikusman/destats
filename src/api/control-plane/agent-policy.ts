import { controlPlaneGet, controlPlanePost } from './client';
import type {
  AgentEvaluationResult,
  CandidateAction,
  ConfidenceScoreResult,
  PolicyDecisionResponse,
  PolicyRule,
  RecommendationRanking,
} from '../../types/control-plane';

export function fetchPolicyRules(): Promise<PolicyRule[]> {
  return controlPlaneGet<PolicyRule[]>('/policy/rules');
}

export function checkPolicyAction(body: Record<string, unknown>): Promise<PolicyDecisionResponse> {
  return controlPlanePost<PolicyDecisionResponse>('/policy/check-action', body);
}

export function evaluateIncident(body: Record<string, unknown>): Promise<AgentEvaluationResult> {
  return controlPlanePost<AgentEvaluationResult>('/agent/evaluate-incident', body);
}

export function rankRecommendations(actions: CandidateAction[]): Promise<RecommendationRanking> {
  return controlPlanePost<RecommendationRanking>('/agent/rank-recommendations', { actions });
}

export function confidenceScore(body: Record<string, unknown>): Promise<ConfidenceScoreResult> {
  return controlPlanePost<ConfidenceScoreResult>('/agent/confidence-score', body);
}
