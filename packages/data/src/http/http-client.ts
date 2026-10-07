/**
 * Shared fetch wrapper for every HTTP repository.
 *
 * Calls go to `/<gym>/api/backend/...` — a same-origin proxy in
 * `apps/frontend` that attaches that gym's access token server-side from an
 * httpOnly cookie (see `apps/frontend/app/[gym]/api/backend/[...path]/route.ts`).
 * No repository here ever sees a token; that boundary lives in the web app.
 */

const GYM_SEGMENT = /^[a-z0-9-]+$/;

/**
 * The proxy of the gym this tab belongs to — the first segment of its
 * address (`/<gym>/modules/...`). Read on every call, never cached: a tab can
 * only ever reach the gym it shows, whatever another tab signed into.
 */
export function apiBase(): string {
  const gym = typeof window === "undefined" ? "" : (window.location.pathname.split("/")[1] ?? "");
  // Outside a gym (server render, a stray page) there is no proxy to reach.
  if (!GYM_SEGMENT.test(gym)) throw new ApiError(401, "Sin gimnasio en la dirección.");
  return `/${gym}/api/backend`;
}

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
  /**
   * Sent instead of `body` when the request carries a file.
   *
   * No `Content-Type` is set for it on purpose: only the browser knows the
   * multipart boundary it generated, and naming the type by hand drops that
   * parameter, leaving the server one unparseable blob.
   */
  readonly formData?: FormData;
  /** `undefined` values are omitted, so an optional filter can be passed through as-is. */
  readonly searchParams?: Record<string, string | undefined>;
}

function buildUrl(
  path: string,
  searchParams?: Record<string, string | undefined>,
): string {
  if (!searchParams) {
    return `${apiBase()}${path}`;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) params.set(key, value);
  }
  const query = params.toString();
  const base = apiBase();
  return query ? `${base}${path}?${query}` : `${base}${path}`;
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
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.searchParams), {
    method: options.method ?? "GET",
    headers:
      options.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      options.formData ??
      (options.body === undefined ? undefined : JSON.stringify(options.body)),
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
    throw new ApiError(
      response.status,
      backendMessage(body, `Error ${response.status}`),
    );
  }

  return body as T;
}
