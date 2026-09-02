import { SetMetadata } from '@nestjs/common';

import type { PermissionCode } from './auth.types.js';

/** Clave única de metadata para permisos requeridos por una ruta o controller. */
export const REQUIRED_PERMISSIONS_KEY = 'apexg:required-permissions';

/**
 * Declara permisos acumulativos: `@RequirePermissions('a', 'b')` exige a Y b.
 * Los duplicados se eliminan, sin normalizar ni alterar los códigos.
 */
export function RequirePermissions(
  ...permissions: PermissionCode[]
): MethodDecorator & ClassDecorator {
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, [...new Set(permissions)]);
}
