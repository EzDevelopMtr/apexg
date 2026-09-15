import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

/**
 * Configuración de drizzle-kit para APEX GYM.
 *
 * Enfoque DATABASE-FIRST estricto:
 *   schema.dbml -> migraciones SQL manuales -> PostgreSQL -> drizzle-kit pull
 *
 * Este archivo SOLO se usa para introspección (`drizzle-kit pull`).
 * NUNCA para `generate` / `migrate` / `push` / `check`: las migraciones
 * viven en apps/backend/database/migrations/ y son la única fuente de verdad.
 *
 * La conexión se toma exclusivamente de process.env.DATABASE_URL
 * (cargada desde apps/backend/.env por `dotenv/config`). No se escribe
 * ninguna credencial aquí.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL no está definida (apps/backend/.env).');
}

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: { url },

  // Solo el schema de la aplicación. Nunca los schemas gestionados por
  // Supabase (auth, storage, realtime, extensions, graphql, vault, ...).
  schemaFilter: ['public'],
  tablesFilter: ['*'],

  introspect: { casing: 'camel' },

  // Carpeta temporal de introspección; su contenido no se versiona.
  out: './.drizzle-introspect',
});
