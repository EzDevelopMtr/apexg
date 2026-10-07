import type {
  CompanyChange,
  CreatedCompany,
  IssuedCredential,
  NewCompany,
  NewPlatformUser,
  PlatformCompany,
  PlatformRole,
  PlatformSetting,
  PlatformSettingKey,
  PlatformUser,
  PlatformUserChange,
} from "@apexg/core";
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

  async create(company: NewCompany): Promise<CreatedCompany> {
    const result = await platformFetch<{ companyId: string; administrator: IssuedCredential }>(
      "/companies",
      json("POST", company),
    );
    return { id: result.companyId, credential: result.administrator };
  }

  update(id: string, change: CompanyChange): Promise<void> {
    return platformFetch(`/companies/${id}`, json("PATCH", change));
  }

  uploadLogo(id: string, logo: Blob): Promise<void> {
    const form = new FormData();
    form.append("logo", logo);
    return platformFetch(`/companies/${id}/logo`, { method: "POST", body: form });
  }

  listUsers(companyId: string): Promise<readonly PlatformUser[]> {
    return platformFetch(`/companies/${companyId}/users`);
  }

  listRoles(companyId: string): Promise<readonly PlatformRole[]> {
    return platformFetch(`/companies/${companyId}/roles`);
  }

  createUser(
    companyId: string,
    user: NewPlatformUser,
  ): Promise<{ user: PlatformUser; credential: IssuedCredential }> {
    return platformFetch(`/companies/${companyId}/users`, json("POST", user));
  }

  updateUser(companyId: string, userId: string, change: PlatformUserChange): Promise<void> {
    return platformFetch(`/companies/${companyId}/users/${userId}`, json("PATCH", change));
  }

  resetUserPassword(companyId: string, userId: string): Promise<IssuedCredential> {
    return platformFetch(`/companies/${companyId}/users/${userId}/password`, { method: "POST" });
  }

  listSettings(): Promise<readonly PlatformSetting[]> {
    return platformFetch("/settings");
  }

  setGeneral(key: PlatformSettingKey, value: unknown, enforced: boolean): Promise<void> {
    return platformFetch(`/settings/${key}`, json("PUT", { value, enforced }));
  }

  clearGeneral(key: PlatformSettingKey): Promise<void> {
    return platformFetch(`/settings/${key}`, { method: "DELETE" });
  }

  setOverride(key: PlatformSettingKey, companyId: string, value: unknown): Promise<void> {
    return platformFetch(`/settings/${key}/companies/${companyId}`, json("PUT", { value }));
  }

  clearOverride(key: PlatformSettingKey, companyId: string): Promise<void> {
    return platformFetch(`/settings/${key}/companies/${companyId}`, { method: "DELETE" });
  }
}
