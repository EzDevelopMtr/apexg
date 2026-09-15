/**
 * Shared fetch wrapper for every HTTP repository.
 *
 * Calls go to `/api/backend/...` — a same-origin proxy in `apps/web` that
 * attaches the access token server-side from an httpOnly cookie (see
 * `apps/web/app/api/backend/[...path]/route.ts`). No repository here ever
 * sees a token; that boundary lives entirely in the web app.
 */

const API_BASE = "/api/backend";

/** Carries the HTTP status so a repository can decide what it means (404 → not found, etc). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
  /** `undefined` values are omitted, so an optional filter can be passed through as-is. */
  readonly searchParams?: Record<string, string | undefined>;
}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>): string {
  if (!searchParams) {
    return `${API_BASE}${path}`;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
}

function backendMessage(body: unknown, fallback: string): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return fallback;
}

/**
 * Calls the backend proxy and returns the parsed JSON body.
 *
 * A 401 means the 15-minute access token expired mid-session (there is no
 * refresh token yet) — it signals the session provider to sign the user out
 * rather than throwing an error a component would need to render.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, options.searchParams), {
    method: options.method ?? "GET",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("apexg:session-expired"));
    }
    throw new ApiError(401, "Sesión expirada.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, backendMessage(body, `Error ${response.status}`));
  }

  return body as T;
}
