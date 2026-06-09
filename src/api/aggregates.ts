import { apiGet } from './client';
import type {
  AggregateRecord,
  AggregatesResponse,
  AggregatesSummaryResponse,
} from '../types/netapp';

export function fetchAggregatesSummary(): Promise<AggregatesSummaryResponse> {
  return apiGet<AggregatesSummaryResponse>('/api/netapp/aggregates/summary');
}

export async function fetchAggregates(): Promise<AggregateRecord[]> {
  const response = await apiGet<AggregatesResponse>('/api/netapp/aggregates');
  return response.data?.records ?? [];
}
