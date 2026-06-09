import { apiGet } from './client';
import type {
  NodeRecord,
  NodesResponse,
  NodesSummaryResponse,
} from '../types/netapp';

export function fetchNodesSummary(): Promise<NodesSummaryResponse> {
  return apiGet<NodesSummaryResponse>('/api/netapp/nodes/summary');
}

export async function fetchNodes(): Promise<NodeRecord[]> {
  const response = await apiGet<NodesResponse>('/api/netapp/nodes');
  return response.data?.records ?? [];
}
