import { Global, Inject, Module } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';

import { DATABASE, DATABASE_POOL } from './database.constants.js';
import { databaseProvider, databasePoolProvider } from './database.provider.js';

/**
 * Infraestructura de base de datos: un único pg.Pool y la instancia de
 * Drizzle que lo envuelve. Global para no reimportarlo en cada módulo.
 *
 * No contiene repositories ni lógica de negocio.
 */
@Global()
@Module({
  providers: [databasePoolProvider, databaseProvider],
  exports: [DATABASE_POOL, DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /** Único responsable de cerrar el pool cuando NestJS termina. */
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
