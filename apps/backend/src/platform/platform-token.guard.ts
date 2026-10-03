import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';

import { ACCESS_TOKEN_ALGORITHM } from '../auth/auth.types.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { platformAdmins } from '../database/schema/schema.js';

import { PLATFORM_AUDIENCE } from './platform.types.js';
import type { PlatformRequest } from './platform.types.js';

const UNAUTHORIZED = 'No autorizado';

/**
 * Rutas del super admin. Exige la audiencia `platform` (un token de gimnasio
 * no la trae) y revalida contra la base, para que desactivar a un super admin
 * corte su sesión de inmediato.
 */
@Injectable()
export class PlatformTokenGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const match = /^Bearer ([^\s]+)$/.exec(String(request.headers.authorization ?? ''));
    if (!match?.[1]) throw new UnauthorizedException(UNAUTHORIZED);

    let sub: unknown;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: unknown }>(match[1], {
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        audience: PLATFORM_AUDIENCE,
      }));
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED);
    }
    if (typeof sub !== 'string') throw new UnauthorizedException(UNAUTHORIZED);

    const [admin] = await this.db
      .select({
        id: platformAdmins.id,
        email: platformAdmins.email,
        fullName: platformAdmins.fullName,
        state: platformAdmins.state,
      })
      .from(platformAdmins)
      .where(eq(platformAdmins.id, sub));
    if (!admin || admin.state !== 1) throw new UnauthorizedException(UNAUTHORIZED);

    request.platformAdmin = { id: admin.id, email: admin.email, fullName: admin.fullName };
    return true;
  }
}
