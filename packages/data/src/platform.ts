import type {
  CompanyChange,
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

/** What the super admin's panel needs from the backend. */
export interface PlatformRepository {
  list(): Promise<readonly PlatformCompany[]>;
  /** Returns the new gym's first administrator, password included. */
  create(company: NewCompany): Promise<IssuedCredential>;
  update(id: string, change: CompanyChange): Promise<void>;
  uploadLogo(id: string, logo: Blob): Promise<void>;
  listUsers(companyId: string): Promise<readonly PlatformUser[]>;
  listRoles(companyId: string): Promise<readonly PlatformRole[]>;
  /** The password comes back once, in `credential`; the server keeps only its hash. */
  createUser(
    companyId: string,
    user: NewPlatformUser,
  ): Promise<{ user: PlatformUser; credential: IssuedCredential }>;
  updateUser(companyId: string, userId: string, change: PlatformUserChange): Promise<void>;
  resetUserPassword(companyId: string, userId: string): Promise<IssuedCredential>;
  listSettings(): Promise<readonly PlatformSetting[]>;
  /** `enforced`: the general value wins over every gym's exception. */
  setGeneral(key: PlatformSettingKey, value: unknown, enforced: boolean): Promise<void>;
  clearGeneral(key: PlatformSettingKey): Promise<void>;
  setOverride(key: PlatformSettingKey, companyId: string, value: unknown): Promise<void>;
  clearOverride(key: PlatformSettingKey, companyId: string): Promise<void>;
}
