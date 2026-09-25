import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  elegirOpcion,
  esperarPost,
  buscarParaIngreso,
  crearCliente,
  crearPlan,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN_BASE = `E2E Base ${ID}`;
const PLAN_DOS = `E2E Dos días ${ID}`;
const CLIENTE = `E2E Cambia ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F6 · Administrar planes", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, {
      nombre: PLAN_BASE,
      precioPesos: 80_000,
      diasPorSemana: 6,
    });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `94${ID}1`,
      plan: PLAN_BASE,
    });
    await page.close();
  });

  caso("CP-22", "El cupo semanal es una lista de 1 a 6", async ({ page }, info) => {
    await irA(page, RUTAS.planesNuevo);

    const opciones = await page
      .getByLabel("Días por semana")
      .locator("option")
      .allTextContents();
    expect(opciones).toHaveLength(6);
    expect(opciones.join(" ")).not.toMatch(/sin límite/i);

    await info.attach("cupo-semanal", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await crearPlan(page, {
      nombre: PLAN_DOS,
      precioPesos: 45_000,
      diasPorSemana: 2,
    });
  });

  caso("CP-23", "Cambiar de plan abre un periodo nuevo", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);
    await page.getByRole("button", { name: `Editar a ${CLIENTE}` }).click();

    await elegirOpcion(page, "Tipo de membresía", PLAN_DOS);
    // Cambiar de plan son dos peticiones: los datos del cliente y la
    // membresía nueva. Salir de la pantalla antes de la segunda la abortaba,
    // y el cliente se quedaba con el plan viejo.
    const abierta = esperarPost(page, "/memberships");
    await page.getByRole("button", { name: /guardar cliente/i }).click();
    expect((await abierta).status()).toBe(201);

    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);
    await expect(fila).toContainText(PLAN_DOS);
  });

  caso("CP-24", "El cupo del plan nuevo es el que manda", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();

    const despues = await buscarParaIngreso(page, CLIENTE);
    await expect(despues).toContainText(PLAN_DOS);
    await info.attach("cupo-del-plan-nuevo", {
      body: await despues.screenshot(),
      contentType: "image/png",
    });
  });
});
