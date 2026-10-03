/**
 * A gym as a tenant of the platform — what the super admin manages. Never
 * carries a gym's business data: the platform administers gyms, it does not
 * read their clients or money.
 */

export type CompanyStatus = "active" | "suspended";

export interface PlatformCompany {
  readonly id: string;
  /** Its entrance: `<link>/<slug>`. */
  readonly slug: string;
  readonly name: string;
  readonly status: CompanyStatus;
  readonly brandColor: string | null;
  readonly hasLogo: boolean;
  readonly createdAt: string | null;
  readonly activeClients: number;
  readonly users: number;
}

/** A username and password the super admin hands over; shown once. */
export interface IssuedCredential {
  readonly username: string;
  readonly password: string;
}

export interface NewCompany {
  readonly name: string;
  readonly slug: string;
  readonly adminUsername: string;
  readonly adminFullName: string;
  readonly brandColor?: string;
}

export interface CompanyChange {
  readonly name?: string;
  readonly slug?: string;
  readonly status?: CompanyStatus;
  /** `null` returns to the default colours. */
  readonly brandColor?: string | null;
}
