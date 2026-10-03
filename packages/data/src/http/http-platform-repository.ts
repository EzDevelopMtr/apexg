import type { CompanyChange, IssuedCredential, NewCompany, PlatformCompany } from "@apexg/core";
import type { PlatformRepository } from "../platform";
import { ApiError } from "./http-client";

/**
 * Same-origin proxy that attaches the super admin's token server-side (see
 * `apps/frontend/app/api/platform/[...path]/route.ts`). Kept apart from
 * `apiFetch` on purpose: a 401 here must send the super admin to their own
 * login, never sign a gym's session out.
 */
const PLATFORM_BASE = "/api/platform";

async function platformFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PLATFORM_BASE}${path}`, init);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/admin/login");
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : `Error ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return body as T;
}

function json(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export class HttpPlatformRepository implements PlatformRepository {
  list(): Promise<readonly PlatformCompany[]> {
    return platformFetch("/companies");
  }

  async create(company: NewCompany): Promise<IssuedCredential> {
    const result = await platformFetch<{ administrator: IssuedCredential }>(
      "/companies",
      json("POST", company),
    );
    return result.administrator;
  }

  update(id: string, change: CompanyChange): Promise<void> {
    return platformFetch(`/companies/${id}`, json("PATCH", change));
  }

  uploadLogo(id: string, logo: Blob): Promise<void> {
    const form = new FormData();
    form.append("logo", logo);
    return platformFetch(`/companies/${id}/logo`, { method: "POST", body: form });
  }

  resetAdministratorPassword(id: string): Promise<IssuedCredential> {
    return platformFetch(`/companies/${id}/admin-password`, { method: "POST" });
  }
}
