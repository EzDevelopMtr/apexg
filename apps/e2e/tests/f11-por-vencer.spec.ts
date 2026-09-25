import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  buscarParaIngreso,
  crearCliente,
  crearPlan,
  haceDias,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Vence ${ID}`;
const POR_VENCER = `E2E Por vencer ${ID}`;
const AL_DIA = `E2E Tranquilo ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F11 · Membresía por vencer", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, { nombre: PLAN, precioPesos: 80_000, diasPorSemana: 6 });
    // Plan mensual arrancado hace 27 días: vence dentro de la ventana de
    // aviso sin estar vencido.
    await crearCliente(page, {
      nombre: POR_VENCER,
      documento: `70${ID}1`,
      plan: PLAN,
      inicio: haceDias(27),
    });
    await crearCliente(page, {
      nombre: AL_DIA,
      documento: `70${ID}2`,
      plan: PLAN,
    });
    await page.close();
  });

  caso("CP-37", "El listado marca en ámbar al que está por vencer", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);

    const fila = page.getByRole("row", { name: new RegExp(POR_VENCER) });
    await expect(fila).toContainText("Por vencer");
    await expect(fila).toContainText(/vence (hoy|mañana|en \d+ días)/i);

    // El que está al día sigue en verde: el aviso distingue, no alarma a todos.
    const tranquila = page.getByRole("row", { name: new RegExp(AL_DIA) });
    await expect(tranquila).toContainText("Activo");
    await expect(tranquila).not.toContainText("Por vencer");

    await info.attach("listado-con-aviso", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-38", "El panel de ingreso avisa sin bloquear", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);

    const fila = await buscarParaIngreso(page, POR_VENCER);
    await expect(fila).toContainText(/ofrécele renovar/i);
    // Avisa, no impide: el botón de ingreso sigue ahí.
    await expect(
      fila.getByRole("button", { name: /registrar ingreso/i }),
    ).toBeVisible();

    await info.attach("ingreso-con-aviso", {
      body: await fila.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-39", "Al que está al día no se le avisa nada", async ({ page }) => {
    await irA(page, RUTAS.ingreso);

    const fila = await buscarParaIngreso(page, AL_DIA);
    await expect(fila).not.toContainText(/ofrécele renovar/i);
    await expect(
      fila.getByRole("button", { name: /registrar ingreso/i }),
    ).toBeVisible();
  });
});
