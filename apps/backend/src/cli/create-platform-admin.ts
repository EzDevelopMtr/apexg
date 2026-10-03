import 'reflect-metadata';

import { parseArgs } from 'node:util';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { DatabaseModule } from '../database/database.module.js';
import { SettingsStoreModule } from '../settings/settings-store.module.js';
import { PlatformAuthService } from '../platform/platform-auth.service.js';
import { PlatformModule } from '../platform/platform.module.js';
import { pgErrorCode, PG_UNIQUE_VIOLATION } from '../shared/pg-error.util.js';

/**
 * Alta de un super admin. No tiene ruta HTTP a propósito, igual que el primer
 * administrador de un gimnasio: quien puede crear super admins es quien tiene
 * acceso al servidor. Usa la base de `.env`.
 *
 *   pnpm --filter @apexg/backend build
 *   pnpm --filter @apexg/backend platform:create-admin --email yo@correo.com --name "Mi Nombre"
 *
 * La contraseña se genera aquí y se imprime UNA vez.
 */

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, SettingsStoreModule, PlatformModule] })
class CreatePlatformAdminCliModule {}

async function main(): Promise<void> {
  // `pnpm run x -- --flag` deja pasar el `--`, que parseArgs tomaría como fin de opciones.
  const args = process.argv.slice(2).filter((arg, index) => index > 0 || arg !== '--');
  const { values } = parseArgs({
    args,
    options: { email: { type: 'string' }, name: { type: 'string' } },
  });
  if (!values.email || !values.name) throw new Error('Faltan --email y --name.');

  const app = await NestFactory.createApplicationContext(CreatePlatformAdminCliModule, {
    logger: ['error'],
  });
  try {
    const password = await app.get(PlatformAuthService).create(values.email, values.name);
    process.stdout.write(
      `Super admin creado: ${values.email.trim().toLowerCase()}\n  contraseña: ${password}   (se muestra solo esta vez)\n`,
    );
  } catch (error) {
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      throw new Error(`Ya existe un super admin con el correo ${values.email}.`, { cause: error });
    }
    throw error;
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
