import { apiGet } from './client';
import type { MetaSummaryResponse } from '../types/netapp';

export function fetchMetaSummary(): Promise<MetaSummaryResponse> {
  return apiGet<MetaSummaryResponse>('/api/netapp/summary');
}
