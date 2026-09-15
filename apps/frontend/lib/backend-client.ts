import "server-only";

/**
 * Talks to the real NestJS backend. Used only from Route Handlers — never
 * imported by a "use client" file, since the access token this carries in
 * `Authorization` must never reach browser JS (see lib/auth-cookie.ts).
 */

function backendUrl(): string {
  const value = process.env.BACKEND_URL;
  if (!value) {
    throw new Error("BACKEND_URL is not set (see apps/frontend/.env.local).");
  }
  return value;
}

export interface BackendResponse<T = unknown> {
  readonly status: number;
  readonly body: T;
}

/** Calls the backend and returns its status and parsed JSON body, whatever it is. */
export async function callBackend<T = unknown>(
  path: string,
  options: {
    method: string;
    accessToken?: string;
    body?: unknown;
    searchParams?: URLSearchParams;
  },
): Promise<BackendResponse<T>> {
  const url = new URL(path, backendUrl());
  if (options.searchParams) {
    url.search = options.searchParams.toString();
  }

  const response = await fetch(url, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const text = await response.text();
  const body = text.length > 0 ? (JSON.parse(text) as T) : (null as T);
  return { status: response.status, body };
}

/** The `message` field NestJS's exception filter puts on every error body. */
export function backendErrorMessage(body: unknown, fallback: string): string {
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
