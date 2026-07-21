import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRefreshInterval as useRefreshCtx } from './RefreshContext';
import {
  approveUseCase,
  createUseCase,
  fetchUseCaseById,
  fetchUseCases,
  patchUseCase,
  searchUseCases,
  submitUseCase,
} from '../api/incident-service/usecases';
import {
  createKnowledge,
  fetchKnowledgeAsDocuments,
  fetchKnowledgeItem,
  retrieveKnowledge,
  searchKnowledgeAsDocuments,
  similarKnowledge,
} from '../api/incident-service/knowledge';
import {
  applyLearning,
  createLearning,
  fetchLearningById,
  fetchLearningForIncident,
  fetchLearningList,
  fetchLearningRankings,
  fetchLearningStats,
  submitLearningFeedback,
} from '../api/incident-service/learning';
import {
  fetchEvaluationById,
  fetchEvaluationHistory,
  fetchEvaluations,
  runEvaluation,
} from '../api/incident-service/evaluation';
import type {
  EvaluationRunRequest,
  KnowledgeCreatePayload,
  KnowledgeRetrieveRequest,
  KnowledgeSimilarRequest,
  LearningApplyRequest,
  LearningCreatePayload,
  LearningFeedbackPayload,
  UseCaseCreatePayload,
  UseCasePatchPayload,
} from '../types/platform-api';

function useRefreshInterval() {
  const { option } = useRefreshCtx();
  return option.interval;
}

// --- Use Cases ---

export function useUseCases() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['platform', 'usecases'],
    queryFn: fetchUseCases,
    refetchInterval,
  });
}

export function useUseCaseSearch(query: string) {
  const enabled = query.trim().length >= 2;
  return useQuery({
    queryKey: ['platform', 'usecases', 'search', query],
    queryFn: () => searchUseCases(query.trim()),
    enabled,
  });
}

export function useUseCase(id: number | string | undefined) {
  return useQuery({
    queryKey: ['platform', 'usecase', id],
    queryFn: () => (id != null ? fetchUseCaseById(id) : null),
    enabled: id != null && id !== '',
  });
}

export function useCreateUseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UseCaseCreatePayload) => createUseCase(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['platform', 'usecases'] });
    },
  });
}

export function usePatchUseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UseCasePatchPayload }) =>
      patchUseCase(id, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['platform', 'usecases'] });
      void qc.invalidateQueries({ queryKey: ['platform', 'usecase', vars.id] });
    },
  });
}

export function useSubmitUseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => submitUseCase(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['platform', 'usecases'] });
      void qc.invalidateQueries({ queryKey: ['platform', 'usecase', id] });
    },
  });
}

export function useApproveUseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => approveUseCase(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['platform', 'usecases'] });
      void qc.invalidateQueries({ queryKey: ['platform', 'usecase', id] });
    },
  });
}

// --- Knowledge ---

export function usePlatformKnowledge() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['platform', 'knowledge'],
    queryFn: fetchKnowledgeAsDocuments,
    refetchInterval,
  });
}

export function usePlatformKnowledgeSearch(query: string) {
  const enabled = query.trim().length >= 2;
  return useQuery({
    queryKey: ['platform', 'knowledge', 'search', query],
    queryFn: () => searchKnowledgeAsDocuments(query.trim()),
    enabled,
  });
}

export function useKnowledgeItem(id: number | string | undefined) {
  return useQuery({
    queryKey: ['platform', 'knowledge', id],
    queryFn: () => (id != null ? fetchKnowledgeItem(id) : null),
    enabled: id != null && id !== '',
  });
}

export function useKnowledgeRetrieve(query: string | undefined, limit = 5) {
  const enabled = !!query && query.trim().length >= 2;
  return useQuery({
    queryKey: ['platform', 'knowledge', 'retrieve', query, limit],
    queryFn: () =>
      retrieveKnowledge({ query: query!.trim(), limit } satisfies KnowledgeRetrieveRequest),
    enabled,
  });
}

export function useKnowledgeSimilar(query: string | undefined, limit = 3) {
  const enabled = !!query && query.trim().length >= 2;
  return useQuery({
    queryKey: ['platform', 'knowledge', 'similar', query, limit],
    queryFn: () =>
      similarKnowledge({ query: query!.trim(), limit } satisfies KnowledgeSimilarRequest),
    enabled,
  });
}

export function useCreateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: KnowledgeCreatePayload) => createKnowledge(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['platform', 'knowledge'] });
      void qc.invalidateQueries({ queryKey: ['scorpius', 'knowledge'] });
    },
  });
}

// --- Learning ---

export function useLearningList() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['platform', 'learning'],
    queryFn: fetchLearningList,
    refetchInterval,
  });
}

export function useLearningStats() {
  return useQuery({
    queryKey: ['platform', 'learning', 'stats'],
    queryFn: fetchLearningStats,
  });
}

export function useLearningRankings() {
  return useQuery({
    queryKey: ['platform', 'learning', 'rankings'],
    queryFn: fetchLearningRankings,
  });
}

export function useLearningForIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['platform', 'learning', 'incident', incidentId],
    queryFn: () => (incidentId ? fetchLearningForIncident(incidentId) : []),
    enabled: !!incidentId,
  });
}

export function useLearningDetail(learningId: string | undefined) {
  return useQuery({
    queryKey: ['platform', 'learning', learningId],
    queryFn: () => (learningId ? fetchLearningById(learningId) : null),
    enabled: !!learningId,
  });
}

export function useApplyLearning() {
  return useMutation({
    mutationFn: (body: LearningApplyRequest) => applyLearning(body),
  });
}

export function useCreateLearning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LearningCreatePayload) => createLearning(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['platform', 'learning'] });
      void qc.invalidateQueries({
        queryKey: ['platform', 'learning', 'incident', vars.incident_id],
      });
    },
  });
}

export function useLearningFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      learningId,
      payload,
    }: {
      learningId: string;
      payload: LearningFeedbackPayload;
    }) => submitLearningFeedback(learningId, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['platform', 'learning'] });
      void qc.invalidateQueries({
        queryKey: ['platform', 'learning', data.learning_record.learning_id],
      });
      void qc.invalidateQueries({
        queryKey: ['platform', 'learning', 'incident', data.learning_record.incident_id],
      });
    },
  });
}

// --- Evaluation ---

export function useEvaluations() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['platform', 'evaluation'],
    queryFn: fetchEvaluations,
    refetchInterval,
  });
}

export function useEvaluationHistory() {
  return useQuery({
    queryKey: ['platform', 'evaluation', 'history'],
    queryFn: fetchEvaluationHistory,
  });
}

export function useEvaluationDetail(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['platform', 'evaluation', evaluationId],
    queryFn: () => (evaluationId ? fetchEvaluationById(evaluationId) : null),
    enabled: !!evaluationId,
  });
}

export function useRunEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EvaluationRunRequest) => runEvaluation(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['platform', 'evaluation'] });
    },
  });
}
