const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api-proxy';

export class ApiError extends Error {
  readonly statusCode: number | undefined;
  readonly path: string;

  constructor(message: string, path: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.path = path;
    this.statusCode = statusCode;
  }
}

interface EnvelopeLike {
  ok?: unknown;
  status_code?: unknown;
  error?: unknown;
}

/**
 * Generic GET against the ingestion API. Throws an ApiError on HTTP failure,
 * `ok === false`, or a non-200 `status_code` in the JSON envelope.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new ApiError(
      `Network error reaching the ingestion API (${path}): ${err instanceof Error ? err.message : String(err)}`,
      path,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed with HTTP ${response.status}`,
      path,
      response.status,
    );
  }

  const body = (await response.json()) as T & EnvelopeLike;

  if (body && typeof body === 'object' && 'ok' in body && body.ok === false) {
    const code =
      typeof body.status_code === 'number' ? body.status_code : undefined;
    const detail = typeof body.error === 'string' ? `: ${body.error}` : '';
    throw new ApiError(
      `Ingestion API reported a failure for ${path}${code ? ` (status ${code})` : ''}${detail}`,
      path,
      code,
    );
  }

  if (
    body &&
    typeof body === 'object' &&
    typeof body.status_code === 'number' &&
    body.status_code !== 200
  ) {
    throw new ApiError(
      `Upstream returned status ${body.status_code} for ${path}`,
      path,
      body.status_code,
    );
  }

  return body;
}

/**
 * Extracts the query string from a raw ONTAP `_links.next.href` so it can be
 * replayed against the ingestion endpoint (e.g. "?start.keytime=...").
 */
export function cursorFromNextLink(href: string | undefined): string | null {
  if (!href) return null;
  const queryIndex = href.indexOf('?');
  return queryIndex >= 0 ? href.slice(queryIndex) : null;
}
