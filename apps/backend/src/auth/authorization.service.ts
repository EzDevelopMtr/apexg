import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import {
  permissions,
  rolePermissions,
  roles,
} from '../database/schema/schema.js';

import { blockedModule } from '../settings/module-permissions.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { SettingsService } from '../settings/settings.service.js';

import type { PermissionCode } from './auth.types.js';

/**
 * Resuelve permisos actuales en PostgreSQL. No usa el JWT como fuente de
 * permisos ni mantiene caché: los cambios en `role_permissions` son inmediatos.
 */
@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Comprueba que un rol activo de la empresa tenga TODOS los códigos pedidos.
   * Una lista vacía no exige autorización adicional.
   */
  async hasPermissions(
    companyId: string,
    roleId: number,
    requiredPermissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const required = [...new Set(requiredPermissions)];
    if (required.length === 0) {
      return true;
    }

    // Un módulo apagado para este gimnasio (ajuste `modules.enabled`) se
    // cierra aquí, en un solo punto, y no solo se esconde en la grilla.
    const { 'modules.enabled': enabled } = await this.settings.forCompany(companyId);
    if (required.some((code) => blockedModule(code, enabled))) {
      return false;
    }

    const granted = await this.db
      .select({ code: permissions.code })
      .from(roles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(roles.id, roleId),
          eq(roles.companyId, companyId),
          eq(roles.state, 1),
          inArray(permissions.code, required),
        ),
      );

    const grantedCodes = new Set(
      granted.flatMap(({ code }) => (code === null ? [] : [code])),
    );
    return required.every((code) => grantedCodes.has(code));
  }
}
