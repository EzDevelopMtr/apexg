# Arquitectura — Seguridad

Estado y decisiones de seguridad. Complementa `CLAUDE.md`.

## Acceso a datos

```
Frontend → NestJS → Drizzle → PostgreSQL
```

- El **frontend nunca conoce `DATABASE_URL`**. Solo el backend accede a la base.
- `apps/backend/.env` (contiene `DATABASE_URL`, `PORT`) está **gitignored** y nunca
  se versiona ni se imprime.
- **Supabase Data API: OFF** (desactivada en el panel del proyecto). No se usa
  PostgREST / GraphQL de Supabase como capa de aplicación.
- No se usa **Supabase Auth** ni `@supabase/supabase-js` ni `auth.users`. La
  identidad de APEX GYM vive en **`public.users`**.

> Nota: los roles PostgreSQL `anon` / `authenticated` conservan grants sobre `public`
> (comportamiento por defecto de Supabase). Con la Data API apagada y sin exponer la
> `anon key`, no hay superficie de acceso; endurecer esos grants (o RLS) queda como
> posible refuerzo futuro.

## Contraseñas

- Algoritmo: **Argon2id** (`argon2`), parámetros explícitos y auditables:
  `memoryCost = 19456` (19 MiB), `timeCost = 2`, `parallelism = 1`.
- La librería genera el salt; el hash PHC (`$argon2id$...`, ~97 chars) incluye
  algoritmo, versión, parámetros, salt y hash — **no** hay columna de salt aparte.
- **Nunca** se persiste plaintext. **Nunca** se loggea `password` ni el hash.
- Política: **12 ≤ longitud ≤ 128**. La contraseña **no se trimea** — se preserva
  textualmente. Se permiten espacios y Unicode. Sin reglas obligatorias separadas
  de mayúscula/minúscula/dígito/símbolo.
- La longitud se mide con `String.length` (unidades UTF-16) — deuda menor conocida.

## Identidad y normalización

- `username`: normalizado con `trim().toLowerCase()` (no locale-specific). El
  `UNIQUE (company_id, username)` de PostgreSQL sigue siendo case-sensitive; el
  backend garantiza minúsculas en todo alta nueva (deuda conocida, sin migración
  case-insensitive todavía).
- `full_name`: `trim()`, no vacío, máximo 150 (columna real).

## Autorización multiempresa

- **`roleId` lo deriva el backend, no lo elige el caller.** `InitialAdministratorService`
  resuelve el rol por `companyId` + `name = 'Administrador'` y verifica `state = 1`.
- La integridad también está protegida por **PostgreSQL**: la FK compuesta
  `fk_users_company_role (company_id, role_id) → roles(company_id, id)` impide asignar
  a un usuario un rol de otra empresa, incluso con SQL manual (ver
  `database.md` §10).
- **Nunca hardcodear IDs de roles** (`roles.id` es IDENTITY, variable).

## Creación del primer usuario

`InitialAdministratorService` tiene **semántica estricta**: solo crea el primer
usuario de una empresa (falla si la empresa ya tiene alguno). Flujo:

1. valida y normaliza `username` / `fullName`; valida política de `password`;
2. genera el hash Argon2id **fuera** de la transacción (Argon2 es costoso);
3. en **una** transacción: verifica empresa, verifica 0 usuarios, resuelve el rol
   `Administrador` activo, verifica que el `username` esté libre, inserta.

Devuelve solo identificadores y datos no sensibles (nunca `password` ni el hash).

La creación de usuarios adicionales será otro caso de uso (`createUser`).

## Login y token de acceso

- `POST /auth/login` recibe `companyId` (UUID), `username` y `password`. El
  `ValidationPipe` global rechaza tipos/campos no declarados; el username se
  normaliza con `trim().toLowerCase()` y la contraseña se compara sin alterarla.
- La consulta queda acotada a `company_id` + `username`; antes de emitir el token
  comprueba que usuario y rol de esa misma empresa estén activos. Todo rechazo usa
  `401 Credenciales inválidas`, sin revelar la causa.
- El access token es un JWT firmado con `JWT_ACCESS_SECRET`, obligatorio al
  arrancar. Expira en 15 minutos y contiene solo `sub`, `companyId`, `roleId` y
  `username`. La respuesta no contiene contraseña ni hash.

## Pendiente

- **Refresh tokens / sesiones / cookies / guards / Passport** — no implementados.
- Controller / DTO HTTP para exponer el alta de Administrador.
- Endurecimiento opcional de grants `anon`/`authenticated` o RLS en `public`.

---

Este archivo no contiene secretos: sin `DATABASE_URL`, contraseñas, host de Supabase,
project ref, `anon key` ni `service_role key`.
