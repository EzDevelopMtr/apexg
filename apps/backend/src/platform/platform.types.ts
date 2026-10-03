/**
 * Audiencia de los tokens del super admin. Firmados con el mismo secreto que
 * los de un gimnasio, así que es la audiencia lo que los separa: el guard de
 * plataforma la exige, y el de gimnasio exige `companyId`, que estos no traen.
 */
export const PLATFORM_AUDIENCE = 'platform';

/** Sin refresh: una jornada de administración, no una de recepción. */
export const PLATFORM_TOKEN_EXPIRES_IN = '8h';
export const PLATFORM_TOKEN_EXPIRES_IN_SECONDS = 8 * 60 * 60;

export interface PlatformTokenPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedPlatformAdmin {
  id: string;
  email: string;
  fullName: string;
}

export interface PlatformRequest {
  headers: { authorization?: string | string[] };
  platformAdmin?: AuthenticatedPlatformAdmin;
}

export interface PlatformLoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  admin: AuthenticatedPlatformAdmin;
}
