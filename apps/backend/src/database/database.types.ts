import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Instancia base de Drizzle para APEX GYM.
 *
 * Todavía SIN schema: se parametrizará con el schema TypeScript de las
 * tablas cuando exista `src/database/schema/` (etapa de introspección).
 */
export type Database = NodePgDatabase<Record<string, never>>;

/**
 * Tipo del objeto de transacción que entrega `db.transaction(cb)`.
 *
 * Derivado de `Database` para no fijar todavía una abstracción propia.
 * Se revisará cuando exista schema (permitirá tipar repositorios que
 * acepten `Database | DatabaseTransaction`).
 */
export type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
