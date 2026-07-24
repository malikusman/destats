import { incidentGet, incidentPost } from './client';
import type {
  EvaluationRecord,
  EvaluationRunRequest,
  EvaluationRunResponse,
} from '../../types/platform-api';

function asEvaluationList(data: unknown): EvaluationRecord[] {
  if (Array.isArray(data)) return data as EvaluationRecord[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['evaluations', 'items', 'records', 'history', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as EvaluationRecord[];
    }
    if (obj.evaluation && typeof obj.evaluation === 'object') {
      return [obj.evaluation as EvaluationRecord];
    }
  }
  return [];
}

export async function fetchEvaluations(): Promise<EvaluationRecord[]> {
  const data = await incidentGet<unknown>('/evaluation');
  const fromList = asEvaluationList(data);
  if (fromList.length > 0) return fromList;
  // Live gateway returns summary-only on GET /evaluation; history has the rows.
  return fetchEvaluationHistory();
}

export async function fetchEvaluationHistory(): Promise<EvaluationRecord[]> {
  const data = await incidentGet<unknown>('/evaluation/history');
  return asEvaluationList(data);
}

export async function fetchEvaluationById(evaluationId: string): Promise<EvaluationRecord> {
  const data = await incidentGet<unknown>(
    `/evaluation/${encodeURIComponent(evaluationId)}`,
  );
  if (data && typeof data === 'object' && 'evaluation' in data) {
    return (data as EvaluationRunResponse).evaluation;
  }
  return data as EvaluationRecord;
}

export function runEvaluation(body: EvaluationRunRequest): Promise<EvaluationRunResponse> {
  return incidentPost<EvaluationRunResponse>('/evaluation/run', body);
}
