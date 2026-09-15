import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { companies, roles, users } from '../database/schema/schema.js';
import { ADMINISTRATOR_ROLE } from '../provisioning/company-provisioning.constants.js';
import { assertDefined } from '../shared/assert-defined.util.js';

import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './auth.types.js';
import type {
  CreateInitialAdministratorInput,
  CreateInitialAdministratorResult,
} from './auth.types.js';
// Value import: constructor-injected, needs the real class at runtime (see
// the note in access-token.guard.ts).
import { PasswordHasherService } from './password-hasher.service.js';

/**
 * Crea el PRIMER usuario Administrador de una empresa ya aprovisionada.
 *
 * Semántica estricta: solo se ejecuta cuando la empresa no tiene aún
 * ningún usuario. La creación de usuarios adicionales será otro caso de
 * uso (`createUser`).
 *
 * El hash Argon2id se calcula ANTES de abrir la transacción (Argon2 es
 * deliberadamente costoso). Toda la validación de BD y el INSERT ocurren
 * en una única transacción. El `roleId` NUNCA viene del caller: se deriva
 * de `companyId` + rol "Administrador".
 */
@Injectable()
export class InitialAdministratorService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly hasher: PasswordHasherService,
  ) {}

  async createInitialAdministrator(
    input: CreateInitialAdministratorInput,
  ): Promise<CreateInitialAdministratorResult> {
    // 1. Validar y normalizar valores puros (sin tocar la BD).
    const username = this.normalizeUsername(input.username);
    const fullName = this.normalizeFullName(input.fullName);
    this.assertValidPassword(input.password);

    // 2. Hash FUERA de la transacción.
    const passwordHash = await this.hasher.hash(input.password);

    // 3. Transacción única: comprobaciones + INSERT.
    return this.db.transaction((tx) =>
      this.insertAdministrator(tx, input.companyId, { username, fullName, passwordHash }),
    );
  }

  private async insertAdministrator(
    tx: DatabaseTransaction,
    companyId: string,
    user: { username: string; fullName: string; passwordHash: string },
  ): Promise<CreateInitialAdministratorResult> {
    // 3a. La empresa debe existir (identidad por UUID, nunca por name).
    const [company] = await tx
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId));
    if (!company) {
      throw new Error('Company not found');
    }

    // 3b. Primer usuario: la empresa no debe tener ninguno.
    const existingUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.companyId, companyId));
    if (existingUsers.length > 0) {
      throw new Error(
        'La empresa ya tiene usuarios: createInitialAdministrator solo crea el primero.',
      );
    }

    // 3c. Rol "Administrador" de ESTA empresa, activo.
    const adminRole = await this.loadActiveAdminRole(tx, companyId);

    // 3d. Username no ocupado para esta empresa (sin ON CONFLICT).
    const [clash] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.username, user.username)));
    if (clash) {
      throw new Error('El username ya está en uso para esta empresa.');
    }

    // 3e. INSERT. id y createdAt los genera PostgreSQL.
    const [insertedRow] = await tx
      .insert(users)
      .values({
        companyId,
        username: user.username,
        fullName: user.fullName,
        password: user.passwordHash,
        roleId: adminRole.id,
        state: 1,
      })
      .returning({
        id: users.id,
        companyId: users.companyId,
        roleId: users.roleId,
        username: users.username,
        fullName: users.fullName,
      });
    const created = assertDefined(insertedRow, 'INSERT into users did not return a row.');

    return {
      userId: created.id,
      companyId: created.companyId ?? companyId,
      roleId: created.roleId ?? adminRole.id,
      username: created.username ?? user.username,
      fullName: created.fullName ?? user.fullName,
    };
  }

  private async loadActiveAdminRole(
    tx: DatabaseTransaction,
    companyId: string,
  ): Promise<{ id: number; state: number }> {
    const adminRoles = await tx
      .select({ id: roles.id, state: roles.state })
      .from(roles)
      .where(and(eq(roles.companyId, companyId), eq(roles.name, ADMINISTRATOR_ROLE.name)));
    if (adminRoles.length !== 1) {
      throw new Error(
        `Se esperaba exactamente un rol "${ADMINISTRATOR_ROLE.name}" para la empresa; encontrados: ${adminRoles.length}.`,
      );
    }
    const adminRole = assertDefined(
      adminRoles[0],
      'adminRoles.length === 1 just confirmed above.',
    );
    if (adminRole.state !== 1) {
      throw new Error(`El rol "${ADMINISTRATOR_ROLE.name}" está inactivo.`);
    }
    return adminRole;
  }

  /** trim + toLowerCase (no locale-specific). No vacío. */
  private normalizeUsername(raw: string): string {
    const normalized = raw.trim().toLowerCase();
    if (normalized.length === 0) {
      throw new Error('El username no puede estar vacío.');
    }
    return normalized;
  }

  /** trim. No vacío. Máx. 150 (columna real). */
  private normalizeFullName(raw: string): string {
    const normalized = raw.trim();
    if (normalized.length === 0) {
      throw new Error('El nombre completo no puede estar vacío.');
    }
    if (normalized.length > FULL_NAME_MAX_LENGTH) {
      throw new Error(
        `El nombre completo supera ${FULL_NAME_MAX_LENGTH} caracteres.`,
      );
    }
    return normalized;
  }

  /**
   * Política de contraseña. NO se hace trim: la contraseña se preserva
   * textualmente tal como la introdujo el usuario. Solo se valida longitud.
   */
  private assertValidPassword(password: string): void {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(
        `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      );
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(
        `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres.`,
      );
    }
  }
}
