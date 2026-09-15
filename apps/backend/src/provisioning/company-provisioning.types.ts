import type { companies } from '../database/schema/schema.js';

type CompanyInsert = typeof companies.$inferInsert;

/**
 * Datos de entrada para aprovisionar una empresa.
 *
 * Derivado de `companies.$inferInsert`. Se excluyen las columnas que
 * genera PostgreSQL (`id`, `createdAt`, `updatedAt`) y `createdBy`
 * (se resolverá cuando exista `platform_admins`).
 *
 * `companies` no tiene columnas NOT NULL sin DEFAULT, pero una empresa
 * necesita al menos un nombre: `name` se exige aquí como mínimo de
 * producto. El resto son opcionales, con la misma nullability del schema.
 */
export interface ProvisionCompanyInput {
  name: NonNullable<CompanyInsert['name']>;
  legalName?: CompanyInsert['legalName'];
  currency?: CompanyInsert['currency'];
  timezone?: CompanyInsert['timezone'];
  logoPath?: CompanyInsert['logoPath'];
  primaryColor?: CompanyInsert['primaryColor'];
  secondaryColor?: CompanyInsert['secondaryColor'];
  accentColor?: CompanyInsert['accentColor'];
}

/**
 * Resultado del aprovisionamiento. Solo identificadores y conteos:
 * sin entidades completas, sin credenciales.
 */
export interface ProvisionCompanyResult {
  companyId: string;
  administratorRoleId: number;
  receptionistRoleId: number;
  administratorPermissions: number;
  receptionistPermissions: number;
  membershipTypes: number;
  expenseCategories: number;
}
