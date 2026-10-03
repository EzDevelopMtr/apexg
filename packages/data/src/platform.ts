import type {
  CompanyChange,
  IssuedCredential,
  NewCompany,
  PlatformCompany,
  PlatformSetting,
  PlatformSettingKey,
} from "@apexg/core";

/** What the super admin's panel needs from the backend. */
export interface PlatformRepository {
  list(): Promise<readonly PlatformCompany[]>;
  /** Returns the new gym's first administrator, password included. */
  create(company: NewCompany): Promise<IssuedCredential>;
  update(id: string, change: CompanyChange): Promise<void>;
  uploadLogo(id: string, logo: Blob): Promise<void>;
  resetAdministratorPassword(id: string): Promise<IssuedCredential>;
  listSettings(): Promise<readonly PlatformSetting[]>;
  /** `enforced`: the general value wins over every gym's exception. */
  setGeneral(key: PlatformSettingKey, value: unknown, enforced: boolean): Promise<void>;
  clearGeneral(key: PlatformSettingKey): Promise<void>;
  setOverride(key: PlatformSettingKey, companyId: string, value: unknown): Promise<void>;
  clearOverride(key: PlatformSettingKey, companyId: string): Promise<void>;
}
