# Pruebas end to end — APEX GYM

Playwright recorriendo los flujos del plan en
[`docs/pruebas/plan-pruebas-e2e.xlsx`](../../docs/pruebas/plan-pruebas-e2e.xlsx).
Cada prueba lleva su id (`CP-xx`) en el título, y por ese id el script de
volcado encuentra la fila que debe llenar.

## Antes de correrlas

1. Backend y frontend arriba (`pnpm dev`), y Postgres con datos.
2. Credenciales en `apps/e2e/.env` (copia de `.env.example`). Ese archivo está
   en `.gitignore`: la contraseña no viaja al repositorio.
3. Navegador: `pnpm --filter @apexg/e2e install:browsers`.

## Correrlas

```bash
pnpm --filter @apexg/e2e test:e2e      # ejecuta y graba evidencia
pnpm --filter @apexg/e2e report        # abre el reporte HTML
py apps/e2e/scripts/volcar-resultados.py   # llena el xlsx
```

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
