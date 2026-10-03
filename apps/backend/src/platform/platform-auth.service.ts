import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// Value imports: constructor-injected (see the note in access-token.guard.ts).
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';

import { LoginRateLimiterService } from '../auth/login-rate-limiter.service.js';
import { PasswordHasherService } from '../auth/password-hasher.service.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { platformAdmins } from '../database/schema/schema.js';
import { temporaryPassword } from '../shared/temporary-password.js';

import {
  PLATFORM_AUDIENCE,
  PLATFORM_TOKEN_EXPIRES_IN,
  PLATFORM_TOKEN_EXPIRES_IN_SECONDS,
} from './platform.types.js';
import type { PlatformLoginResult, PlatformTokenPayload } from './platform.types.js';

const INVALID_CREDENTIALS = 'Credenciales inválidas';

/** Inicio de sesión y alta de super admins. */
@Injectable()
export class PlatformAuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly hasher: PasswordHasherService,
    private readonly jwt: JwtService,
    private readonly rateLimiter: LoginRateLimiterService,
  ) {}

  async login(rawEmail: string, password: string): Promise<PlatformLoginResult> {
    const email = rawEmail.trim().toLowerCase();
    // Prefijo propio: no comparte contador con un usuario de gimnasio.
    const key = `platform:${email}`;
    this.rateLimiter.assertNotLocked(key);

    const [admin] = await this.db
      .select()
      .from(platformAdmins)
      .where(eq(platformAdmins.email, email));
    const ok = admin && admin.state === 1 && (await this.hasher.verify(admin.password, password));
    if (!admin || !ok) {
      this.rateLimiter.recordFailure(key);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    this.rateLimiter.recordSuccess(key);

    const payload: PlatformTokenPayload = { sub: admin.id, email: admin.email };
    return {
      accessToken: await this.jwt.signAsync(payload, {
        audience: PLATFORM_AUDIENCE,
        expiresIn: PLATFORM_TOKEN_EXPIRES_IN,
      }),
      tokenType: 'Bearer',
      expiresIn: PLATFORM_TOKEN_EXPIRES_IN_SECONDS,
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
    };
  }

  /** Crea un super admin y devuelve su contraseña inicial (se muestra una vez). */
  async create(rawEmail: string, fullName: string): Promise<string> {
    const password = temporaryPassword();
    await this.db.insert(platformAdmins).values({
      email: rawEmail.trim().toLowerCase(),
      fullName: fullName.trim(),
      password: await this.hasher.hash(password),
    });
    return password;
  }
}
