import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PlatformPanel from "../../components/platform-panel";
import { callBackend } from "../../lib/backend-client";
import { readPlatformCookie } from "../../lib/platform-cookie";

export const metadata: Metadata = { title: { absolute: "Gimnasios | Panel de plataforma" } };

/** A proxy chain can send "a, b": the first value is the one the visitor used. */
const first = (value: string | null): string | undefined => value?.split(",")[0]?.trim() || undefined;

/** Local and private-network hosts are reached over plain http. */
const LOCAL_HOST = /^(localhost|127\.|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * The address a gym's people use: `PUBLIC_BASE_URL` when set (the public
 * link, even if the panel was opened on localhost), else the address this
 * request came in on.
 */
async function publicBaseUrl(): Promise<string> {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const incoming = await headers();
  const host = first(incoming.get("x-forwarded-host")) ?? first(incoming.get("host")) ?? "localhost:3000";
  const proto = first(incoming.get("x-forwarded-proto")) ?? (LOCAL_HOST.test(host) ? "http" : "https");
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
