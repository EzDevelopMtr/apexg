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
`packages/module-<nombre>` y `apps/web` solo agrega su ruta.

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

Credenciales temporales de desarrollo:

```
apexg     / apex2026    (administrador)
recepcion / apex2026    (recepcionista)
```

**Esto no es seguridad real.** La validación ocurre en el navegador y las
credenciales están escritas en el código (`apps/web/lib/session.tsx`). Cuando
exista el Backend hay que:

1. Autenticar contra la API con contraseñas cifradas (RF-01, RNF-02).
2. Guardar la sesión en una cookie `httpOnly`.
3. Proteger las rutas en `middleware.ts`, no solo con el guardia de interfaz
   `SessionGuard` (RF-02, RNF-03).

## Datos

No hay backend todavía. `packages/data` expone el contrato
`ClientRepository` y una implementación en memoria que se reinicia al
recargar. Los componentes dependen del contrato, nunca de la
implementación: cambiarla por un cliente HTTP no toca la interfaz.

## Notas técnicas

- Los paquetes internos se publican como TypeScript sin compilar y Next.js
  los transpila (`transpilePackages` en `next.config.ts`).
- Tailwind CSS v4 se configura desde PostCSS. Las carpetas de los paquetes se
  declaran con `@source` en `apps/web/app/globals.css`; sin eso, las clases
  usadas dentro de `packages/` no se generarían.
- `packages/ui` es presentacional y no importa nada de Next.js, para poder
  reutilizarse en otras aplicaciones del monorepo.
- Objetos con funciones (como las secciones, que llevan su predicado) no
  cruzan la frontera servidor/cliente. Se pasa el `id` y el cliente resuelve
  el catálogo.
