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
- **POST /auth/login: IMPLEMENTADO Y VALIDADO** manualmente desde Postman.
- **AccessTokenGuard: IMPLEMENTADO Y VALIDADO** — valida Bearer JWT, payload,
  usuario y rol activos contra PostgreSQL.
- **GET /auth/me: IMPLEMENTADO Y VALIDADO EN POSTMAN** con Bearer JWT válido;
  devuelve únicamente `id`, `companyId`, `roleId`, `username` y `fullName`.
- **Bearer JWT (firma y expiración): VALIDADO** — algoritmo HS256 y TTL de 15 min.
- **Revalidación user/role contra PostgreSQL: IMPLEMENTADA.**
- **AuthorizationService: IMPLEMENTADO** — resuelve permisos actuales mediante
  PostgreSQL, sin usar permisos en el JWT ni caché.
- **@RequirePermissions: IMPLEMENTADO** — declara permisos acumulativos (AND).
- **PermissionGuard: IMPLEMENTADO** — distingue ausencia de autenticación (401)
  de permiso insuficiente (403).
- **Autorización aplicada a endpoints de negocio: PENDIENTE.**
- **Refresh tokens: NO implementados.**
- **Sesiones, cookies y Passport: NO implementados.**

## Seguridad de BD

`users` y `roles` endurecidos por `003`:

- columnas de autenticación → `NOT NULL`; `state DEFAULT 1`.
- integridad multiempresa: `FK fk_users_company_role users(company_id, role_id) → roles(company_id, id)`
  (reemplaza a la FK simple `users.role_id → roles.id`).

`schema.dbml` y `schema.ts` sincronizados con PostgreSQL (correcciones manuales
auditadas del bug de `drizzle-kit` 0.31.10 — ver `CLAUDE.md`).

---

## Próximo paso

- Aplicar `AccessTokenGuard` + `PermissionGuard` al primer módulo de negocio.
