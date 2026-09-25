import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  buscarParaIngreso,
  crearCliente,
  crearPlan,
  haceMeses,
  esperarPost,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Renovable ${ID}`;
const CLIENTE = `E2E Renueva ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F3 · Vencido paga y entra", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, {
      nombre: PLAN,
      precioPesos: 80_000,
      diasPorSemana: 6,
    });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `91${ID}1`,
      plan: PLAN,
      inicio: haceMeses(6),
    });
    await page.close();
  });

  caso("CP-10", "El cobro abre con el cliente ya seleccionado", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);
    await fila.getByRole("button", { name: /renovar o pagar día/i }).click();
    await page.waitForURL(/payments\/record/);

    // El cliente viaja en el enlace: la recepcionista no vuelve a buscarlo.
    await expect(page.locator("#clientId")).not.toHaveValue("");
    await info.attach("cobro-preseleccionado", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-11", "Cobrar en efectivo renueva el mismo plan", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);
    await fila.getByRole("button", { name: /renovar o pagar día/i }).click();
    await page.waitForURL(/payments\/record/);

    await expect(page.getByText(/membresía vencida/i)).toBeVisible();
    await expect(page.getByText(/valor a cobrar/i)).toBeVisible();

    await page.getByLabel("Monto (COP)").fill("80000");
    await page.getByLabel("Método de pago").selectOption("cash");

    const boton = page.getByRole("button", { name: /renovar y registrar pago/i });
    await expect(boton).toBeEnabled();
    await info.attach("resumen-antes-de-cobrar", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const guardado = esperarPost(page, "/payments");
    await boton.click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    await expect(page.getByText(CLIENTE).first()).toBeVisible();
  });

  caso("CP-12", "Tras renovar, el mismo cliente ya puede ingresar", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);

    await expect(fila).not.toContainText(/membresía vencida/i);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();
    await expect(page.getByText(/dentro ahora/i)).toBeVisible();

    await info.attach("circuito-cerrado", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-13", "Un cliente con varias membresías aparece una sola vez", async ({ page }) => {
    await irA(page, RUTAS.ingreso);
    await buscarParaIngreso(page, CLIENTE);

    const filas = page
      .getByRole("listbox", { name: "Clientes" })
      .locator("> div")
      .filter({ hasText: CLIENTE });
    await expect(filas).toHaveCount(1);
  });
});
