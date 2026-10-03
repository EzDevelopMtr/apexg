# Plan: APEX GYM para varios gimnasios

Borrador para aprobar · 2026-10-03

Objetivo: que una sola instalación de la app atienda a varios gimnasios, cada
uno con su nombre, logo y color; con una cuenta de super admin que los crea y
administra; y con ajustes que se aplican a todos o a uno solo, según decida el
super admin.

## Decisiones tomadas

1. **Cada gimnasio entra por una ruta:** `<link>/<slug>`, por ejemplo
   `pcandres.taildb102a.ts.net/apex-gym`. Funciona con el link actual de Tailscale.
2. **Los 9 planes de APEX son la plantilla** de todo gimnasio nuevo, y cada
   gimnasio los edita después. `CompanyProvisioningService` ya lo hace.
3. **Una sola instalación compartida, no un contenedor por gimnasio.**
   La base ya separa los datos con `company_id`. Con un contenedor por
   gimnasio habría que aplicar cada migración y cada publicación N veces.
   Un ajuste general implicaría tocar N bases, el super admin tendría que
   conectarse a N bases y el PC cargaría N copias del stack. Docker sí se
   usa, pero para empaquetar esa única instalación (fase 6). Un contenedor
   por gimnasio solo tiene sentido si un cliente exige por contrato una base
   aislada.
4. **APEX entra por `/apex-gym`.**
5. **Quién edita qué:**
   - **Super admin:** nombre, slug, logo, color, estado del gimnasio y los
     ajustes de plataforma de la fase 5.
   - **Administrador de cada gimnasio:** todo lo que ya se gestiona dentro de
     la app (planes, categorías, entrenadores, clientes, etc.). Eso no cambia.

## Principios

- El piloto de APEX no se interrumpe. Cada fase se puede publicar por separado.
- Las migraciones solo agregan y rellenan datos: APEX recibe el slug `apex-gym` y
  conserva su marca actual.
- Ningún gimnasio tiene código propio. Lo que cambia entre gimnasios son datos:
  marca, ajustes e interruptores de funciones.
- Cada regla nueva lleva su test. El backend no depende de `@apexg/core`, así
  que se registra `apps/backend` en `vitest.workspace.ts` para probar sus
  funciones puras.

## Fase 0 — Preparación (0,5 d)

- `docs/GLOSSARY.md`: gimnasio → `company`, identificador de URL → `slug`,
  super admin → `platform admin`, ajuste → `setting`, valor general →
  `platform default`, excepción → `company override`, obligatorio →
  `enforced`, interruptor → `feature flag`.
- `vitest.workspace.ts`: agregar `apps/backend`, solo para sus `*.test.ts` puros.
- En `apexg_work`, crear un segundo gimnasio de prueba ("Gimnasio Demo") para
  probar el aislamiento. Nada se prueba contra `apexg_dev`.

## Fase 1 — Identidad del gimnasio (1–1,5 d)

Migración `021_company_slug_state.sql`:

- `companies.slug VARCHAR(40) NOT NULL UNIQUE`, con
  `CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`. Backfill: `apex-gym`.
- `companies.state INTEGER NOT NULL DEFAULT 1` (1 activo, 2 suspendido).

Backend:

- `company-slug.ts` (puro, con test): valida el formato y bloquea los slugs
  reservados, que son las rutas raíz del frontend: `login`, `modules`,
  `dashboard`, `api`, `admin`, `_next` y los archivos de `public/`.
- `LoginService` rechaza gimnasios suspendidos. Hoy no lo comprueba porque la
  columna no existía ([login.service.ts:82](../apps/backend/src/auth/login.service.ts)).
- `AccessTokenGuard` revalida también el estado del gimnasio: suspender uno
  corta sus sesiones abiertas.
- Endpoints públicos (sin sesión):
  - `GET /public/companies/:slug` → `{ id, slug, name, brandColor, hasLogo, state }`.
  - `GET /public/companies/:slug/logo`.
- Comando `pnpm --filter @apexg/backend company:create`: une
  `CompanyProvisioningService` e `InitialAdministratorService` con el slug.
  Con él se puede dar de alta el gimnasio #2 antes de que exista el panel.

## Fase 2 — Entrada por gimnasio (2 d)

Frontend:

- `app/[gym]/page.tsx`: login con la marca del gimnasio. Un slug inexistente
  devuelve `notFound()`, y uno suspendido muestra un aviso. Next resuelve
  `/login` y `/modules` antes que `[gym]`.
- `/api/auth/login` recibe el `gym` y resuelve el `companyId` en el servidor.
  Desaparece `APEXG_COMPANY_ID` ([route.ts:7](../apps/frontend/app/api/auth/login/route.ts)).
