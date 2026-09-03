/**
 * Tokens de inyección de la capa de base de datos.
 * Se usan symbols para evitar colisiones con otros providers.
 */

/** pg.Pool único de la aplicación. */
export const DATABASE_POOL = Symbol('APEXG_DATABASE_POOL');

/** Instancia de Drizzle que envuelve el DATABASE_POOL. */
export const DATABASE = Symbol('APEXG_DATABASE');
