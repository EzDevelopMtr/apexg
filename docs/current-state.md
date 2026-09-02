# Estado actual — checkpoint

Este archivo cambia entre etapas. Para las reglas permanentes ver `CLAUDE.md`.

**Branch:** `feature/base-datos`
**HEAD:** `255ad05 feat(base-datos): endurecer integridad de usuarios y roles`

---

## PostgreSQL (Supabase)

- `public`: **27 tablas**, **53 foreign keys**.
- Migraciones aplicadas (en orden):
  - `001_initial_schema.sql`
  - `002_seed_modules_permissions.sql`
  - `003_harden_users_auth.sql`

### Datos globales

| Tabla | Filas |
|---|---|
| `modules` | 11 |
| `permissions` | 37 |

### Empresa de desarrollo — «APEX GYM Desarrollo»

| Tabla | Filas |
|---|---|
| `companies` | 1 |
| `roles` | 2 (`Administrador`, `Recepcionista`) |
| `role_permissions` | 49 (37 + 12) |
| `membership_types` | 9 |
| `expense_categories` | 4 |
| `users` | 1 |
| `platform_admins` | 0 |

---

## Provisioning

`CompanyProvisioningService` (`src/provisioning/`) implementado, ejecutado y validado
una vez contra Supabase (creó la empresa de desarrollo). Transacción única; réplica
Drizzle de los seeds `seeds/company/*.sql`.

## Auth

- `PasswordHasherService` (`src/auth/`) — Argon2id configurado (19456 / 2 / 1).
- `InitialAdministratorService` (`src/auth/`) — implementado y ejecutado una vez.
- **Primer Administrador: CREADO Y VALIDADO** (`username: admin`, empresa «APEX GYM
  Desarrollo», rol `Administrador`). Hash Argon2id verificado.
- **Login: implementado** — `POST /auth/login` valida `companyId` + `username`
  normalizado + contraseña, y rechaza de forma genérica credenciales, usuario o
  rol no válidos/inactivos.
- **JWT access token: implementado** — firmado con `JWT_ACCESS_SECRET`, TTL de
  15 minutos; incluye solo `sub`, `companyId`, `roleId` y `username`.
- **Sesiones, refresh tokens, cookies, guards y Passport: NO implementados.**

## Seguridad de BD

`users` y `roles` endurecidos por `003`:

- columnas de autenticación → `NOT NULL`; `state DEFAULT 1`.
- integridad multiempresa: `FK fk_users_company_role users(company_id, role_id) → roles(company_id, id)`
  (reemplaza a la FK simple `users.role_id → roles.id`).

`schema.dbml` y `schema.ts` sincronizados con PostgreSQL (correcciones manuales
auditadas del bug de `drizzle-kit` 0.31.10 — ver `CLAUDE.md`).

---

## Próximo paso

- Guards JWT y autorización por permisos.
- Refresh tokens / sesiones y estrategia de renovación.
- Pruebas HTTP automatizadas y manuales del login.
