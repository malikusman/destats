const BASE_URL: string =
  import.meta.env.VITE_CONTROL_PLANE_API_BASE_URL ?? '/control-plane-api';

export class ControlPlaneApiError extends Error {
  readonly statusCode: number;
  readonly path: string;

  constructor(message: string, path: string, statusCode: number) {
    super(message);
    this.name = 'ControlPlaneApiError';
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
    throw new ControlPlaneApiError(
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
    throw new ControlPlaneApiError(
      `Request failed with HTTP ${response.status}${detail}`,
      path,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function controlPlaneGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function controlPlanePost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
