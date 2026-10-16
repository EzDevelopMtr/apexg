import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, esperarPost, irA, marca, API_BACKEND } from "../support/app";

const ID = marca();
const EFECTIVO = `E2E Visitante efectivo ${ID}`;
const TRANSFERENCIA = `E2E Visitante transferencia ${ID}`;
const VALOR_PASE = "6000";
const COMPROBANTE = new URL("../fixtures/comprobante.png", import.meta.url)
  .pathname.slice(1);

function dialogo(page: Page) {
  return page.getByRole("dialog", { name: /pase de día/i });
}

async function abrirPase(page: Page) {
  await irA(page, RUTAS.ingreso);
  await page.getByRole("button", { name: /^pase de día$/i }).click();
  await expect(dialogo(page)).toBeVisible();
}

async function venderEnEfectivo(page: Page, nombre: string) {
  await abrirPase(page);
  await dialogo(page).getByLabel("Nombre").fill(nombre);
  // El valor es libre: el pase de un día no tiene plan ni precio de catálogo.
  await dialogo(page).getByLabel(/valor/i).fill(VALOR_PASE);
  const venta = esperarPost(page, "/day-passes");
  await dialogo(page).getByRole("button", { name: /^cobrar/i }).click();
  expect((await venta).status()).toBe(201);
  await expect(dialogo(page)).toBeHidden();
}

function filaDe(page: Page, nombre: string) {
  return page.getByRole("listitem").filter({ hasText: nombre });
}

test.describe.configure({ mode: "serial" });

test.describe("F20 · Pase de día para visitantes", () => {
  caso("CP-89", "El nombre es obligatorio y el valor del pase se escribe", async ({ page }, info) => {
    await abrirPase(page);
    // El pase de un día no tiene plan: el valor lo pone quien cobra.
    await expect(dialogo(page).getByLabel(/valor/i)).toBeVisible();

    await dialogo(page).getByRole("button", { name: /^cobrar/i }).click();
    await expect(dialogo(page)).toContainText("Escribe el nombre del visitante.");
    await expect(dialogo(page)).toBeVisible();
    await info.attach("pase-sin-nombre", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-90", "Vender en efectivo sin crear cliente deja el rastro de quién lo vendió", async ({ page }, info) => {
    await venderEnEfectivo(page, EFECTIVO);

    const fila = filaDe(page, EFECTIVO);
    await expect(fila).toContainText("Efectivo");
    await expect(fila).toContainText(/vendió \S+/);
    await expect(fila).toContainText(/\$\s*[\d.]+/);

    // No es cliente: no aparece en el listado de Clientes.
    await irA(page, RUTAS.clientesTodos);
    await expect(page.getByText(EFECTIVO)).toHaveCount(0);
    await info.attach("pase-efectivo", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-91", "Por transferencia exige la foto del comprobante, y queda para verla", async ({ page }, info) => {
    await abrirPase(page);
    await dialogo(page).getByLabel("Nombre").fill(TRANSFERENCIA);
    await dialogo(page).getByLabel(/valor/i).fill(VALOR_PASE);
    await dialogo(page).getByLabel("Método de pago").selectOption("transfer");
    await dialogo(page).getByRole("button", { name: /^cobrar/i }).click();
    await expect(dialogo(page)).toContainText(/adjunta la foto del comprobante/i);

    await page.locator("#dayPassReceipt").setInputFiles(COMPROBANTE);
    const venta = esperarPost(page, "/day-passes");
    await dialogo(page).getByRole("button", { name: /^cobrar/i }).click();
    expect((await venta).status()).toBe(201);

    const fila = filaDe(page, TRANSFERENCIA);
    await expect(fila).toContainText("Transferencia");
    await fila.getByRole("button", { name: /ver comprobante/i }).click();
    const visor = page.getByRole("dialog", { name: /comprobante/i });
    await expect(visor.locator("img")).toBeVisible();
    // Visible no basta: una imagen rota también ocupa su caja. Que tenga
    // ancho propio prueba que el archivo guardado es el que se subió.
    await expect
      .poll(() => visor.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(visor).toContainText(`Pase de día de ${TRANSFERENCIA}`);
    await info.attach("comprobante-del-pase", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-92", "La API no acepta una transferencia sin comprobante ni un pase sin valor", async ({ page }) => {
    await irA(page, RUTAS.ingreso);
    const sinComprobante = await page.request.post(`${API_BACKEND}/day-passes`, {
      data: { visitorName: "E2E API", paymentMethod: "transfer", amount: "6000.00" },
    });
    expect(sinComprobante.status()).toBe(400);

    const sinValor = await page.request.post(`${API_BACKEND}/day-passes`, {
      data: { visitorName: "E2E API", paymentMethod: "cash" },
    });
    expect(sinValor.status()).toBe(400);
  });

  caso("CP-94", "El pase suma al ingreso del día y a Finanzas como rubro propio", async ({ page }, info) => {
    await irA(page, RUTAS.hoy);
    await page.getByRole("button", { name: /movimiento/i }).click();
    await expect(page.getByText(/pases de día \(\d+\)/i)).toBeVisible();
    // Aparece en el detalle de movimientos y en la lista de pases: basta con ver uno.
    await expect(page.getByText(new RegExp(EFECTIVO)).first()).toBeVisible();

    await irA(page, RUTAS.finanzasPanel);
    const origen = page.getByRole("list", { name: /ingresos del periodo por origen/i });
    await expect(origen).toContainText("Pases de día");
    await info.attach("pase-en-finanzas", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-152", "El pase aparece en Pagos como «Pase de día» y suma al total", async ({ page }, info) => {
    await irA(page, RUTAS.pagosTodos);
    await page.getByRole("textbox", { name: "Buscar por cliente" }).fill(EFECTIVO);
    const fila = page.locator("tr", { hasText: EFECTIVO });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText("Pase de día");
    await expect(fila).toContainText("$ 6.000");
    await expect(page.getByText(/1 pago · Total \$\s6\.000/)).toBeVisible();
    await info.attach("pase-en-pagos", { body: await page.screenshot(), contentType: "image/png" });

    // Un pase no tiene saldo: no entra en «Con saldo pendiente».
    await irA(page, RUTAS.pagosPendientes);
    await expect(page.getByText(EFECTIVO)).toHaveCount(0);
  });
});
