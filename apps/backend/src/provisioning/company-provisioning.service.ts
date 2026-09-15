import { Inject, Injectable } from '@nestjs/common';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import {
  companies,
  expenseCategories,
  membershipTypes,
  permissions,
  rolePermissions,
  roles,
} from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';

import {
  ADMINISTRATOR_ROLE,
  EXPENSE_CATEGORY_SEED,
  MEMBERSHIP_TYPE_SEED,
  RECEPTIONIST_PERMISSION_CODES,
  RECEPTIONIST_ROLE,
} from './company-provisioning.constants.js';
import type {
  ProvisionCompanyInput,
  ProvisionCompanyResult,
} from './company-provisioning.types.js';

type PermissionRow = { id: number; code: string };

/**
 * Aprovisionamiento base de una empresa: crea la `company` y toda su
 * configuración inicial (roles, permisos de rol, tipos de membresía,
 * categorías de egreso) en UNA sola transacción atómica.
 *
 * No crea `users` ni `platform_admins` (etapa de autenticación).
 * No usa los seeds SQL en runtime: replica su especificación vía Drizzle.
 * No usa `ON CONFLICT`: si una restricción UNIQUE falla, la transacción
 * completa hace rollback (no se ocultan errores con upsert).
 */
@Injectable()
export class CompanyProvisioningService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async provisionCompany(
    input: ProvisionCompanyInput,
  ): Promise<ProvisionCompanyResult> {
    return this.db.transaction(async (tx) => {
      const { allPermissions, receptionistPermissions } = await this.resolvePermissions(tx);
      const companyId = await this.insertCompany(tx, input);
      const { administratorRoleId, receptionistRoleId } = await this.insertRoles(tx, companyId);

      await this.grantRolePermissions(tx, administratorRoleId, allPermissions);
      await this.grantRolePermissions(tx, receptionistRoleId, receptionistPermissions);
      await this.seedMembershipTypes(tx, companyId);
      await this.seedExpenseCategories(tx, companyId);

      return {
        companyId,
        administratorRoleId,
        receptionistRoleId,
        administratorPermissions: allPermissions.length,
        receptionistPermissions: receptionistPermissions.length,
        membershipTypes: MEMBERSHIP_TYPE_SEED.length,
        expenseCategories: EXPENSE_CATEGORY_SEED.length,
      };
    });
  }

  /** 1. Valida el catálogo global de permisos y resuelve los 12 de Recepcionista por code. */
  private async resolvePermissions(tx: DatabaseTransaction): Promise<{
    allPermissions: PermissionRow[];
    receptionistPermissions: PermissionRow[];
  }> {
    const permissionRows = await tx
      .select({ id: permissions.id, code: permissions.code })
      .from(permissions);

    if (permissionRows.length === 0) {
      throw new Error(
        'El catálogo global de permisos está vacío: ejecutar 002_seed_modules_permissions.sql antes de aprovisionar una empresa.',
      );
    }

    const allPermissions = permissionRows.filter((p): p is PermissionRow => p.code !== null);
    if (allPermissions.length !== permissionRows.length) {
      throw new Error('El catálogo global de permisos tiene registros con code nulo.');
    }

    const receptionistCodes = new Set<string>(RECEPTIONIST_PERMISSION_CODES);
    const receptionistPermissions = allPermissions.filter((p) => receptionistCodes.has(p.code));

    if (receptionistPermissions.length !== RECEPTIONIST_PERMISSION_CODES.length) {
      const found = new Set(receptionistPermissions.map((p) => p.code));
      const missing = RECEPTIONIST_PERMISSION_CODES.filter((code) => !found.has(code));
      throw new Error(
        `El catálogo global de permisos está incompleto. Faltan permisos de Recepcionista: ${missing.join(', ')}`,
      );
    }

    return { allPermissions, receptionistPermissions };
  }

  /** 2. Crea la empresa. El id lo genera PostgreSQL (gen_random_uuid()). */
  private async insertCompany(
    tx: DatabaseTransaction,
    input: ProvisionCompanyInput,
  ): Promise<string> {
    const [insertedCompany] = await tx
      .insert(companies)
      .values({
        name: input.name,
        legalName: input.legalName ?? null,
        currency: input.currency ?? null,
        timezone: input.timezone ?? null,
        logoPath: input.logoPath ?? null,
        primaryColor: input.primaryColor ?? null,
        secondaryColor: input.secondaryColor ?? null,
        accentColor: input.accentColor ?? null,
      })
      .returning({ id: companies.id });

    return assertDefined(insertedCompany, 'INSERT into companies did not return a row.').id;
  }

  /** 3. Crea los dos roles base de la empresa. */
  private async insertRoles(
    tx: DatabaseTransaction,
    companyId: string,
  ): Promise<{ administratorRoleId: number; receptionistRoleId: number }> {
    const createdRoles = await tx
      .insert(roles)
      .values([
        {
          companyId,
          name: ADMINISTRATOR_ROLE.name,
          description: ADMINISTRATOR_ROLE.description,
          state: ADMINISTRATOR_ROLE.state,
        },
        {
          companyId,
          name: RECEPTIONIST_ROLE.name,
          description: RECEPTIONIST_ROLE.description,
          state: RECEPTIONIST_ROLE.state,
        },
      ])
      .returning({ id: roles.id, name: roles.name });

    return {
      administratorRoleId: this.roleIdByName(createdRoles, ADMINISTRATOR_ROLE.name),
      receptionistRoleId: this.roleIdByName(createdRoles, RECEPTIONIST_ROLE.name),
    };
  }

  /** 4/5. Asigna un lote de permisos globales a un rol. */
  private async grantRolePermissions(
    tx: DatabaseTransaction,
    roleId: number,
    grantedPermissions: readonly { id: number }[],
  ): Promise<void> {
    await tx.insert(rolePermissions).values(
      grantedPermissions.map((p) => ({ roleId, permissionId: p.id })),
    );
  }

  /** 6. Tipos de membresía base (9). */
  private async seedMembershipTypes(tx: DatabaseTransaction, companyId: string): Promise<void> {
    await tx.insert(membershipTypes).values(
      MEMBERSHIP_TYPE_SEED.map((m) => ({
        companyId,
        name: m.name,
        price: m.price,
        description: m.description,
        durationValue: m.durationValue,
        durationUnit: m.durationUnit,
        minimumPayment: m.minimumPayment,
        trainerShare: m.trainerShare,
        businessShare: m.businessShare,
        allowsPartialPayment: m.allowsPartialPayment,
        isPromotional: m.isPromotional,
        state: m.state,
      })),
    );
  }

  /** 7. Categorías de egreso base (4). */
  private async seedExpenseCategories(tx: DatabaseTransaction, companyId: string): Promise<void> {
    await tx.insert(expenseCategories).values(
      EXPENSE_CATEGORY_SEED.map((e) => ({
        companyId,
        name: e.name,
        description: e.description,
        state: e.state,
      })),
    );
  }

  private roleIdByName(
    createdRoles: { id: number; name: string | null }[],
    name: string,
  ): number {
    const role = createdRoles.find((r) => r.name === name);
    if (!role) {
      throw new Error(`No se pudo crear el rol "${name}".`);
    }
    return role.id;
  }
}
