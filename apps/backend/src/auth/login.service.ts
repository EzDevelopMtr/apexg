import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { roles, users } from '../database/schema/schema.js';

import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
} from './auth.types.js';
import type {
  AccessTokenPayload,
  LoginInput,
  LoginResult,
} from './auth.types.js';
import { PasswordHasherService } from './password-hasher.service.js';

/** Único mensaje para cualquier fallo de autenticación (no filtra qué falló). */
const INVALID_CREDENTIALS = 'Credenciales inválidas';

/**
 * Login por `companyId` + `username` + `password`. Emite un access token JWT
 * (15 min). Sin refresh token, sin sesiones persistentes.
 *
 * Cualquier fallo (empresa/usuario inexistente, contraseña incorrecta,
 * usuario o rol inactivo) devuelve el MISMO `UnauthorizedException` genérico.
 */
@Injectable()
export class LoginService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly hasher: PasswordHasherService,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const username = input.username.trim().toLowerCase();

    // 1. Usuario por (company_id, username).
    const [user] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        roleId: users.roleId,
        username: users.username,
        fullName: users.fullName,
        password: users.password,
        state: users.state,
      })
      .from(users)
      .where(and(eq(users.companyId, input.companyId), eq(users.username, username)));

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // 2. Usuario activo. (companies no tiene columna `state`: no se comprueba.)
    if (user.state !== 1) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // 3. Rol del usuario: misma empresa y activo.
    const [role] = await this.db
      .select({ id: roles.id, state: roles.state })
      .from(roles)
      .where(and(eq(roles.id, user.roleId), eq(roles.companyId, user.companyId)));

    if (!role || role.state !== 1) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // 4. Contraseña.
    const passwordOk = await this.hasher.verify(user.password, input.password);
    if (!passwordOk) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // 5. Access token.
    const payload: AccessTokenPayload = {
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      username: user.username,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        username: user.username,
        fullName: user.fullName,
      },
    };
  }
}
