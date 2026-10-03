/** `companies.state`. A suspended company can neither sign in nor keep a session. */
export const COMPANY_STATE = {
  active: 1,
  suspended: 2,
} as const;

export type CompanyStatus = keyof typeof COMPANY_STATE;

/**
 * What the login page of `<link>/<slug>` may know about a company before
 * anyone signs in: enough to brand the page and to say it is suspended.
 * `id` is needed to sign in; it is an identifier, not a credential.
 */
export interface PublicCompanyProfile {
  id: string;
  slug: string;
  name: string;
  brandColor: string | null;
  hasLogo: boolean;
  status: CompanyStatus;
}
