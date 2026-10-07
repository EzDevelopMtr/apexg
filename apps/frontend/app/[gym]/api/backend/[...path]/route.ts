import { NextResponse } from "next/server";
import { forwardToBackend } from "../../../../../lib/backend-proxy";
import { gymSession } from "../../../../../lib/gym-session";

/**
 * Transparent proxy to the real backend for every business-module request.
 *
 * The HTTP repositories (`packages/data/src/http/`) fetch
 * `/<gym>/api/backend/...` — same origin, so the browser never needs (and
 * never has) the access token, and the gym is the one in the tab's address:
 * the token forwarded is that gym's session or none.
 */

type RouteContext = { params: Promise<{ gym: string; path: string[] }> };

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { gym, path } = await context.params;
  const session = await gymSession(gym);
  if (!session) {
    return NextResponse.json({ message: "Gimnasio no encontrado." }, { status: 404 });
  }
  return forwardToBackend(request, `/${path.join("/")}`, session.token);
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
