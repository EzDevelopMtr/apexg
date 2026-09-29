import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, esperarPost, irA, marca } from "../support/app";

const ID = marca();
const EFECTIVO = `E2E Visitante efectivo ${ID}`;
const TRANSFERENCIA = `E2E Visitante transferencia ${ID}`;
const FRECUENTE = `E2E Visitante frecuente ${ID}`;
// Un documento propio de la corrida: el aviso de frecuente cuenta los pases
// del mes por documento, y uno fijo acumularía los de corridas anteriores.
const DOCUMENTO = `9${ID}`;
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

async function venderEnEfectivo(page: Page, nombre: string, contacto = "") {
  await abrirPase(page);
  await dialogo(page).getByLabel("Nombre").fill(nombre);
  if (contacto) {
    await dialogo(page).getByLabel(/documento o teléfono/i).fill(contacto);
  }
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
  caso("CP-89", "El nombre es obligatorio y el precio sale del plan de un día", async ({ page }, info) => {
    await abrirPase(page);
    // El precio no se escribe: lo trae el catálogo.
    await expect(dialogo(page)).toContainText(/día · \$\s*[\d.]+/i);
    await expect(dialogo(page).getByLabel(/valor|monto/i)).toHaveCount(0);

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

  caso("CP-92", "La API no acepta una transferencia sin comprobante ni un precio propio", async ({ page }) => {
    await irA(page, RUTAS.ingreso);
    const sinComprobante = await page.request.post("/api/backend/day-passes", {
      data: { visitorName: "E2E API", paymentMethod: "transfer" },
    });
    expect(sinComprobante.status()).toBe(400);

    const conPrecio = await page.request.post("/api/backend/day-passes", {
      data: { visitorName: "E2E API", paymentMethod: "cash", amount: "1.00" },
    });
    expect(conPrecio.status()).toBe(400);
  });

  caso("CP-93", "Al tercer pase del mes con el mismo documento sugiere un plan", async ({ page }, info) => {
    await venderEnEfectivo(page, FRECUENTE, DOCUMENTO);
    await venderEnEfectivo(page, FRECUENTE, DOCUMENTO);

    await abrirPase(page);
    // Con otro formato: espacios y puntos no lo vuelven otra persona.
    await dialogo(page)
      .getByLabel(/documento o teléfono/i)
      .fill(DOCUMENTO.replace(/(\d{3})(?=\d)/g, "$1."));
    await expect(dialogo(page)).toContainText(/ya compró 2 pases este mes/i);
    await expect(dialogo(page)).toContainText(/puede salirle mejor/i);
    await info.attach("visitante-frecuente", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-94", "El pase suma al ingreso del día y a Finanzas como rubro propio", async ({ page }, info) => {
    await irA(page, RUTAS.hoy);
    await page.getByRole("button", { name: /movimiento/i }).click();
    await expect(page.getByText(/pases de día \(\d+\)/i)).toBeVisible();
    await expect(page.getByText(new RegExp(EFECTIVO))).toBeVisible();

    await irA(page, RUTAS.finanzasPanel);
    const origen = page.getByRole("list", { name: /ingresos del periodo por origen/i });
    await expect(origen).toContainText("Pases de día");
    await info.attach("pase-en-finanzas", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
