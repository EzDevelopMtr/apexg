import type { CompanyStatus } from '../companies/companies.types.js';

/** Un gimnasio visto desde el panel del super admin. */
export interface PlatformCompanyRow {
  id: string;
  slug: string;
  name: string;
  status: CompanyStatus;
  brandColor: string | null;
  hasLogo: boolean;
  createdAt: string | null;
  activeClients: number;
  users: number;
}

/** Credencial que el super admin entrega a mano; se muestra una sola vez. */
export interface IssuedCredential {
  username: string;
  password: string;
}
