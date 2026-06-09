import { apiGet, cursorFromNextLink } from './client';
import type {
  EmsEventsResponse,
  EmsErrorsResponse,
  EmsPage,
  EmsSummaryResponse,
} from '../types/netapp';

export function fetchEmsSummary(): Promise<EmsSummaryResponse> {
  return apiGet<EmsSummaryResponse>('/api/netapp/ems/summary');
}

/**
 * /api/netapp/ems nests records under `data.records` with a pagination
 * cursor in `data._links.next`. Normalizes to EmsPage.
 */
export async function fetchEmsEvents(cursor?: string | null): Promise<EmsPage> {
  const path = `/api/netapp/ems${cursor ?? ''}`;
  const response = await apiGet<EmsEventsResponse>(path);
  return {
    events: response.data?.records ?? [],
    nextCursor: cursorFromNextLink(response.data?._links?.next?.href),
    fetchedAt: response.fetched_at,
  };
}

/**
 * /api/netapp/ems/errors puts records at the top level (different envelope).
 * Normalizes to the same EmsPage shape.
 */
export async function fetchEmsErrors(): Promise<EmsPage> {
  const response = await apiGet<EmsErrorsResponse>('/api/netapp/ems/errors');
  return {
    events: response.records ?? [],
    nextCursor: null,
    fetchedAt: response.fetched_at,
  };
}
