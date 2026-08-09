const BASE_URL: string = import.meta.env.VITE_INCIDENT_API_BASE_URL ?? '/incident-api';

export class IncidentApiError extends Error {
  readonly statusCode: number;
  readonly path: string;

  constructor(message: string, path: string, statusCode: number) {
    super(message);
    this.name = 'IncidentApiError';
    this.path = path;
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    throw new IncidentApiError(
      `Network error (${path}): ${err instanceof Error ? err.message : String(err)}`,
      path,
      0,
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = `: ${body.error}`;
    } catch {
      /* ignore */
    }
    throw new IncidentApiError(
      `Request failed with HTTP ${response.status}${detail}`,
      path,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function incidentGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function incidentPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function incidentPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

/** Multipart POST — do not set Content-Type (browser sets boundary). */
export async function incidentPostForm<T>(path: string, form: FormData): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
    });
  } catch (err) {
    throw new IncidentApiError(
      `Network error (${path}): ${err instanceof Error ? err.message : String(err)}`,
      path,
      0,
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: string; detail?: unknown };
      if (body.error) detail = `: ${body.error}`;
      else if (typeof body.detail === 'string') detail = `: ${body.detail}`;
    } catch {
      /* ignore */
    }
    throw new IncidentApiError(
      `Request failed with HTTP ${response.status}${detail}`,
      path,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
