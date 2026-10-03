import 'reflect-metadata';

import { temporaryPassword } from '../shared/temporary-password.js';
import { parseArgs } from 'node:util';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { isCompanySlug } from '../companies/company-slug.js';
import { DatabaseModule } from '../database/database.module.js';
import { CompanyOnboardingService } from '../provisioning/company-onboarding.service.js';
import type { OnboardCompanyInput } from '../provisioning/company-onboarding.service.js';
import { ProvisioningModule } from '../provisioning/provisioning.module.js';

/**
 * Alta de un gimnasio desde la terminal, hasta que exista el panel del super
 * admin (docs/plan-multi-gimnasio.md, fase 4). Usa la base de `.env`.
 *
 *   pnpm --filter @apexg/backend build
 *   pnpm --filter @apexg/backend company:create \
 *     --name "Gimnasio X" --slug gimnasio-x \
 *     --admin-username admin --admin-name "Nombre Apellido"
 *
 * La contraseña del administrador se genera aquí y se imprime UNA vez: así
 * nunca pasa por el historial de la terminal ni por un argumento.
 */

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ProvisioningModule],
})
class CreateCompanyCliModule {}

const REQUIRED = ['name', 'slug', 'admin-username', 'admin-name'] as const;

function readInput(): OnboardCompanyInput {
  // `pnpm run x -- --flag` deja pasar el `--`, que parseArgs tomaría como fin de opciones.
  const args = process.argv.slice(2).filter((arg, index) => index > 0 || arg !== '--');
  const { values } = parseArgs({
    args,
    options: Object.fromEntries(REQUIRED.map((key) => [key, { type: 'string' }])),
  });
  const missing = REQUIRED.filter((key) => typeof values[key] !== 'string');
  if (missing.length > 0) {
    throw new Error(`Faltan argumentos: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
  const value = (key: (typeof REQUIRED)[number]): string => String(values[key]);

  const slug = value('slug');
  if (!isCompanySlug(slug)) {
    throw new Error(
      `"${slug}" no sirve como identificador: 3 a 40 caracteres, minúsculas, dígitos y guiones, y no puede ser una ruta de la app.`,
    );
  }

  return {
    // Los mismos que APEX GYM: la app aún asume Colombia (ver el plan).
    company: { name: value('name'), slug, currency: 'COP', timezone: 'America/Bogota' },
    administrator: {
      username: value('admin-username'),
      fullName: value('admin-name'),
      password: temporaryPassword(),
    },
  };
}

async function main(): Promise<void> {
  const input = readInput();
  const app = await NestFactory.createApplicationContext(CreateCompanyCliModule, {
    logger: ['error'],
  });
  try {
    const result = await app.get(CompanyOnboardingService).onboard(input);
    process.stdout.write(
      [
        `Gimnasio creado: ${input.company.name}`,
        `  id:          ${result.company.companyId}`,
        `  entrada:     /${input.company.slug}`,
        `  planes:      ${result.company.membershipTypes}`,
        `Administrador: ${result.administrator.username}`,
        `  contraseña:  ${input.administrator.password}   (se muestra solo esta vez)`,
        '',
      ].join('\n'),
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
