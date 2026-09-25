import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
} from './auth.types.js';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RenewedToken,
} from './auth.types.js';

/**
 * Emite un access token nuevo para quien ya tiene uno válido.
 *
 * El token dura 15 minutos y no hay refresh token, así que una jornada de
 * recepción se quedaba sin sesión a mitad de un cobro: la primera petición
 * pasados los 15 minutos volvía 401 y la app mandaba al login. Renovar exige
 * un token todavía vigente — el guard lo comprueba antes de llegar aquí —, de
 * modo que la ventana de un token robado sigue siendo la misma.
 */
@Injectable()
export class TokenRenewalService {
  constructor(private readonly jwt: JwtService) {}

  async renew(user: AuthenticatedUser): Promise<RenewedToken> {
    // El payload se reconstruye desde el usuario que el guard acaba de leer
    // de la base, no del token viejo: si lo desactivaron o le cambiaron el
    // rol, la renovación refleja el estado de ahora.
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
    };
  }
}
