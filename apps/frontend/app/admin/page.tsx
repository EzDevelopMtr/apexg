import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PlatformPanel from "../../components/platform-panel";
import { callBackend } from "../../lib/backend-client";
import { readPlatformCookie } from "../../lib/platform-cookie";

export const metadata: Metadata = { title: { absolute: "Gimnasios | Panel de plataforma" } };

/**
 * The address a gym's people use: `PUBLIC_BASE_URL` when set (the public
 * link, even if the panel was opened on localhost), else the address this
 * request came in on.
 */
async function publicBaseUrl(): Promise<string> {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const proto = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Checked here, server-side, before any HTML: proxy.ts only guards gym
 * sessions, and the backend re-checks every call anyway.
 */
export default async function PlatformPage() {
  const token = await readPlatformCookie();
  const me = token
    ? await callBackend<{ fullName: string; email: string }>("/platform/auth/me", { method: "GET", accessToken: token })
    : undefined;
  if (me?.status !== 200) redirect("/admin/login");

  return <PlatformPanel adminName={me.body.fullName} adminEmail={me.body.email} publicBaseUrl={await publicBaseUrl()} />;
}
