# Pruebas end to end — APEX GYM

Playwright recorriendo los flujos del plan en
[`docs/pruebas/plan-pruebas-e2e.xlsx`](../../docs/pruebas/plan-pruebas-e2e.xlsx).
Cada prueba lleva su id (`CP-xx`) en el título, y por ese id el script de
volcado encuentra la fila que debe llenar.

## Antes de correrlas

1. Backend y frontend de **desarrollo** arriba (web 3100, backend 3101, base
   `apexg_work`). Nunca producción: desde el 2026-10-08 producción es el puerto
   3000 y el link público, y la suite se niega a arrancar contra ellos
   (`playwright.config.ts`; solo con `E2E_PERMITIR_PRODUCCION=1`).
2. Destino y credenciales en `apps/e2e/.env.dev.local` (gitignored, manda sobre
   `.env`): `E2E_BASE_URL`, `E2E_GYM`, `E2E_GYM_NAME`, `COOKIE_PREFIX`,
   `E2E_USERNAME`/`E2E_PASSWORD` (administrador del gimnasio de pruebas) y
   `E2E_PLATFORM_EMAIL`/`E2E_PLATFORM_PASSWORD` (super admin de plataforma de
   desarrollo, para las pruebas del panel `/admin`).
3. Navegador: `pnpm --filter @apexg/e2e install:browsers`.

## Correrlas

```bash
pnpm --filter @apexg/e2e test:e2e -- --headed   # con ventana visible y evidencia
pnpm --filter @apexg/e2e report        # abre el reporte HTML
py apps/e2e/scripts/volcar-resultados.py   # llena el xlsx
```

## Flujos por rol (F23 a F29)

Recorridos de punta a punta, cada uno con la persona que los haría:

| Archivo | Quién | Qué recorre |
| --- | --- | --- |
| `f23-usuarios-del-gimnasio` | Plataforma | Entrar al panel, crear un usuario (con clave de un solo uso), restablecerla, desactivar, reactivar, cambiar su perfil, la guarda del único administrador. |
| `f24-jornada-de-la-cajera` | Recepcionista | El usuario lo crea el panel; la cajera entra, ve solo sus tres módulos, el servidor le niega lo demás, da de alta, cobra (efectivo y transferencia), opera el Apartado diario (ingreso, pase, novedad, venta) y cierra turno. |
| `f25-ciclo-de-un-plan` | Administrador | Crear, validar, editar y cobrar un plan; promociones. |
| `f26-ciclo-de-un-cliente` | Administrador | Alta completa, documento repetido, edición, estados y conteos, búsqueda, mora que paga. |
| `f27-entrenadores-y-comisiones` | Administrador | Cupo, asignación, comisión pendiente, pago con comprobante. |
| `f28-egresos` | Administrador | Categorías, validaciones, efectivo y transferencia con comprobante. |
| `f29-el-dia-cuadra` | Administrador | Cobro + venta + pase + egreso, y que Hoy y Finanzas sumen lo mismo. |

Quien no es el administrador de la prueba trabaja en su **propio navegador**
(`support/roles.ts`): entra por el formulario, y cada uno graba su video y lo
adjunta al caso (la página de la prueba se queda en blanco mientras tanto).

Dos defectos que estos flujos encontraron, ya corregidos (2026-10-09):

- **CP-115 a CP-118, CP-151:** el Apartado diario no cargaba para el perfil
  Recepcionista; vender ahora exige `apartado_diario.*` y el formulario lee
  `GET /product-sales/catalog`, sin abrirle Inventario.
- **CP-123:** el cobro usaba el precio actual del catálogo y no el pactado al
  inscribirse; ahora usa `client_memberships.agreed_price` (`cyclePrice`).

## Evidencia

`trace`, `video` y `screenshot` están en `on`, no en `on-failure`: el plan pide
evidencia de cada caso, y un fallo que aparece una sola vez no se deja grabar
otra vez. Todo queda en `reports/`:

- `reports/html` — reporte navegable, con la traza paso a paso.
- `reports/artifacts` — videos y capturas por prueba.
- `reports/results.json` — lo que lee el script de volcado.

`reports/` no se versiona.

## Los datos los crea la propia suite

Cada archivo abre sus planes y clientes con un sufijo único por corrida, así que
dos ejecuciones no se pisan y ninguna depende de lo que ya hubiera en la base.
La mora no se fuerza en la base de datos: el cliente se crea con fecha de inicio
de hace seis meses sobre un plan mensual, y vence por el paso del tiempo, igual
que en producción.

## Lo que no se automatiza

- **CP-09 (cliente sin membresía).** El formulario exige un plan, así que ese
  estado no se puede crear por la interfaz. Queda como prueba manual sobre un
  registro histórico.
- **CP-24** verifica que el cupo mostrado es el del plan nuevo. Agotar dos días
  *distintos* exige esperar al día siguiente; eso sigue siendo manual.
