import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq } from 'drizzle-orm';
import { isUUID } from 'class-validator';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { roles, users } from '../database/schema/schema.js';

import type {
  AccessTokenPayload,
  AuthenticatedRequest,
  AuthenticatedUser,
} from './auth.types.js';
import { ACCESS_TOKEN_ALGORITHM } from './auth.types.js';

/** Mensaje único: no revela por qué un access token no fue aceptado. */
const UNAUTHORIZED_MESSAGE = 'No autorizado';

/**
 * Valida el access token sin Passport y revalida usuario/rol contra PostgreSQL
 * para que una desactivación tenga efecto inmediato.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    let payload: unknown;
    try {
      // verifyAsync valida firma, expiración y solo permite el algoritmo emitido.
      payload = await this.jwt.verifyAsync(token, {
        algorithms: [ACCESS_TOKEN_ALGORITHM],
      });
    } catch {
      throw this.unauthorized();
    }

    if (!this.isAccessTokenPayload(payload)) {
      throw this.unauthorized();
    }

    const [user] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        roleId: users.roleId,
        username: users.username,
        fullName: users.fullName,
        state: users.state,
      })
      .from(users)
      .where(and(eq(users.id, payload.sub), eq(users.companyId, payload.companyId)));

    if (
      !user ||
      user.state !== 1 ||
      user.username !== payload.username ||
      user.roleId !== payload.roleId
    ) {
      throw this.unauthorized();
    }

    const [role] = await this.db
      .select({ id: roles.id, state: roles.state })
      .from(roles)
      .where(
        and(
          eq(roles.id, payload.roleId),
          eq(roles.companyId, payload.companyId),
        ),
      );

    if (!role || role.state !== 1) {
      throw this.unauthorized();
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      username: user.username,
      fullName: user.fullName,
    };
    request.user = authenticatedUser;

    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string') {
      throw this.unauthorized();
    }

    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) {
      throw this.unauthorized();
    }

    return match[1];
  }

  private isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.sub === 'string' &&
      isUUID(candidate.sub) &&
      typeof candidate.companyId === 'string' &&
      isUUID(candidate.companyId) &&
      typeof candidate.roleId === 'number' &&
      Number.isSafeInteger(candidate.roleId) &&
      candidate.roleId > 0 &&
      typeof candidate.username === 'string' &&
      candidate.username.length > 0
    );
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException(UNAUTHORIZED_MESSAGE);
  }
}
