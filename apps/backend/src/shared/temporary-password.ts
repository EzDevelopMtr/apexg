import { randomBytes } from 'node:crypto';

/**
 * Contraseña inicial o de restablecimiento: 24 caracteres URL-safe, muy por
 * encima del mínimo de 12. Se genera en el servidor para que nunca viaje
 * como argumento de terminal ni quede en un historial.
 */
export function temporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}
