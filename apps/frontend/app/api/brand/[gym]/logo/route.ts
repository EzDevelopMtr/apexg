/**
 * A gym's logo, relayed from the backend (which only listens on localhost).
 * Public: the login page shows it before anyone signs in.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gym: string }> },
): Promise<Response> {
  const { gym } = await params;
  const backend = process.env.BACKEND_URL;
  if (!backend) throw new Error("BACKEND_URL is not set (see apps/frontend/.env.local).");

  const upstream = await fetch(
    new URL(`/public/companies/${encodeURIComponent(gym)}/logo`, backend),
    { cache: "no-store" },
  );
  if (!upstream.ok) return new Response(null, { status: upstream.status });

  const headers = new Headers();
  for (const name of ["content-type", "cache-control", "x-content-type-options", "content-security-policy"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers });
}
