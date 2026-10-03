import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GYM_COOKIE_NAME } from "../../lib/session-cookie-name";

/**
 * The old shared entrance. Each gym now has its own (`/<slug>`): this sends
 * people to the last one used in this browser, or — while APEX GYM's staff
 * still have the old link saved — to `DEFAULT_GYM_SLUG`.
 */
export default async function LoginPage() {
  const remembered = (await cookies()).get(GYM_COOKIE_NAME)?.value;
  const slug = remembered ?? process.env.DEFAULT_GYM_SLUG;
  if (slug) redirect(`/${encodeURIComponent(slug)}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <p className="text-body-soft">Entra por el link de tu gimnasio.</p>
    </main>
  );
}
