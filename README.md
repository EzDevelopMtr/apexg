# APEX GYM — Monorepo

Sistema de gestión para gimnasio. El frontend es una aplicación **Next.js**
(App Router) y el código compartido vive en paquetes independientes dentro
del mismo repositorio.

Los requisitos vienen del ERS (documento en español). El código está escrito
en inglés; la traducción del vocabulario del negocio es única y está en
[docs/GLOSSARY.md](docs/GLOSSARY.md). Las convenciones de ingeniería están en
[CLAUDE.md](CLAUDE.md).

## Estructura

```
apexg/
├── apps/
│   └── web/                  Aplicación Next.js (rutas, sesión, layout)
├── packages/
│   ├── core/                 Dominio: tipos, reglas y funciones puras
│   ├── data/                 Contratos de acceso a datos + implementaciones
│   ├── ui/                   Primitivos visuales compartidos
│   ├── module-kit/           Plumbing compartido entre módulos
│   ├── module-*/             Un paquete por módulo de negocio
│   └── typescript-config/    Configuraciones de TypeScript compartidas
├── docs/GLOSSARY.md
└── CLAUDE.md
```

Las dependencias fluyen en un solo sentido: `core ← data ← module-* ← web`.
`core` no importa hacia arriba, así que un cálculo de vencimiento corre en un
test de Node sin React, sin Next y sin base de datos.

Cada módulo del negocio es su propio paquete. Cuando se construyan Membresías,
Pagos, Inventario, Finanzas o Entrenadores, cada uno entra como
`packages/module-<nombre>` y `apps/frontend` solo agrega su ruta.

## Requisitos

- Node.js 20 o superior
- pnpm 9 (`npm install -g pnpm`)

## Comandos

```bash
pnpm install     # instalar dependencias de todo el monorepo
pnpm dev         # levantar la aplicación en http://localhost:3000
pnpm verify      # lint + typecheck + tests (lo mismo que corre CI)
pnpm test        # solo los tests
pnpm format      # prettier
```

Para trabajar en un solo paquete:

```bash
pnpm --filter @apexg/web dev
pnpm --filter @apexg/core test
```

## Rutas

| Ruta                             | Módulo           | Rol           |
| -------------------------------- | ---------------- | ------------- |
| `/login`                         | Inicio de sesión | —             |
| `/modules`                       | Selector         | ambos         |
| `/modules/clients/[section]`     | Clientes         | ambos         |
| `/modules/payments/[section]`    | Pagos            | ambos         |
| `/modules/daily-log/[section]`   | Apartado diario  | ambos         |
| `/modules/memberships/[section]` | Membresías       | administrador |
| `/modules/trainers/[section]`    | Entrenadores     | administrador |
| `/modules/expenses/[section]`    | Egresos          | administrador |
| `/modules/inventory/[section]`   | Inventario       | administrador |
| `/modules/finances/[section]`    | Finanzas         | administrador |

Los roles salen de la matriz del ERS §2.2, que vive como dato en
`packages/core/src/domain/permissions.ts`. El apartado diario es un módulo
propio y no una sección de Finanzas: §2.2 se lo concede a la recepcionista
mientras le niega Finanzas.

Las secciones de cada módulo están en `packages/core/src/navigation/` y llevan
su propio predicado, así que agregar una es agregar un registro, no editar un
componente.

## Sesión

El login es real: `apps/frontend` llama a `POST /api/auth/login`, un Route
Handler que autentica contra `apps/backend` y guarda el access token en una
cookie `httpOnly` — el navegador nunca lo ve (`apps/frontend/lib/auth-cookie.ts`).
`apps/frontend/proxy.ts` (el archivo que reemplaza a `middleware.ts` desde
Next.js 16) protege las rutas privadas del lado del servidor antes de
renderizar (RF-02, RNF-03), decodificando el JWT solo para revisar su
expiración — la firma la revalida siempre el backend real.

Credencial de desarrollo (una sola empresa, ver `apps/frontend/.env.local`):

```
apexg / <ver la memoria del proyecto o pedirle la contraseña a quien la generó>
```

## Datos

`packages/data` expone los contratos (`ClientRepository`, etc.) y dos
implementaciones: una en memoria (semilla de desarrollo, sin backend) y una
HTTP real (`createHttpRepositories()`, usada por `apps/frontend`) que habla
con `apps/backend` a través del mismo proxy de sesión. Se está migrando
módulo por módulo — ver el propio código en `packages/data/src/http/` para
cuáles ya son reales.

## Notas técnicas

- Los paquetes internos se publican como TypeScript sin compilar y Next.js
  los transpila (`transpilePackages` en `next.config.ts`).
- Tailwind CSS v4 se configura desde PostCSS. Las carpetas de los paquetes se
  declaran con `@source` en `apps/frontend/app/globals.css`; sin eso, las clases
  usadas dentro de `packages/` no se generarían.
- `packages/ui` es presentacional y no importa nada de Next.js, para poder
  reutilizarse en otras aplicaciones del monorepo.
- Objetos con funciones (como las secciones, que llevan su predicado) no
  cruzan la frontera servidor/cliente. Se pasa el `id` y el cliente resuelve
  el catálogo.
