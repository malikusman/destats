/**
 * Live Epic 4 / 5 / 10 / 11 contracts (Use Case, Knowledge, Learning, Evaluation)
 * served under `/incident-api`.
 */

// ---------------------------------------------------------------------------
// Use Cases (Epic 4)
// ---------------------------------------------------------------------------

export interface UseCase {
  id: number;
  title: string;
  description: string | null;
  problem: string | null;
  environment: string | null;
  trigger_conditions: unknown[];
  historical_incidents: unknown[];
  incident_ids: string[];
  related_usecases: number[];
  status: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  resolution: string | null;
  outcome: string | null;
  confidence: number | null;
  supporting_evidence: unknown[];
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseCaseCreatePayload {
  title: string;
  description?: string;
  problem?: string;
  environment?: string;
  category?: string;
  status?: string;
  tags?: string[];
}

export interface UseCasePatchPayload {
  title?: string;
  description?: string;
  problem?: string;
  environment?: string;
  category?: string;
  tags?: string[];
  resolution?: string;
  outcome?: string;
}

// ---------------------------------------------------------------------------
// Knowledge (Epic 5)
// ---------------------------------------------------------------------------

export interface KnowledgeItem {
  id: number;
  title: string;
  document_type: string | null;
  source: string | null;
  content: string;
  tags: string[];
  related_usecase_ids: number[];
  embedding_status: string | null;
  parent_document_id: number | null;
  chunk_index: number | null;
  chunk_count: number | null;
  created_at: string;
  updated_at: string;
  similarity_score?: number;
}

export interface KnowledgeCreatePayload {
  title: string;
  content: string;
  tags?: string[];
  document_type?: string;
  source?: string;
}

export interface KnowledgeCreateResponse {
  knowledge_item: KnowledgeItem;
  embedding_result?: {
    ok: boolean;
    knowledge_id: number;
    embedding_status: string;
    collection_name?: string;
    provider?: string;
    model?: string;
  };
}

export interface KnowledgeRetrieveRequest {
  query: string;
  limit?: number;
}

export interface KnowledgeRetrieveResponse {
  ok: boolean;
  retrieval_type: string;
  query: string;
  semantic_search: {
    ok: boolean;
    query: string;
    retrieval_type: string;
    provider?: string;
    model?: string;
    collection_name?: string;
    returned_records: number;
    records: KnowledgeItem[];
  };
}

export interface KnowledgeSimilarRequest {
  query: string;
  limit?: number;
}

export interface KnowledgeSimilarResponse {
  ok: boolean;
  query: string;
  retrieval_type: string;
  provider?: string;
  model?: string;
  collection_name?: string;
  returned_records: number;
  records: KnowledgeItem[];
}

export interface KnowledgeIngestRequest {
  title: string;
  content: string;
  type?: string;
}

export interface KnowledgeIngestResponse {
  ok: boolean;
  document_id: number;
  title: string;
  chunk_count: number;
  completed_embeddings: number;
  failed_embeddings: number;
  records: KnowledgeItem[];
}

// ---------------------------------------------------------------------------
// Learning (Epic 10)
// ---------------------------------------------------------------------------

export interface LearningRecord {
  id: number;
  learning_id: string;
  incident_id: string;
  usecase_id: number | null;
  knowledge_id: number | null;
  recommendation: string | null;
  recommendation_key: string | null;
  action_taken: string | null;
  result: string | null;
  outcome_status: string | null;
  success: boolean | null;
  user_feedback: string | null;
  confidence_before: number | null;
  confidence_after: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningCreatePayload {
  incident_id: string;
  usecase_id?: number;
  knowledge_id?: number;
  recommendation: string;
  outcome?: string;
  notes?: string;
  action_taken?: string;
}

export interface LearningCreateResponse {
  ok: boolean;
  learning_record: LearningRecord;
}

export interface LearningApplyRequest {
  recommendations: Array<{
    recommendation: string;
    confidence: number;
  }>;
}

export interface LearningAppliedRecommendation {
  recommendation: string;
  confidence: number;
  recommendation_key: string;
  historical_attempts: number;
  historical_successes: number;
  historical_failures: number;
  historical_success_rate: number;
  adjusted_confidence: number;
  learning_applied: boolean;
  rank: number;
}

export interface LearningApplyResponse {
  ok: boolean;
  returned_records: number;
  recommendations: LearningAppliedRecommendation[];
}

export interface LearningFeedbackPayload {
  success: boolean;
  rating?: number;
  comment?: string;
}

export interface LearningFeedbackResponse {
  ok: boolean;
  learning_record: LearningRecord;
}

export interface LearningStats {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Evaluation (Epic 11)
// ---------------------------------------------------------------------------

export interface EvaluationMetric {
  metric_id: string;
  evaluation_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  threshold: number;
  passed: boolean;
  calculation_method?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface EvaluationRecord {
  evaluation_id: string;
  incident_id: string | null;
  learning_id: string | null;
  recommendation_key: string | null;
  evaluation_type: string;
  status: string;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  response_time_ms: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metrics?: EvaluationMetric[];
}

export interface EvaluationRunRequest {
  learning_id: string;
  evaluation_type?: string;
  retrieved_items?: number;
  relevant_retrieved_items?: number;
  total_known_relevant_items?: number;
  user_feedback_score?: number;
  response_time_ms?: number;
  response_time_threshold_ms?: number;
  created_by?: string;
  incident_id?: string;
}

export interface EvaluationRunResponse {
  ok: boolean;
  evaluation: EvaluationRecord;
}
