import { createParamDecorator, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import type { AuthenticatedPlatformAdmin, PlatformRequest } from './platform.types.js';

/** El super admin que `PlatformTokenGuard` ya validó. */
export const CurrentPlatformAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPlatformAdmin => {
    const admin = context.switchToHttp().getRequest<PlatformRequest>().platformAdmin;
    if (!admin) throw new UnauthorizedException('No autorizado');
    return admin;
  },
);
