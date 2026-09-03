# APEX GYM

Reglas permanentes del proyecto. Para el estado concreto de cada etapa ver
`docs/current-state.md`.

## Monorepo

- **pnpm + Turborepo**
- `apps/frontend` — Next.js (App Router)
- `apps/backend` — NestJS
- `packages/*` — código compartido (`core`, `ui`, `modulo-clientes`, `typescript-config`)

## Backend

- **NestJS 12**, **TypeScript 6**
- **ESM / NodeNext** — imports relativos con extensión `.js`
- **PostgreSQL** (Supabase administrado)
- **pg.Pool** + **Drizzle ORM** (`drizzle-orm/node-postgres`)
- Lint con **oxlint** (no ESLint). Sin Prettier.
- `apps/backend/tsconfig.json` desactiva `verbatimModuleSyntax` (incompatible con
  `emitDecoratorMetadata` de NestJS); `strict` se conserva.

## Database-first

La autoridad del esquema es, en este orden:

```
apps/backend/database/migrations/*.sql   (única fuente de DDL)
        ↓
PostgreSQL
        ↓
drizzle-kit pull
        ↓
apps/backend/src/database/schema/schema.ts   (derivado, no autoritativo)
```

Nunca usar para cambiar PostgreSQL:

- `drizzle-kit push`
- `drizzle-kit generate`
- `drizzle-kit migrate`

Solo `drizzle-kit pull` (introspección). No modificar una migración ya aplicada:
los cambios de esquema entran como una **nueva** migración numerada.

## Drizzle

`schema.ts` es **derivado de PostgreSQL**, no autoritativo. `drizzle.config.ts` usa
`schemaFilter: ['public']` (nunca `auth`, `storage`, `realtime`, `vault`, `graphql`).

**Bug conocido en `drizzle-kit` 0.31.10:** introspecta mal las restricciones
compuestas — invierte el orden de columnas. Tras cada `pull` hay que corregir a mano
y auditar contra `pg_get_constraintdef`:

| Restricción | Valor correcto (PostgreSQL) |
|---|---|
| `fk_users_company_role` | `FOREIGN KEY (company_id, role_id) REFERENCES roles(company_id, id)` → en Drizzle `foreignColumns: [roles.companyId, roles.id]` |
| `uq_roles_company_role_id` | `UNIQUE (company_id, id)` → en Drizzle `.on(table.companyId, table.id)` |

También hay que quitar el `import { sql }` muerto que `drizzle-kit` reemite (choca con
`noUnusedLocals`) y reponer la cabecera de provenance. **PostgreSQL siempre gana
frente al output de `drizzle-kit`.**

## Conexiones

Exactamente:

- **1** `pg.Pool` (`src/database/database.provider.ts`)
- **1** `drizzle(pool, { schema })`
- **1** `pool.end()` (`src/database/database.module.ts`, `OnApplicationShutdown`)

No crear pools adicionales. `DatabaseModule` es `@Global()`.

## NUMERIC

PostgreSQL `NUMERIC` se mantiene como **string** (comportamiento por defecto de `pg`).
No convertir globalmente a `Number`. No registrar parsers globales de `pg` para
numeric. Los importes monetarios se pasan como string a Drizzle.

## Multiempresa

Toda información company-scoped respeta `company_id`. **Nunca hardcodear IDs de
roles** (`roles.id` es IDENTITY, variable) — resolver por `company_id` + `name`.

`users` tiene integridad garantizada por PostgreSQL:

```
FK fk_users_company_role: users(company_id, role_id) → roles(company_id, id)
```

El rol de un usuario debe pertenecer a su misma empresa, incluso con SQL manual.

## Passwords

**Argon2id** (`argon2`), parámetros explícitos:

```
memoryCost = 19456   (19 MiB)
timeCost   = 2
parallelism = 1
```

- Nunca persistir plaintext. Nunca loggear `password` ni el hash.
- Política: 12 ≤ longitud ≤ 128. La contraseña **no se trimea**.
- `username` se normaliza con `trim().toLowerCase()` (no locale-specific).

## Supabase

Se usa **solo como PostgreSQL administrado**. **Data API está desactivada.**

No usamos: Supabase Auth, `@supabase/supabase-js`, `auth.users`, PostgREST/GraphQL
como capa de aplicación. La identidad de APEX GYM vive en `public.users`.

```
Frontend → NestJS → Drizzle → PostgreSQL
```

El frontend **nunca** conoce `DATABASE_URL`. `apps/backend/.env` está gitignored.

## Git

- Commits en **español**.
- **No hacer push** sin autorización explícita.
- **No hacer `--amend`** sin autorización explícita.
- Antes de modificar: `git status --short`.
- No tocar archivos fuera del alcance solicitado.
- Trailers de atribución según indique la sesión.

## Validación backend

```
pnpm --filter @apexg/backend typecheck
pnpm --filter @apexg/backend build
pnpm --filter @apexg/backend lint
```

No ocultar errores: reportar la salida real.
