import { apiGet } from './client';
import type {
  InterfaceRecord,
  InterfacesResponse,
  InterfacesSummaryResponse,
} from '../types/netapp';

export function fetchInterfacesSummary(): Promise<InterfacesSummaryResponse> {
  return apiGet<InterfacesSummaryResponse>('/api/netapp/interfaces/summary');
}

export async function fetchInterfaces(): Promise<InterfaceRecord[]> {
  const response = await apiGet<InterfacesResponse>('/api/netapp/interfaces');
  return response.data?.records ?? [];
}
