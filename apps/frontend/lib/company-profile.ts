import "server-only";
import { callBackend } from "./backend-client";

/** What `<link>/<slug>` knows about a gym before anyone signs in. */
export interface CompanyProfile {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly brandColor: string | null;
  readonly hasLogo: boolean;
  readonly status: "active" | "suspended";
}

/** `undefined` when no gym answers to that slug. */
export async function findCompanyProfile(slug: string): Promise<CompanyProfile | undefined> {
  const result = await callBackend<CompanyProfile>(
    `/public/companies/${encodeURIComponent(slug)}`,
    { method: "GET" },
  );
  return result.status === 200 ? result.body : undefined;
}
