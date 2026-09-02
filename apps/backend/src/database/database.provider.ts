import { ConfigService } from '@nestjs/config';
import type { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Pool } from 'pg';

import { DATABASE, DATABASE_POOL } from './database.constants.js';
import type { Database } from './database.types.js';
import * as schema from './schema/schema.js';

/**
 * pg.Pool único de la aplicación.
 *
 * `new pg.Pool()` no abre ninguna conexión hasta la primera consulta, así que
 * este provider puede crearse aunque PostgreSQL no esté disponible todavía.
 * DATABASE_URL es obligatoria: `getOrThrow` evita una conexión silenciosa
 * sin configuración.
 */
export const databasePoolProvider: Provider = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Pool => {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    return new pg.Pool({ connectionString });
  },
};

/**
 * Instancia de Drizzle sobre el MISMO pool que expone DATABASE_POOL.
 * El schema es la representación TypeScript derivada por introspección
 * (`drizzle-kit pull`) de PostgreSQL. No ejecuta ninguna consulta al
 * construirse.
 */
export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [DATABASE_POOL],
  useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
};
