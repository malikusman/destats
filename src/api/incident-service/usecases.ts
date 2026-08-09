import { incidentGet, incidentPatch, incidentPost } from './client';
import type {
  UseCase,
  UseCaseCreatePayload,
  UseCasePatchPayload,
} from '../../types/platform-api';

function asUseCaseList(data: unknown): UseCase[] {
  if (Array.isArray(data)) return data as UseCase[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['usecases', 'items', 'records', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as UseCase[];
    }
  }
  return [];
}

export async function fetchUseCases(): Promise<UseCase[]> {
  const data = await incidentGet<unknown>('/usecases');
  return asUseCaseList(data);
}

export async function searchUseCases(query: string): Promise<UseCase[]> {
  const data = await incidentGet<unknown>(`/usecases/search?q=${encodeURIComponent(query)}`);
  return asUseCaseList(data);
}

export function fetchUseCaseById(id: number | string): Promise<UseCase> {
  return incidentGet<UseCase>(`/usecases/${encodeURIComponent(String(id))}`);
}

export function createUseCase(payload: UseCaseCreatePayload): Promise<UseCase> {
  return incidentPost<UseCase>('/usecases', payload);
}

export function patchUseCase(id: number | string, payload: UseCasePatchPayload): Promise<UseCase> {
  return incidentPatch<UseCase>(`/usecases/${encodeURIComponent(String(id))}`, payload);
}

export function submitUseCase(id: number | string): Promise<UseCase> {
  return incidentPatch<UseCase>(`/usecases/${encodeURIComponent(String(id))}/submit`, {});
}

export function approveUseCase(id: number | string): Promise<UseCase> {
  return incidentPatch<UseCase>(`/usecases/${encodeURIComponent(String(id))}/approve`, {});
}

export function archiveUseCase(id: number | string): Promise<UseCase> {
  return incidentPatch<UseCase>(`/usecases/${encodeURIComponent(String(id))}/archive`, {});
}

export async function exportUseCases(): Promise<unknown> {
  return incidentGet('/usecases/export');
}

export async function importUseCases(payload: unknown): Promise<unknown> {
  return incidentPost('/usecases/import', payload);
}

export async function fetchUseCaseVersions(id: number | string): Promise<unknown[]> {
  const data = await incidentGet<unknown>(`/usecases/${encodeURIComponent(String(id))}/versions`);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.records)) return obj.records;
    if (Array.isArray(obj.versions)) return obj.versions;
  }
  return [];
}

export async function fetchUseCaseIncidents(id: number | string): Promise<string[]> {
  const data = await incidentGet<unknown>(`/usecases/${encodeURIComponent(String(id))}/incidents`);
  if (Array.isArray(data)) return data.map(String);
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['historical_incidents', 'incident_ids', 'incidents', 'records']) {
      if (Array.isArray(obj[key])) return (obj[key] as unknown[]).map(String);
    }
  }
  return [];
}

export async function fetchUseCaseRelated(id: number | string): Promise<UseCase[]> {
  const data = await incidentGet<unknown>(`/usecases/${encodeURIComponent(String(id))}/related`);
  return asUseCaseList(data);
}
