import { incidentGet, incidentPost } from './client';
import type {
  LearningApplyRequest,
  LearningApplyResponse,
  LearningCreatePayload,
  LearningCreateResponse,
  LearningFeedbackPayload,
  LearningFeedbackResponse,
  LearningRecord,
  LearningStats,
} from '../../types/platform-api';

function asLearningList(data: unknown): LearningRecord[] {
  if (Array.isArray(data)) return data as LearningRecord[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['learning', 'learnings', 'items', 'records', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as LearningRecord[];
    }
    if (obj.learning_record && typeof obj.learning_record === 'object') {
      return [obj.learning_record as LearningRecord];
    }
  }
  return [];
}

export async function fetchLearningList(): Promise<LearningRecord[]> {
  const data = await incidentGet<unknown>('/learning');
  return asLearningList(data);
}

export function fetchLearningStats(): Promise<LearningStats> {
  return incidentGet<LearningStats>('/learning/stats');
}

export function fetchLearningRankings(): Promise<unknown> {
  return incidentGet('/learning/rankings');
}

export async function fetchLearningForIncident(incidentId: string): Promise<LearningRecord[]> {
  const data = await incidentGet<unknown>(
    `/learning/incident/${encodeURIComponent(incidentId)}`,
  );
  return asLearningList(data);
}

export async function fetchLearningById(learningId: string): Promise<LearningRecord> {
  const data = await incidentGet<unknown>(
    `/learning/${encodeURIComponent(learningId)}`,
  );
  if (data && typeof data === 'object' && 'learning_record' in data) {
    return (data as LearningCreateResponse).learning_record;
  }
  return data as LearningRecord;
}

export function createLearning(payload: LearningCreatePayload): Promise<LearningCreateResponse> {
  return incidentPost<LearningCreateResponse>('/learning', payload);
}

export function applyLearning(body: LearningApplyRequest): Promise<LearningApplyResponse> {
  return incidentPost<LearningApplyResponse>('/learning/apply', body);
}

export function submitLearningFeedback(
  learningId: string,
  payload: LearningFeedbackPayload,
): Promise<LearningFeedbackResponse> {
  return incidentPost<LearningFeedbackResponse>(
    `/learning/${encodeURIComponent(learningId)}/feedback`,
    payload,
  );
}
