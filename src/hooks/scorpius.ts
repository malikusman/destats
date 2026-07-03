import { useQuery } from '@tanstack/react-query';
import { useRefreshInterval as useRefreshCtx } from './RefreshContext';
import { fetchIncidents, fetchIncidentById } from '../api/scorpius/incidents';
import { fetchReasoningForIncident } from '../api/scorpius/aiReasoning';
import { fetchPlanForIncident } from '../api/scorpius/planning';
import { fetchExecutionStatus, fetchExecutionHistory } from '../api/scorpius/execution';
import { fetchKnowledge, fetchKnowledgeForIncident, searchKnowledge } from '../api/scorpius/knowledge';
import { fetchSystemStatus } from '../api/scorpius/systemStatus';

function useRefreshInterval() {
  const { option } = useRefreshCtx();
  return option.interval;
}

export function useIncidents() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'incidents'],
    queryFn: fetchIncidents,
    refetchInterval,
  });
}

export function useIncident(id: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'incident', id],
    queryFn: () => (id ? fetchIncidentById(id) : null),
    enabled: !!id,
    refetchInterval,
  });
}

export function useAiReasoning(incidentId: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'reasoning', incidentId],
    queryFn: () => (incidentId ? fetchReasoningForIncident(incidentId) : null),
    enabled: !!incidentId,
    refetchInterval,
  });
}

export function usePlan(incidentId: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'plan', incidentId],
    queryFn: () => (incidentId ? fetchPlanForIncident(incidentId) : null),
    enabled: !!incidentId,
    refetchInterval,
  });
}

export function useExecutionStatus(incidentId: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'execution', incidentId],
    queryFn: () => (incidentId ? fetchExecutionStatus(incidentId) : null),
    enabled: !!incidentId,
    refetchInterval,
  });
}

export function useExecutionHistory() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'execution-history'],
    queryFn: fetchExecutionHistory,
    refetchInterval,
  });
}

export function useKnowledge() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'knowledge'],
    queryFn: fetchKnowledge,
    refetchInterval,
  });
}

export function useKnowledgeForIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['scorpius', 'knowledge', 'incident', incidentId],
    queryFn: () => (incidentId ? fetchKnowledgeForIncident(incidentId) : []),
    enabled: !!incidentId,
  });
}

export function useKnowledgeSearch(query: string) {
  return useQuery({
    queryKey: ['scorpius', 'knowledge', 'search', query],
    queryFn: () => searchKnowledge(query),
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}

export function useSystemStatus() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['scorpius', 'system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval,
  });
}
