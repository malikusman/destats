import { apiGet } from './client';
import type { HealthResponse } from '../types/netapp';

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}
