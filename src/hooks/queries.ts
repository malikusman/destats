import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health';
import { fetchMetaSummary } from '../api/summary';
import { fetchEmsErrors, fetchEmsEvents, fetchEmsSummary } from '../api/ems';
import { fetchVolumes, fetchVolumesSummary } from '../api/volumes';
import { fetchAggregates, fetchAggregatesSummary } from '../api/aggregates';
import { fetchNodes, fetchNodesSummary } from '../api/nodes';
import { fetchInterfaces, fetchInterfacesSummary } from '../api/interfaces';
import { fetchClusterMetrics } from '../api/clusterMetrics';
import { useRefreshInterval } from './RefreshContext';

/** Cap volume pagination at 8 pages (~800 volumes) before "load more". */
export const VOLUME_PAGE_CAP = 8;

const DETAIL_STALE_TIME = 60_000;

function useSummaryInterval() {
  const { option } = useRefreshInterval();
  return option.interval;
}

// --- Summary / roll-up queries (polled at the global refresh interval) ----

export function useHealth() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval,
  });
}

export function useMetaSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['meta-summary'],
    queryFn: fetchMetaSummary,
    refetchInterval,
  });
}

export function useEmsSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['ems-summary'],
    queryFn: fetchEmsSummary,
    refetchInterval,
  });
}

export function useVolumesSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['volumes-summary'],
    queryFn: fetchVolumesSummary,
    refetchInterval,
  });
}

export function useAggregatesSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['aggregates-summary'],
    queryFn: fetchAggregatesSummary,
    refetchInterval,
  });
}

export function useNodesSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['nodes-summary'],
    queryFn: fetchNodesSummary,
    refetchInterval,
  });
}

export function useInterfacesSummary() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['interfaces-summary'],
    queryFn: fetchInterfacesSummary,
    refetchInterval,
  });
}

/** Small pre-filtered errors list; cheap enough to poll with the summaries. */
export function useEmsErrors() {
  const refetchInterval = useSummaryInterval();
  return useQuery({
    queryKey: ['ems-errors'],
    queryFn: fetchEmsErrors,
    refetchInterval,
  });
}

// --- Detail / list queries (on demand, slower cadence) ---------------------

/**
 * Stops pagination when the API returns the same cursor we just requested
 * (the ingestion API currently ignores cursors and re-serves page 1).
 */
function nextCursorIfAdvancing(
  nextCursor: string | null,
  lastCursor: string | null,
): string | null {
  return nextCursor && nextCursor !== lastCursor ? nextCursor : null;
}

export function useEmsEvents() {
  return useInfiniteQuery({
    queryKey: ['ems-events'],
    queryFn: ({ pageParam }) => fetchEmsEvents(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage, _pages, lastCursor) =>
      nextCursorIfAdvancing(lastPage.nextCursor, lastCursor),
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useVolumes() {
  const query = useInfiniteQuery({
    queryKey: ['volumes'],
    queryFn: ({ pageParam }) => fetchVolumes(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage, _pages, lastCursor) =>
      nextCursorIfAdvancing(lastPage.nextCursor, lastCursor),
    staleTime: DETAIL_STALE_TIME,
  });

  // Follow _links.next automatically up to the page cap; beyond that the
  // UI offers a manual "load more" affordance.
  const pageCount = query.data?.pages.length ?? 0;
  const { hasNextPage, isFetching, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetching && pageCount > 0 && pageCount < VOLUME_PAGE_CAP) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetching, pageCount, fetchNextPage]);

  return query;
}

export function useAggregates() {
  return useQuery({
    queryKey: ['aggregates'],
    queryFn: fetchAggregates,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: fetchNodes,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useInterfaces() {
  return useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useClusterMetrics() {
  return useQuery({
    queryKey: ['cluster-metrics'],
    queryFn: fetchClusterMetrics,
    staleTime: DETAIL_STALE_TIME,
  });
}
