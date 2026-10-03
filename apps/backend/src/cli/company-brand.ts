import 'reflect-metadata';

import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { CompaniesModule } from '../companies/companies.module.js';
import { CompanyBrandingService } from '../companies/company-branding.service.js';
import type { BrandChange } from '../companies/company-branding.service.js';
import { DatabaseModule } from '../database/database.module.js';
import type { UploadedFile } from '../shared/local-file-store.js';

/**
 * Color y logo de un gimnasio desde la terminal, hasta que exista el panel del
 * super admin (docs/plan-multi-gimnasio.md, fase 4). Usa la base de `.env`.
 *
 *   pnpm --filter @apexg/backend company:brand --slug gimnasio-x \
 *     --color "#7c3aed" --logo C:\ruta\logo.svg
 *
 * `--color none` vuelve a los colores por defecto.
 */

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, CompaniesModule] })
class CompanyBrandCliModule {}

const MIME_BY_EXTENSION: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function readLogo(path: string): Promise<UploadedFile> {
  const mimetype = MIME_BY_EXTENSION[extname(path).toLowerCase()];
  if (!mimetype) throw new Error('El logo debe ser .svg, .png o .webp.');
  return { mimetype, size: (await stat(path)).size, buffer: await readFile(path) };
}

async function readInput(): Promise<{ slug: string; change: BrandChange }> {
  // `pnpm run x -- --flag` deja pasar el `--`, que parseArgs tomaría como fin de opciones.
  const args = process.argv.slice(2).filter((arg, index) => index > 0 || arg !== '--');
  const { values } = parseArgs({
    args,
    options: { slug: { type: 'string' }, color: { type: 'string' }, logo: { type: 'string' } },
  });
  if (!values.slug) throw new Error('Falta --slug.');
  if (values.color === undefined && values.logo === undefined) {
    throw new Error('Nada que cambiar: pasa --color, --logo o ambos.');
  }
  return {
    slug: values.slug,
    change: {
      ...(values.color !== undefined ? { color: values.color === 'none' ? null : values.color } : {}),
      ...(values.logo !== undefined ? { logo: await readLogo(values.logo) } : {}),
    },
  };
}

async function main(): Promise<void> {
  const { slug, change } = await readInput();
  const app = await NestFactory.createApplicationContext(CompanyBrandCliModule, {
    logger: ['error'],
  });
  try {
    await app.get(CompanyBrandingService).change(slug, change);
    process.stdout.write(`Marca de /${slug} actualizada.\n`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
