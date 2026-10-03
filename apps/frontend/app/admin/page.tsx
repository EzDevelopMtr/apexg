import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlatformPanel from "../../components/platform-panel";
import { callBackend } from "../../lib/backend-client";
import { readPlatformCookie } from "../../lib/platform-cookie";

export const metadata: Metadata = { title: { absolute: "Gimnasios | Panel de plataforma" } };

/**
 * Checked here, server-side, before any HTML: proxy.ts only guards gym
 * sessions, and the backend re-checks every call anyway.
 */
export default async function PlatformPage() {
  const token = await readPlatformCookie();
  const me = token
    ? await callBackend<{ fullName: string }>("/platform/auth/me", { method: "GET", accessToken: token })
    : undefined;
  if (me?.status !== 200) redirect("/admin/login");

  return <PlatformPanel adminName={me.body.fullName} />;
}
