import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, elegirOpcion, esperarPost, irA, marca } from "../support/app";

const ID = marca();
const CATEGORIA = `E2E Servicios ${ID}`;
const EFECTIVO = `Pago del agua ${ID}`;
const TRANSFERENCIA = `Arriendo del local ${ID}`;
const COMPROBANTE = new URL("../fixtures/comprobante.png", import.meta.url).pathname.slice(1);
const HOY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

const dialogo = (page: Page) => page.getByRole("dialog");

/** Las categorías de egresos, abiertas como ventana sobre el listado. */
async function abrirCategorias(page: Page): Promise<void> {
  await irA(page, RUTAS.categoriasEgresos);
  await expect(dialogo(page)).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.describe("F28 · Egresos, de la categoría al comprobante", () => {
  caso("CP-138", "Una categoría nueva se ofrece al registrar; retirarla la quita y reactivarla la devuelve", async ({ page }, info) => {
    await abrirCategorias(page);
    await dialogo(page).getByLabel("Nueva categoría").fill(CATEGORIA);
    await dialogo(page).getByRole("button", { name: /^agregar$/i }).click();
    const item = dialogo(page).getByRole("listitem").filter({ hasText: CATEGORIA });
    await expect(item).toContainText("Activa");

    const opcionesEn = async () => {
      await irA(page, RUTAS.egresosNuevo);
      return page.getByLabel("Categoría").locator("option").allTextContents();
    };
    expect((await opcionesEn()).some((texto) => texto.includes(CATEGORIA))).toBe(true);

    await abrirCategorias(page);
    await dialogo(page).getByRole("listitem").filter({ hasText: CATEGORIA }).getByRole("button", { name: "Retirar" }).click();
    await expect(dialogo(page).getByRole("listitem").filter({ hasText: CATEGORIA })).toContainText("Inactiva");
    expect((await opcionesEn()).some((texto) => texto.includes(CATEGORIA))).toBe(false);
    await info.attach("categoria-retirada", { body: await page.screenshot(), contentType: "image/png" });

    await abrirCategorias(page);
    await dialogo(page).getByRole("listitem").filter({ hasText: CATEGORIA }).getByRole("button", { name: "Reactivar" }).click();
    expect((await opcionesEn()).some((texto) => texto.includes(CATEGORIA))).toBe(true);
  });

  caso("CP-139", "Un egreso sin categoría, sin concepto o con valor cero no se registra, y cada falta se dice", async ({ page }) => {
    await irA(page, RUTAS.egresosNuevo);
    await dialogo(page).getByRole("button", { name: /registrar egreso/i }).click();
    await expect(dialogo(page).getByText("Selecciona una categoría.")).toBeVisible();
    await expect(dialogo(page).getByText("El concepto es obligatorio.")).toBeVisible();
    await expect(dialogo(page).getByText("El valor debe ser mayor que cero.")).toBeVisible();
    await expect(dialogo(page)).toBeVisible();
  });

  caso("CP-140", "Un egreso en efectivo queda en el listado con su categoría, valor, fecha y forma de pago", async ({ page }, info) => {
    await irA(page, RUTAS.egresosNuevo);
    await elegirOpcion(page, "Categoría", CATEGORIA);
    await dialogo(page).getByLabel("Concepto / justificación").fill(EFECTIVO);
    await dialogo(page).getByLabel("Valor (COP)").fill("35000");
    await dialogo(page).getByLabel("Forma de pago").selectOption("cash");
    const registro = esperarPost(page, "/expenses");
    await dialogo(page).getByRole("button", { name: /registrar egreso/i }).click();
    expect((await registro).status()).toBe(201);
    await expect(dialogo(page)).toBeHidden();

    const fila = page.locator("tr", { hasText: EFECTIVO });
    await expect(fila).toContainText(CATEGORIA);
    await expect(fila).toContainText("$ 35.000");
    await expect(fila).toContainText(HOY);
    await expect(fila).toContainText("Efectivo");
    await info.attach("egreso-en-efectivo", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-141", "Una transferencia exige la foto del comprobante; con ella el egreso queda y el comprobante se ve", async ({ page }, info) => {
    await irA(page, RUTAS.egresosNuevo);
    await elegirOpcion(page, "Categoría", CATEGORIA);
    await dialogo(page).getByLabel("Concepto / justificación").fill(TRANSFERENCIA);
    await dialogo(page).getByLabel("Valor (COP)").fill("120000");
    await dialogo(page).getByLabel("Forma de pago").selectOption("transfer");
    await dialogo(page).getByRole("button", { name: /registrar egreso/i }).click();
    await expect(dialogo(page).getByText(/adjunta la foto del comprobante/i)).toBeVisible();

    await page.locator("#expenseReceipt").setInputFiles(COMPROBANTE);
    const registro = esperarPost(page, "/expenses");
    await dialogo(page).getByRole("button", { name: /registrar egreso/i }).click();
    expect((await registro).status()).toBe(201);
    await expect(dialogo(page)).toBeHidden();

    await page.getByRole("button", { name: `Ver comprobante de ${TRANSFERENCIA}` }).click();
    const visor = dialogo(page);
    await expect(visor.locator("img")).toBeVisible();
    await expect
      .poll(() => visor.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await info.attach("comprobante-del-egreso", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-142", "Los egresos más recientes salen primero en el listado", async ({ page }) => {
    await irA(page, RUTAS.egresosTodos);
    const fechas = await page.locator("tbody tr td:nth-child(4)").allTextContents();
    expect(fechas.length).toBeGreaterThanOrEqual(2);
    const ordenadas = [...fechas].sort((a, b) => b.localeCompare(a));
    expect(fechas).toEqual(ordenadas);
  });
});
