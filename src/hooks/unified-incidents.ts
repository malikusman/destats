import { useQuery } from '@tanstack/react-query';
import { useRefreshInterval as useRefreshCtx } from './RefreshContext';
import { fetchUnifiedIncidents } from '../api/incidents/unified';

function useRefreshInterval() {
  const { option } = useRefreshCtx();
  return option.interval;
}

export function useUnifiedIncidents() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: ['unified-incidents'],
    queryFn: fetchUnifiedIncidents,
    refetchInterval,
  });
}
