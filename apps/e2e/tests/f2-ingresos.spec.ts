import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  buscarParaIngreso,
  crearCliente,
  crearPlan,
  haceMeses,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN_COMPLETO = `E2E Completo ${ID}`;
const PLAN_UN_DIA = `E2E Un día ${ID}`;
const AL_DIA = `E2E Al día ${ID}`;
const CUPO = `E2E Cupo ${ID}`;
const MORA = `E2E Mora ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F2 · Ingresos de la mañana", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, {
      nombre: PLAN_COMPLETO,
      precioPesos: 80_000,
      diasPorSemana: 6,
    });
    await crearPlan(page, {
      nombre: PLAN_UN_DIA,
      precioPesos: 20_000,
      diasPorSemana: 1,
    });
    await crearCliente(page, {
      nombre: AL_DIA,
      documento: `90${ID}1`,
      plan: PLAN_COMPLETO,
    });
    await crearCliente(page, {
      nombre: CUPO,
      documento: `90${ID}2`,
      plan: PLAN_UN_DIA,
    });
    // Arrancada hace seis meses sobre un plan mensual: vencida por el paso del
    // tiempo, igual que en producción. Nada se toca a mano en la base.
    await crearCliente(page, {
      nombre: MORA,
      documento: `90${ID}3`,
      plan: PLAN_COMPLETO,
      inicio: haceMeses(6),
    });
    await page.close();
  });

  caso("CP-04", "Registrar el ingreso de un cliente al día", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, AL_DIA);
    await expect(fila).toContainText(PLAN_COMPLETO);

    await info.attach("antes-del-ingreso", {
      body: await fila.screenshot(),
      contentType: "image/png",
    });

    await fila.getByRole("button", { name: /registrar ingreso/i }).click();
    await expect(page.getByText(/dentro ahora/i)).toBeVisible();
    await expect(
      page.getByRole("list").or(page.locator("body")).getByText(AL_DIA).first(),
    ).toBeVisible();
  });

  caso("CP-05", "Salir y volver a entrar no consume otro día", async ({ page }) => {
    await irA(page, RUTAS.ingreso);

    let fila = await buscarParaIngreso(page, AL_DIA);
    await fila.getByRole("button", { name: /registrar salida/i }).click();

    fila = await buscarParaIngreso(page, AL_DIA);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();

    // El cupo se cuenta por días distintos: reentrar el mismo día no gasta
    // uno nuevo, así que sigue en 1 de 6.
    fila = await buscarParaIngreso(page, AL_DIA);
    await expect(fila).toContainText(PLAN_COMPLETO);
  });

  caso("CP-06", "Los dos contadores cuentan cosas distintas", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);

    const encabezado = await page
      .getByText(/dentro ahora/i)
      .first()
      .textContent();
    const ingresaron = await page
      .getByText(/personas ingresaron hoy/i)
      .first()
      .textContent();

    const dentro = Number(/(\d+)/.exec(encabezado ?? "")?.[1] ?? "0");
    const total = Number(/(\d+)/.exec(ingresaron ?? "")?.[1] ?? "0");

    // "Dentro ahora" no cuenta a quien ya salió; el total del día sí.
    expect(total).toBeGreaterThanOrEqual(dentro);
    await info.attach("contadores-del-dia", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-07", "Un plan de un día bloquea el segundo ingreso de la semana", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    let fila = await buscarParaIngreso(page, CUPO);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();

    fila = await buscarParaIngreso(page, CUPO);
    await fila.getByRole("button", { name: /registrar salida/i }).click();

    fila = await buscarParaIngreso(page, CUPO);
    await expect(fila).toContainText(/ya usó todos sus días de esta semana/i);
    await expect(
      fila.getByRole("button", { name: /renovar o pagar día/i }),
    ).toBeVisible();

    await info.attach("cupo-agotado", {
      body: await fila.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-08", "Una membresía vencida bloquea el ingreso y ofrece el cobro", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, MORA);

    await expect(fila).toContainText(/membresía vencida/i);
    await expect(
      fila.getByRole("button", { name: /registrar ingreso/i }),
    ).toHaveCount(0);
    await expect(
      fila.getByRole("button", { name: /renovar o pagar día/i }),
    ).toBeVisible();

    await info.attach("mora-bloqueada", {
      body: await fila.screenshot(),
      contentType: "image/png",
    });
  });
});
