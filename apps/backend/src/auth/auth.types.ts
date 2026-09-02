/**
 * Tipos y constantes de la capa de autenticación (fase 1: solo creación
 * segura del primer usuario Administrador de una empresa).
 */

/** Política de contraseña — primera versión. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

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
