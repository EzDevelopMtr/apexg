import "server-only";
import { readSessionCookie } from "./auth-cookie";
import { findCompanyProfile } from "./company-profile";
import type { CompanyProfile } from "./company-profile";
import { tokenClaims } from "./token-claims";

export interface GymSession {
  readonly profile: CompanyProfile;
  /** `undefined` when signed out of this gym — or holding another gym's token. */
  readonly token: string | undefined;
}

/**
 * The gym a `/<gym>/api/...` request is for, and its session only if it is
 * that gym's. The cookie's path already keeps other gyms' tokens away; this
 * also refuses one put there by hand, so a page can never show one gym and
 * act on another. `undefined` when no gym answers to the slug.
 */
export async function gymSession(gym: string): Promise<GymSession | undefined> {
  const profile = await findCompanyProfile(gym);
  if (!profile) return undefined;
  const token = await readSessionCookie();
  const ownToken = token && tokenClaims(token)?.companyId === profile.id ? token : undefined;
  return { profile, token: ownToken };
}
