import { apiGet, cursorFromNextLink } from './client';
import type {
  VolumesPage,
  VolumesResponse,
  VolumesSummaryResponse,
} from '../types/netapp';

export function fetchVolumesSummary(): Promise<VolumesSummaryResponse> {
  return apiGet<VolumesSummaryResponse>('/api/netapp/volumes/summary');
}

export async function fetchVolumes(cursor?: string | null): Promise<VolumesPage> {
  const path = `/api/netapp/volumes${cursor ?? ''}`;
  const response = await apiGet<VolumesResponse>(path);
  return {
    volumes: response.data?.records ?? [],
    nextCursor: cursorFromNextLink(response.data?._links?.next?.href),
  };
}
