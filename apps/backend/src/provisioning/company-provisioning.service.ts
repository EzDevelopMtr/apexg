import { Inject, Injectable } from '@nestjs/common';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import {
  companies,
  expenseCategories,
  membershipTypes,
  permissions,
  rolePermissions,
  roles,
} from '../database/schema/schema.js';

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
      // 1. Validar el catálogo global de permisos.
      const allPermissions = await tx
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions);

      if (allPermissions.length === 0) {
        throw new Error(
          'El catálogo global de permisos está vacío: ejecutar 002_seed_modules_permissions.sql antes de aprovisionar una empresa.',
        );
      }

      const receptionistCodes = new Set<string>(RECEPTIONIST_PERMISSION_CODES);
      const receptionistPermissions = allPermissions.filter(
        (p): p is { id: number; code: string } =>
          p.code !== null && receptionistCodes.has(p.code),
      );

      if (
        receptionistPermissions.length !== RECEPTIONIST_PERMISSION_CODES.length
      ) {
        const found = new Set(receptionistPermissions.map((p) => p.code));
        const missing = RECEPTIONIST_PERMISSION_CODES.filter(
          (code) => !found.has(code),
        );
        throw new Error(
          `El catálogo global de permisos está incompleto. Faltan permisos de Recepcionista: ${missing.join(', ')}`,
        );
      }

      // 2. Crear la empresa. El id lo genera PostgreSQL (gen_random_uuid()).
      const [company] = await tx
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

      const companyId = company.id;

      // 3. Crear los dos roles base de la empresa.
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

      const administratorRoleId = this.roleIdByName(
        createdRoles,
        ADMINISTRATOR_ROLE.name,
      );
      const receptionistRoleId = this.roleIdByName(
        createdRoles,
        RECEPTIONIST_ROLE.name,
      );

      // 4. Administrador -> todos los permisos globales existentes.
      await tx.insert(rolePermissions).values(
        allPermissions.map((p) => ({
          roleId: administratorRoleId,
          permissionId: p.id,
        })),
      );

      // 5. Recepcionista -> exactamente los 12 permisos resueltos por code.
      await tx.insert(rolePermissions).values(
        receptionistPermissions.map((p) => ({
          roleId: receptionistRoleId,
          permissionId: p.id,
        })),
      );

      // 6. Tipos de membresía base (9).
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

      // 7. Categorías de egreso base (4).
      await tx.insert(expenseCategories).values(
        EXPENSE_CATEGORY_SEED.map((e) => ({
          companyId,
          name: e.name,
          description: e.description,
          state: e.state,
        })),
      );

      // 8. Resultado: solo identificadores y conteos.
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
