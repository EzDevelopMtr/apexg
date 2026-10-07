import { ADMINISTRATOR_ROLE } from '../provisioning/company-provisioning.constants.js';

/**
 * Reglas de los usuarios que el super admin crea para un gimnasio. Puras: sin
 * base de datos, para poder probarlas solas.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

/** El login ya compara así (LoginService): trim + minúsculas. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** `null` si sirve como usuario; si no, el motivo en español. */
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `El usuario debe tener entre ${USERNAME_MIN_LENGTH} y ${USERNAME_MAX_LENGTH} caracteres.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'El usuario solo puede tener minúsculas, números, punto, guion y guion bajo.';
  }
  return null;
}

export interface UserStanding {
  id: string;
  roleName: string;
  active: boolean;
}

export interface UserChange {
  userId: string;
  roleName?: string;
  active?: boolean;
}

const isActiveAdmin = (user: UserStanding): boolean =>
  user.active && user.roleName === ADMINISTRATOR_ROLE.name;

/**
 * Si el cambio dejaría al gimnasio sin ningún administrador activo. Nadie
 * podría volver a configurarlo desde dentro: solo se arreglaría desde el panel
 * o a mano en la base.
 */
export function leavesNoAdministrator(
  users: readonly UserStanding[],
  change: UserChange,
): boolean {
  const after = users.map((user) =>
    user.id === change.userId
      ? {
          ...user,
          roleName: change.roleName ?? user.roleName,
          active: change.active ?? user.active,
        }
      : user,
  );
  return users.some(isActiveAdmin) && !after.some(isActiveAdmin);
}
