import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest, PermissionCode } from './auth.types.js';
import { AuthorizationService } from './authorization.service.js';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator.js';

/**
 * Autoriza las rutas anotadas con `@RequirePermissions`. Requiere que
 * `AccessTokenGuard` ya haya autenticado el request; no verifica JWT otra vez.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<readonly PermissionCode[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }

    const allowed = await this.authorization.hasPermissions(
      user.companyId,
      user.roleId,
      requiredPermissions,
    );
    if (!allowed) {
      throw new ForbiddenException('Permiso insuficiente');
    }

    return true;
  }
}
