/**
 * SQLSTATE de PostgreSQL más usados aquí — ver apéndice A de PostgreSQL.
 */
export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';

function extractCode(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'code' in value) {
    const code = (value as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * drizzle-orm 0.45.2 envuelve el error de `pg` en un `DrizzleQueryError`;
 * el `.code` (SQLSTATE) queda en `.cause`, no en el objeto de nivel
 * superior. Se revisan ambos niveles en vez de asumir cuál.
 *
 * Encontrado la primera vez en `membership-types/`, reescrito idéntico en
 * `trainers/` y `expenses/` — tercera repetición, señal de sacarlo de un
 * módulo a un lugar común en vez de escribirlo una cuarta vez.
 */
export function pgErrorCode(error: unknown): string | undefined {
  return (
    extractCode(error) ??
    extractCode(
      error && typeof error === 'object' && 'cause' in error
        ? (error as { cause: unknown }).cause
        : undefined,
    )
  );
}
