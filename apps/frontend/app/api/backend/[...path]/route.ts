import { NextResponse } from "next/server";
import { callBackendRaw } from "../../../../lib/backend-client";
import { readSessionCookie } from "../../../../lib/auth-cookie";

/**
 * Transparent proxy to the real backend for every business-module request.
 *
 * The HTTP repositories (`packages/data/src/http/`) fetch `/api/backend/...`
 * — same origin, so the browser never needs (and never has) the access
 * token. This handler reads it from the httpOnly cookie and attaches
 * `Authorization` server-side before forwarding.
 *
 * Nothing here parses the payload. It used to JSON-decode the request and
 * re-encode the reply, which quietly ruled out the two shapes a payment
 * receipt needs: multipart going up, and an image coming down. Bytes and
 * content type now pass through in both directions.
 *
 * This is NOT the authorization boundary — it forwards the caller's own
 * token as-is. The backend's guards decide what that token may do, exactly
 * as if the caller had called it directly.
 */

type RouteContext = { params: Promise<{ path: string[] }> };

const WITHOUT_BODY = new Set(["GET", "DELETE"]);

async function proxy(
  request: Request,
  context: RouteContext,
  method: string,
): Promise<Response> {
  const accessToken = await readSessionCookie();
  if (!accessToken) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { path } = await context.params;
  const hasBody = !WITHOUT_BODY.has(method);

  const upstream = await callBackendRaw(`/${path.join("/")}`, {
    method,
    accessToken,
    body: hasBody ? await request.arrayBuffer() : undefined,
    contentType: hasBody ? request.headers.get("content-type") : undefined,
    searchParams: new URL(request.url).searchParams,
  });

  // A 204 must carry no body.
  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = upstream.headers.get("content-type");
  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
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
