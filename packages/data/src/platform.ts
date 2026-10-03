import type { CompanyChange, IssuedCredential, NewCompany, PlatformCompany } from "@apexg/core";

/** What the super admin's panel needs from the backend. */
export interface PlatformRepository {
  list(): Promise<readonly PlatformCompany[]>;
  /** Returns the new gym's first administrator, password included. */
  create(company: NewCompany): Promise<IssuedCredential>;
  update(id: string, change: CompanyChange): Promise<void>;
  uploadLogo(id: string, logo: Blob): Promise<void>;
  resetAdministratorPassword(id: string): Promise<IssuedCredential>;
}
