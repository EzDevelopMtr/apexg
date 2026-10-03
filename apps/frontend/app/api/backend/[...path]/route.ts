import { readSessionCookie } from "../../../../lib/auth-cookie";
import { forwardToBackend } from "../../../../lib/backend-proxy";

/**
 * Transparent proxy to the real backend for every business-module request.
 *
 * The HTTP repositories (`packages/data/src/http/`) fetch `/api/backend/...`
 * — same origin, so the browser never needs (and never has) the access
 * token. The gym session's token is read from its httpOnly cookie here.
 */

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return forwardToBackend(request, `/${path.join("/")}`, await readSessionCookie());
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
