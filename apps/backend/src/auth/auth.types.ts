/**
 * Tipos y constantes de la capa de autenticación:
 *  - fase 1: creación segura del primer usuario Administrador de una empresa;
 *  - fase 2: login y emisión de access token JWT;
 *  - fase 3: validación de access token y usuario autenticado.
 */

/** Política de contraseña — primera versión. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** TTL del access token. */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

/** Algoritmo único admitido para los access tokens. */
export const ACCESS_TOKEN_ALGORITHM = 'HS256';

/** Nombre de la variable de entorno del secreto de firma. */
export const JWT_ACCESS_SECRET_ENV = 'JWT_ACCESS_SECRET';

/** Límite real de `users.full_name` en PostgreSQL (VARCHAR(150)). */
export const FULL_NAME_MAX_LENGTH = 150;

/**
 * Entrada para crear el primer usuario Administrador de una empresa.
 * `companyId` sí forma parte del input: la empresa ya existe.
 * El caller NO elige `roleId`, `state`, `id` ni `createdAt`.
 */
export interface CreateInitialAdministratorInput {
  companyId: string;
  username: string;
  fullName: string;
  password: string;
}

/** Resultado: solo identificadores y datos no sensibles. */
export interface CreateInitialAdministratorResult {
  userId: string;
  companyId: string;
  roleId: number;
  username: string;
  fullName: string;
}

/**
 * Payload del access token JWT. Solo identificadores necesarios — nunca
 * `password`, hash, lista de permisos ni objetos completos.
 *
 * `roleId` NO es autorización suficiente por sí solo: los permisos se
 * resolverán contra `role_permissions` en una etapa posterior.
 */
export interface AccessTokenPayload {
  sub: string;
  companyId: string;
  roleId: number;
  username: string;
}

/** Usuario autenticado disponible para rutas protegidas. */
export interface AuthenticatedUser {
  id: string;
  companyId: string;
  roleId: number;
  username: string;
  fullName: string;
}

/** Código exacto del catálogo global `permissions.code`. */
export type PermissionCode = string;

/** Superficie HTTP mínima que usa el guard; evita `any` en request.user. */
export interface AuthenticatedRequest {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
}

/** Datos de entrada del login (POST /auth/login). */
export interface LoginInput {
  companyId: string;
  username: string;
  password: string;
}

/** Respuesta del login. No incluye `password` ni hash. */
export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    companyId: string;
    roleId: number;
    username: string;
    fullName: string;
  };
}