- Al iniciar sesión se guarda la cookie `apexg_gym=<slug>`, que no tiene datos
  sensibles. `proxy.ts` y el cierre de sesión redirigen a `/<slug>` en vez de
  a `/login`.
- `/login`, el link viejo, redirige a la cookie o, si no existe, a
  `DEFAULT_GYM_SLUG=apex-gym`, que se mantiene mientras dure la transición.
- `/auth/me` también devuelve `company: { slug, name, brandColor, hasLogo }`.
- E2E: ajustar el login del proyecto `setup`.

Resultado: APEX entra por `/apex-gym`, y el link viejo sigue funcionando.

## Fase 3 — Marca por gimnasio (2–3 d)

- **Color:** se guarda un solo color por gimnasio, en `companies.primary_color`.
  - `deriveBrandPalette(hex)` en `core` (pura, con test) calcula los 5 tokens
    (`brand`, `-strong`, `-ink`, `-soft`, `-contrast`) y verifica los
    contrastes que exige `theme.css` (`brand-ink` ≥ 4.5:1 sobre `canvas`).
  - Los tokens se inyectan como `style` en `<html>` desde `[gym]/layout.tsx`
    y `(private)/layout.tsx`. Son componentes de servidor, así que la pantalla
    no parpadea.
  - Sin color, se usan los valores de `theme.css` sin cambios, y APEX queda
    exactamente como hoy.
  - Se rechazan los tonos verde, ámbar y rojo, reservados para los estados
    (regla de color de `CLAUDE.md`). El backend repite esa validación, igual
    que ya hace con `isDayPlan`.
- **Logo:** `CompanyLogoStore extends LocalFileStore` (SVG/PNG ≤ 512 KB,
  `COMPANY_LOGOS_DIR`).
  - `Logo` en `ui` recibe `{ name, src? }`. Sin logo, muestra el nombre como
    wordmark.
  - El SVG actual de APEX se sube como su logo.
- **Textos:** los `metadata` fijos pasan a `generateMetadata` con el nombre del
  gimnasio: `layout.tsx`, login, dashboard, modules y
  [module-route.ts:31](../apps/frontend/lib/module-route.ts). El favicon es el
  logo.
- `login-hero.jpg` sigue siendo la misma imagen para todos.

**Al cerrar esta fase ya se puede operar el gimnasio #2**, dado de alta con el
comando de la fase 1.

## Fase 4 — Super admin (5–7 d)

Backend, módulo `platform/`:

- Migración `022`:
  - `platform_admins`: `email` y `password` pasan a `NOT NULL`. La tabla ya
    existe y nadie la usa.
  - `audit_logs.platform_admin_id`: esa tabla también existe sin uso; se
    reutiliza para registrar quién hizo qué.
- **Autenticación:**
  - `POST /platform/auth/login` usa Argon2 y el `LoginRateLimiterService`
    actual.
  - El JWT lleva `aud: 'platform'` y el token de un gimnasio lleva
    `aud: 'company'`. Cada guard exige su audiencia: un token de gimnasio
    nunca abre rutas de plataforma, ni al revés.
- **Primer super admin:** se crea con el comando `platform:create-admin`. No
  hay endpoint HTTP para eso, igual que con el primer administrador de un
  gimnasio.
- **Rutas:**
  - `GET /platform/companies`: lista con clientes activos y último ingreso.
  - `POST /platform/companies`: alta con slug, color y administrador inicial,
    en una sola transacción. Para eso `InitialAdministratorService` debe
    aceptar una `tx` externa.
  - `PATCH /platform/companies/:id`: nombre, slug, color y estado.
  - `POST /platform/companies/:id/logo`.
  - `POST /platform/companies/:id/admin-password`: restablece la contraseña
    del administrador del gimnasio (soporte).

Frontend:

- Área `/admin` (slug reservado) con su propio login y su propia cookie,
  `apexg_platform_session`.
- Paquete `packages/module-platform` con las pantallas: lista de gimnasios,
  crear, editar marca, suspender/reactivar y restablecer contraseña.

## Fase 5 — Ajustes generales y por gimnasio (3–5 d)

Migración `023`:

```sql
CREATE TABLE platform_settings (
  key        VARCHAR PRIMARY KEY,
  value      JSONB NOT NULL,
  enforced   BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES platform_admins (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE company_settings (
  company_id UUID NOT NULL REFERENCES companies (id),
  key        VARCHAR NOT NULL,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES platform_admins (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, key)
);
```

**Cómo se resuelve un ajuste** (función pura, con test). Se usa la primera
regla que aplique:

