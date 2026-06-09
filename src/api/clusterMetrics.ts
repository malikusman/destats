import { apiGet } from './client';
import type {
  ClusterMetricRecord,
  ClusterMetricsResponse,
} from '../types/netapp';

export async function fetchClusterMetrics(): Promise<ClusterMetricRecord[]> {
  const response = await apiGet<ClusterMetricsResponse>(
    '/api/netapp/cluster-metrics',
  );
  return response.data?.records ?? [];
}
