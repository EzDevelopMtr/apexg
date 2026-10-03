import "server-only";
import { NextResponse } from "next/server";
import { callBackendRaw } from "./backend-client";

const WITHOUT_BODY = new Set(["GET", "DELETE"]);

/**
 * Forwards a browser request to the backend with a token read server-side.
 *
 * Nothing here parses the payload: bytes and content type pass through in
 * both directions, so multipart goes up and images come down intact.
 *
 * This is NOT the authorization boundary — it forwards the caller's own
 * token as-is, and the backend's guards decide what that token may do.
 */
export async function forwardToBackend(
  request: Request,
  backendPath: string,
  accessToken: string | undefined,
): Promise<Response> {
  if (!accessToken) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const method = request.method;
  const hasBody = !WITHOUT_BODY.has(method);
  const upstream = await callBackendRaw(backendPath, {
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