1. Si el valor general está marcado como obligatorio, se usa el valor general.
2. Si el gimnasio tiene una excepción, se usa la excepción.
3. Si existe un valor general, se usa ese.
4. Si no, se usa el valor por defecto del código.

Ejemplo: los días de gracia generales son 0 y el gimnasio Y tiene una
excepción de 3, así que solo Y da 3 días. Si después marcas 2 como obligatorio,
aplica a todos, incluido Y.

**Piezas:**

- Catálogo `settings/setting-definitions.ts`: un registro por ajuste con
  `{ key, kind, default, validate }`. Agregar un ajuste es agregar un registro.
- `SettingsService.forCompany(companyId)` devuelve un `CompanySettings`
  tipado, con caché que se invalida al escribir.
- `GET /settings` entrega los valores efectivos al usuario del gimnasio.
- `useCompanySettings()` en `module-kit` pasa esos valores a las funciones de
  `core`, que ya los reciben como parámetro (`resolveStatus(client, date, graceDays)`).
- Panel del super admin: por cada ajuste muestra el valor general, el
  interruptor "obligatorio para todos" y las excepciones por gimnasio.
- Solo los edita el super admin (decisión 5). Si más adelante un ajuste debe
  quedar en manos del administrador del gimnasio, su definición gana una
  marca `editableByCompany` y aparece en la app del gimnasio, sin otra tabla.

**Primeros ajustes:**

| Clave | Hoy | Dónde |
|---|---|---|
| `clients.graceDays` | 0 fijo | `DEFAULT_GRACE_DAYS` en core; `end_date < CURRENT_DATE` en [client-overdue-sync.service.ts](../apps/backend/src/clients/client-overdue-sync.service.ts) |
| `clients.expiringSoonDays` | 7 fijo | `EXPIRING_SOON_DAYS` en core |
| `modules.enabled` | todos | Oculta el módulo en la grilla y `AuthorizationService` niega sus permisos, en un solo punto |

Las funciones nuevas se encienden y apagan con el mismo mecanismo
(`features.<x>`, booleano).

## Fase 6 — Operación (3–4 d)

- **Docker Compose para la instalación única:**
  - Servicios `postgres` (reutiliza el volumen `apexg_pgdata`), `backend` y
    `web`, más un volumen para los archivos.
  - Funnel sigue apuntando a 3000.
  - `publicar.ps1` pasa a `compose build`, luego migraciones, luego `up -d`.
  - Antes de tocar producción, se ensaya completo contra una copia de la base.
    **El cambio en producción lo ejecutas tú.**
- **Archivos por gimnasio:** los nuevos se guardan en
  `<dir>/<companyId>/<uuid>.<ext>`. Los existentes se quedan donde están.
- **Respaldos:**
  - `pg_dump` completo programado a diario.
  - `exportar-gimnasio.ps1 -Slug x` copia las filas del gimnasio
    (`WHERE company_id`) y sus archivos, para entregarle sus datos o darlo de
    baja.
  - Restaurar un solo gimnasio dentro de la base compartida no es sencillo: la
    red de seguridad es el respaldo completo.

## Resumen

| Fase | Días | Qué habilita |
|---|---|---|
| 0 Preparación | 0,5 | — |
| 1 Identidad | 1–1,5 | Slug, suspender, alta por comando |
| 2 Entrada | 2 | APEX por `/apex-gym`; login por gimnasio |
| 3 Marca | 2–3 | **Gimnasio #2 operable** |
| 4 Super admin | 5–7 | Panel de gimnasios |
| 5 Ajustes | 3–5 | Ajustes generales o por gimnasio |
| 6 Operación | 3–4 | Docker, respaldos por gimnasio |
| **Total** | **≈ 17–23** | ~4 semanas |

## Riesgos

- **Una consulta nueva sin `company_id` dejaría ver datos de otro gimnasio.**
  Mitigación: una prueba E2E de aislamiento con 2 gimnasios (A pide por id un
  cliente, un pago o un archivo de B y recibe 404), y RLS de Postgres como
  refuerzo futuro.
- **La recepcionista de APEX pierde el link.** Mitigación: `/login` redirige a
  `/apex-gym` y se le avisa el link nuevo.
- **Zona horaria fija.** `America/Bogota` y `CURRENT_DATE` funcionan solo
  mientras todos los gimnasios estén en Colombia.
- **Un solo PC.** Si se apaga, se caen todos los gimnasios. Compose deja listo
  el paso a un VPS.

## Fuera de alcance por ahora

Subdominios, cobro a los gimnasios, "entrar como" un gimnasio, foto de login
por gimnasio, roles personalizados (`roleFromName` solo admite Administrador y
Recepcionista), zona horaria y moneda por gimnasio, RLS.
