import { forwardToBackend } from "../../../../lib/backend-proxy";
import { readPlatformCookie } from "../../../../lib/platform-cookie";

/** `/api/platform/...` → backend `/platform/...`, with the super admin's token. */

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return forwardToBackend(request, `/platform/${path.join("/")}`, await readPlatformCookie());
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
