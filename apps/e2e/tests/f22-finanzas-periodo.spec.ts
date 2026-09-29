import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA } from "../support/app";

const RANGO = /\d{1,2}( \w{3}( \d{4})?)? – \d{1,2} \w{3} \d{4}/;

function columnas(page: Page) {
  return page.getByRole("figure", { name: /ingresos y egresos/i }).locator('[tabindex="0"]');
}

function rangoVisible(page: Page) {
  return page.getByText(RANGO).first();
}

function kpi(page: Page, titulo: string) {
  return page.getByRole("region", { name: titulo, exact: true });
}

test.describe("F22 · Finanzas por periodo", () => {
  caso("CP-96", "Abre en el mes actual, día a día, con el rango escrito", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    await expect(page.getByRole("button", { name: "Mes actual" })).toHaveAttribute("aria-pressed", "true");
    await expect(rangoVisible(page)).toBeVisible();

    const hoy = new Date();
    const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    await expect(columnas(page)).toHaveCount(diasDelMes);
    await expect(page.getByText(/^por día\./i)).toBeVisible();
    await info.attach("mes-actual", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-97", "Semana pasada: siete días, comparados con la semana anterior", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    await page.getByRole("button", { name: "Semana pasada" }).click();
    await expect(columnas(page)).toHaveCount(7);
    await expect(kpi(page, "Ingresos")).toContainText(/semana anterior|periodo anterior/i);
    await info.attach("semana-pasada", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-98", "Últimos 6 meses pasa a columnas por mes", async ({ page }) => {
    await irA(page, RUTAS.finanzasPanel);
    await page.getByRole("button", { name: "Últimos 6 meses" }).click();
    await expect(columnas(page)).toHaveCount(6);
    await expect(page.getByText(/^por mes\./i)).toBeVisible();
  });

  caso("CP-99", "Personalizado filtra de verdad, y avisa si las fechas están al revés", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    await page.getByRole("button", { name: "Personalizado" }).click();

    // Un mes en que el gimnasio no existía: los ingresos del periodo son cero.
    await page.getByLabel("Desde").fill("2020-01-01");
    await page.getByLabel("Hasta").fill("2020-01-31");
    await expect(rangoVisible(page)).toHaveText("1 – 31 ene 2020");
    await expect(kpi(page, "Ingresos")).toContainText("$ 0");
    await expect(columnas(page)).toHaveCount(31);

    // Al revés: aviso, y las cifras siguen siendo las del último rango válido.
    await page.getByLabel("Desde").fill("2020-02-10");
    await expect(page.locator("p[role=alert]")).toContainText(/inicial antes de la final/i);
    await expect(rangoVisible(page)).toHaveText("1 – 31 ene 2020");
    await info.attach("personalizado-invertido", { body: await page.screenshot(), contentType: "image/png" });
  });
});
