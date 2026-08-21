# APEX GYM — Monorepo

Sistema de gestion para gimnasio. El frontend es una aplicacion
**Next.js** (App Router) y el codigo compartido vive en paquetes
independientes dentro del mismo repositorio.

## Estructura

```
apexg/
├── apps/
│   └── web/                  Aplicacion Next.js (rutas, sesion, layout)
├── packages/
│   ├── core/                 Tipos, datos y catalogo de modulos (sin React)
│   ├── ui/                   Componentes visuales compartidos
│   ├── modulo-clientes/      Modulo de negocio: clientes
│   └── typescript-config/    Configuraciones de TypeScript compartidas
├── pnpm-workspace.yaml
└── turbo.json
```

La idea: **cada modulo del negocio es su propio paquete**. Cuando se
construyan Membresias, Pagos, Inventario, Finanzas o Entrenadores, cada
uno entra como `packages/modulo-<nombre>` y `apps/web` solo agrega su
ruta.

## Requisitos

- Node.js 20 o superior
- pnpm 9 (`npm install -g pnpm`)

## Comandos

Desde la raiz del repositorio:

```bash
pnpm install        # instalar dependencias de todo el monorepo
pnpm dev            # levantar la aplicacion en http://localhost:3000
pnpm build          # compilar todo
pnpm lint           # oxlint en todos los paquetes
pnpm typecheck      # revisar tipos en todos los paquetes
```

Para trabajar en un solo paquete:

```bash
pnpm --filter @apexg/web dev
pnpm --filter @apexg/ui typecheck
```

## Rutas

| Ruta                            | Pantalla                        |
| ------------------------------- | ------------------------------- |
| `/`                             | Redirige a `/modulos`           |
| `/login`                        | Inicio de sesion                |
| `/modulos`                      | Selector de modulos             |
| `/modulos/clientes`             | Redirige a `/todos`             |
| `/modulos/clientes/[seccion]`   | Modulo Clientes                 |
| `/dashboard`                    | Dashboard (aun no enlazado)     |

Secciones validas de Clientes: `todos`, `agregar`, `activos`,
`por-vencer`, `vencidos`.

## Sesion

Credenciales temporales de desarrollo:

```
usuario:    apexg
contrasena: apex2026
```

**Esto no es seguridad real.** La validacion ocurre en el navegador y
las credenciales estan escritas en el codigo
(`apps/web/lib/auth.tsx`). Cuando exista el Backend hay que:

1. Reemplazar `iniciarSesion()` por una llamada a la API.
2. Proteger las rutas en el servidor (`middleware.ts`), no solo con
   el guardia de interfaz `SesionGuard`.

## Datos

Los clientes son datos de prueba en `packages/core/src/clientes.ts` y
se mantienen en memoria: al recargar la pagina se reinician. Se
reemplazaran por datos del Backend.

## Notas tecnicas

- Los paquetes internos se publican como TypeScript sin compilar y
  Next.js los transpila (`transpilePackages` en `next.config.ts`).
- Tailwind CSS v4 se configura desde PostCSS. Las carpetas de los
  paquetes se declaran con `@source` en `apps/web/app/globals.css`;
  sin eso, las clases usadas dentro de `packages/` no se generarian.
- `packages/ui` es presentacional y no importa nada de Next.js, para
  poder reutilizarse en otras aplicaciones del monorepo.
