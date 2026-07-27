import { useQuery } from '@tanstack/react-query';
import { useRefreshInterval as useRefreshCtx } from './RefreshContext';
import {
  fetchIncidentById,
  fetchIncidentList,
  fetchIncidentAssets,
  fetchIncidentSignals,
  fetchIncidentRecommendations,
  fetchIncidentStats,
  fetchIncidentTimeline,
  fetchRelatedIncidents,
} from '../api/incident-service/incidents';

function useRefreshInterval() {
  const { option } = useRefreshCtx();
  return option.interval;
}

export function useIncidentList() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['incident-service', 'incidents'],
    queryFn: fetchIncidentList,
    refetchInterval,
  });
}

export function useIncidentStats() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['incident-service', 'stats'],
    queryFn: fetchIncidentStats,
    refetchInterval,
  });
}

export function useIncidentSignals() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['incident-service', 'signals'],
    queryFn: fetchIncidentSignals,
    refetchInterval,
  });
}

export function useIncidentDetail(id: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['incident-service', 'incident', id],
    queryFn: () => (id ? fetchIncidentById(id) : null),
    enabled: !!id,
    refetchInterval,
  });
}

export function useIncidentTimeline(id: string | undefined) {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['incident-service', 'timeline', id],
    queryFn: () => (id ? fetchIncidentTimeline(id) : []),
    enabled: !!id,
    refetchInterval,
  });
}

export function useRelatedIncidents(id: string | undefined) {
  return useQuery({
    queryKey: ['incident-service', 'related', id],
    queryFn: () => (id ? fetchRelatedIncidents(id) : []),
    enabled: !!id,
  });
}

export function useIncidentRecommendations(id: string | undefined) {
  return useQuery({
    queryKey: ['incident-service', 'recommendations', id],
    queryFn: () => (id ? fetchIncidentRecommendations(id) : []),
    enabled: !!id,
  });
}

export function useIncidentAssets(id: string | undefined) {
  return useQuery({
    queryKey: ['incident-service', 'assets', id],
    queryFn: () => (id ? fetchIncidentAssets(id) : []),
    enabled: !!id,
  });
}
