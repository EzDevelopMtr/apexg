import { NextResponse } from "next/server";
import { callBackend } from "../../../../lib/backend-client";
import { readSessionCookie } from "../../../../lib/auth-cookie";

/**
 * Transparent proxy to the real backend for every business-module request.
 *
 * The HTTP repositories (`packages/data/src/http/`) fetch `/api/backend/...`
 * — same origin, so the browser never needs (and never has) the access
 * token. This handler reads it from the httpOnly cookie and attaches
 * `Authorization` server-side before forwarding.
 *
 * This is NOT the authorization boundary — it forwards the caller's own
 * token as-is. The backend's guards decide what that token may do, exactly
 * as if the caller had called it directly.
 */

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(
  request: Request,
  context: RouteContext,
  method: string,
): Promise<NextResponse> {
  const accessToken = await readSessionCookie();
  if (!accessToken) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { path } = await context.params;
  const backendPath = `/${path.join("/")}`;

  let body: unknown;
  if (method !== "GET" && method !== "DELETE") {
    const text = await request.text();
    body = text.length > 0 ? JSON.parse(text) : undefined;
  }

  const result = await callBackend(backendPath, {
    method,
    accessToken,
    body,
    searchParams: new URL(request.url).searchParams,
  });

  // A 204 must carry no body — re-wrapping `null` as JSON would violate that.
  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, context, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, context, "POST");
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context, "PATCH");
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxy(request, context, "DELETE");
}
