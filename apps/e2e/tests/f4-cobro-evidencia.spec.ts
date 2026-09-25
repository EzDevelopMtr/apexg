import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Transferencia ${ID}`;
const CLIENTE = `E2E Comprobante ${ID}`;
// Con su propio saldo intacto: el de CLIENTE queda en cero tras el CP-15, y
// entonces el rechazo que salta es el del saldo, no el del abono mínimo.
const SIN_PAGAR = `E2E Mínimo ${ID}`;
const COMPROBANTE = new URL("../fixtures/comprobante.png", import.meta.url)
  .pathname.slice(1);

test.describe.configure({ mode: "serial" });

test.describe("F4 · Cobro con evidencia", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, {
      nombre: PLAN,
      precioPesos: 100_000,
      diasPorSemana: 6,
      abonoMinimoPesos: 50_000,
    });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `92${ID}1`,
      plan: PLAN,
    });
    await crearCliente(page, {
      nombre: SIN_PAGAR,
      documento: `92${ID}2`,
      plan: PLAN,
    });
    await page.close();
  });

  caso("CP-14", "Transferencia sin comprobante se rechaza", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("100000");
    await page.getByLabel("Método de pago").selectOption("transfer");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/comprobante/i);
    await info.attach("rechazo-sin-comprobante", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-15", "Con comprobante adjunto el pago se registra", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("100000");
    await page.getByLabel("Método de pago").selectOption("transfer");
    await page.locator("#receipt").setInputFiles(COMPROBANTE);
    await esperarResumenDePago(page);
    // Esperar la respuesta, no solo el clic: navegar antes de que el POST
    // vuelva abortaba la petición y el pago no llegaba a registrarse.
    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    await expect(page.getByText(CLIENTE).first()).toBeVisible();
  });

  caso("CP-16", "El comprobante se ve en un panel sobre el listado", async ({ page }, info) => {
    await irA(page, RUTAS.pagosTodos);
    const urlAntes = page.url();

    const fila = page.locator("tr", { hasText: CLIENTE }).first();
    await fila.getByRole("button").last().click();

    const imagen = page.getByRole("dialog").or(page.locator("img[src*='receipt']"));
    await expect(imagen.first()).toBeVisible();
    // Un panel, no una redirección: la dirección del navegador no cambia y la
    // ruta del archivo nunca queda a la vista.
    expect(page.url()).toBe(urlAntes);

    await info.attach("visor-de-comprobante", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await page.keyboard.press("Escape");
  });

  caso("CP-17", "Cambiar a efectivo descarta el archivo adjunto", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Método de pago").selectOption("transfer");
    await page.locator("#receipt").setInputFiles(COMPROBANTE);

    await page.getByLabel("Método de pago").selectOption("cash");
    await expect(page.locator("#receipt")).toHaveCount(0);

    await page.getByLabel("Método de pago").selectOption("transfer");
    await expect(page.locator("#receipt")).toHaveValue("");
  });

  caso("CP-18", "Un abono por debajo del mínimo se rechaza", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", SIN_PAGAR);
    await page.getByLabel("Monto (COP)").fill("10000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(new RegExp(PLAN));
    await info.attach("abono-minimo", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
});
