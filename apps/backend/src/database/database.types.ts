import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from './schema/schema.js';

/**
 * Instancia de Drizzle para APEX GYM, tipada con el schema derivado por
 * introspección (`drizzle-kit pull`) de PostgreSQL — las 27 tablas de `public`.
 */
export type Database = NodePgDatabase<typeof schema>;

/**
 * Tipo del objeto de transacción que entrega `db.transaction(cb)`.
 * Derivado de `Database`; misma superficie de consulta que `db`.
 */
export type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
