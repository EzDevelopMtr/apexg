import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA } from "../support/app";

test.describe.configure({ mode: "serial" });

/** Filas de datos de la tabla (sin la de "no hay pagos"). */
const filas = (page: Page) =>
  page.locator("tbody tr").filter({ hasNot: page.getByText(/no hay pagos/i) });

test.describe("F19 · Filtros por columna en pagos", () => {
  caso("CP-84", "Filtrar por método deja solo ese método y actualiza el total", async ({ page }, info) => {
    await irA(page, RUTAS.pagosTodos);
    const resumen = page.getByText(/pagos? · total/i);
    const antes = await resumen.textContent();

    await page.getByLabel("Método").selectOption("transfer");
    const vistas = filas(page);
    const cuantas = await vistas.count();
    for (let i = 0; i < cuantas; i++) {
      await expect(vistas.nth(i)).toContainText("Transferencia");
    }
    await expect(resumen).not.toHaveText(antes ?? "");
    await expect(resumen).toContainText(`${cuantas} pago`);

    await info.attach("filtro-transferencia", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-85", "Buscar por cliente ignora tildes y mayúsculas", async ({ page }) => {
    await irA(page, RUTAS.pagosTodos);
    await page.getByLabel("Buscar por cliente").fill("PEREZ");
    const vistas = filas(page);
    await expect(vistas.first()).toContainText("Juan Pérez");
    const cuantas = await vistas.count();
    for (let i = 0; i < cuantas; i++) {
      await expect(vistas.nth(i)).toContainText("Juan Pérez");
    }
  });

  caso("CP-86", "El rango de fechas y el tipo se combinan, y Limpiar devuelve todo", async ({ page }, info) => {
    await irA(page, RUTAS.pagosTodos);
    const total = await filas(page).count();

    await page.getByLabel("Desde").fill("2026-09-14");
    await page.getByLabel("Hasta").fill("2026-09-14");
    await page.getByLabel("Tipo").selectOption("finalInstallment");
    // Cada fila que queda cumple los DOS criterios, sin importar cuántas sean.
    const vistas = filas(page);
    await expect(vistas.first()).toBeVisible();
    const cuantas = await vistas.count();
    expect(cuantas).toBeLessThan(total);
    for (let i = 0; i < cuantas; i++) {
      await expect(vistas.nth(i)).toContainText("Abono final");
      await expect(vistas.nth(i)).toContainText("2026-09-14");
    }

    await info.attach("rango-y-tipo", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await page.getByRole("button", { name: /limpiar filtros/i }).click();
    await expect(filas(page)).toHaveCount(total);
    await expect(page.getByRole("button", { name: /limpiar filtros/i })).toHaveCount(0);
  });

  caso("CP-87", "Los filtros de columna afinan la sección, no la reemplazan", async ({ page }) => {
    await irA(page, RUTAS.pagosPendientes);
    const pendientes = await filas(page).count();
    await page.getByLabel("Método").selectOption("cash");
    expect(await filas(page).count()).toBeLessThanOrEqual(pendientes);
  });
});

test.describe("F19b · Saldo tras el pago", () => {
  caso("CP-88", "Un abono ya completado dice cuándo se saldó, aunque el pago final esté filtrado", async ({ page }, info) => {
    await irA(page, RUTAS.pagosTodos);
    await expect(page.getByRole("columnheader", { name: /saldo tras el pago/i })).toBeVisible();

    // Oscar Lopez: 1.º abono con $15.000 de saldo, completado el 23 sep.
    const abono = page
      .locator("tbody tr", { hasText: "Oscar Lopez" })
      .filter({ hasText: "1.º abono" });
    await expect(abono).toContainText("$ 15.000");
    await expect(abono).toContainText(/saldado el \d+ \w{3}/i);

    // Con el filtro "Abono" el pago final desaparece de la tabla, pero la
    // marca sigue: se calcula sobre todos los pagos.
    await page.getByLabel("Tipo").selectOption("installment");
    await expect(abono).toContainText(/saldado el/i);

    await info.attach("saldado-el", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
});
