import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAiLogs, fetchAiModels, fetchAiPrompts } from '../api/control-plane/ai';
import {
  checkPolicyAction,
  confidenceScore,
  evaluateIncident,
  fetchPolicyRules,
  rankRecommendations,
} from '../api/control-plane/agent-policy';
import type { CandidateAction } from '../types/control-plane';
import { useRefreshInterval as useRefreshCtx } from './RefreshContext';

function useRefreshInterval() {
  const { option } = useRefreshCtx();
  return option.interval;
}

export function useAiModels() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['control-plane', 'ai', 'models'],
    queryFn: fetchAiModels,
    refetchInterval,
  });
}

export function useAiPrompts() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['control-plane', 'ai', 'prompts'],
    queryFn: fetchAiPrompts,
    refetchInterval,
  });
}

export function useAiLogs() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['control-plane', 'ai', 'logs'],
    queryFn: fetchAiLogs,
    refetchInterval,
  });
}

export function usePolicyRules() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['control-plane', 'policy', 'rules'],
    queryFn: fetchPolicyRules,
    refetchInterval,
  });
}

export function useEvaluateIncident() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => evaluateIncident(body),
  });
}

export function useRankRecommendations() {
  return useMutation({
    mutationFn: (actions: CandidateAction[]) => rankRecommendations(actions),
  });
}

export function useConfidenceScore() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => confidenceScore(body),
  });
}

export function useCheckPolicyAction() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => checkPolicyAction(body),
  });
}
