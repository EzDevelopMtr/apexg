import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest, AuthenticatedUser } from './auth.types.js';

/** Obtiene el usuario que `AccessTokenGuard` ya validó y adjuntó al request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException('No autorizado');
    }

    return request.user;
  },
);
