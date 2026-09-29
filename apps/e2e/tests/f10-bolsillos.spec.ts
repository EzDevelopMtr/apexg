import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { irA, marca } from "../support/app";

const ID = marca();
const BOLSILLO = `Máquina de remo ${ID}`;
// Finanzas es una sola vista: los bolsillos y el balance viven en el resumen.
const AHORRO = "/modules/finances/dashboard";

/**
 * La tarjeta de ese bolsillo.
 *
 * Por nombre y no por posición: la pantalla acumula bolsillos de corridas
 * anteriores, y un `.last()` a secas apuntaría a cualquiera.
 */
function tarjetaDe(page: Page, nombre: string) {
  return page
    .locator("div")
    .filter({ hasText: nombre })
    .filter({ has: page.getByRole("button", { name: /^cerrar$|^reabrir$/i }) })
    .last();
}

test.describe.configure({ mode: "serial" });

test.describe("F10 · Bolsillos de ahorro", () => {
  caso("CP-33", "Crear un bolsillo con su meta", async ({ page }, info) => {
    await irA(page, AHORRO);

    await page.getByRole("button", { name: /nuevo bolsillo/i }).click();
    await page.getByLabel("Nombre").fill(BOLSILLO);
    await page.getByLabel("Meta (COP)").fill("2000000");
    await page.getByRole("button", { name: /crear bolsillo/i }).click();

    const tarjeta = tarjetaDe(page, BOLSILLO);
    await expect(tarjeta).toContainText("$ 0 de $ 2.000.000");
    await expect(tarjeta).toContainText("Faltan $ 2.000.000");

    await info.attach("bolsillo-recien-creado", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-34", "Abonar mueve la barra de avance", async ({ page }, info) => {
    await irA(page, AHORRO);

    const tarjeta = tarjetaDe(page, BOLSILLO);
    await tarjeta.getByRole("button", { name: /^abonar$/i }).click();

    const dialogo = page.getByRole("dialog", { name: /abonar al bolsillo/i });
    await dialogo.getByLabel("Monto (COP)").fill("500000");
    await dialogo.getByLabel("Nota (opcional)").fill("Excedente de la semana");
    await dialogo.getByRole("button", { name: /^abonar$/i }).click();

    // 500.000 de 2.000.000: una cuarta parte.
    const despues = tarjetaDe(page, BOLSILLO);
    await expect(despues).toContainText("$ 500.000 de $ 2.000.000");
    await expect(despues).toContainText("25%");
    await expect(despues).toContainText("Faltan $ 1.500.000");

    await info.attach("avance-tras-abonar", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-35", "Lo apartado baja la utilidad del balance", async ({ page }, info) => {
    await irA(page, AHORRO);

    // El detalle del mes en curso, en el gráfico de tendencia: lo apartado
    // aparece como línea propia, separada de los egresos, junto a la utilidad.
    // La columna de hoy: la vista abre en el mes actual, día a día.
    const mesActual = page
      .getByRole("figure", { name: /ingresos y egresos/i })
      .locator('[aria-current="true"]');
    await mesActual.hover();
    const detalle = mesActual.locator("div.absolute.bottom-full");
    await expect(detalle).toBeVisible();

    // El mes acumula aportes de corridas anteriores: no se compara contra una
    // cifra fija sino contra la regla, Utilidad = Ingresos − Egresos − Apartado.
    const texto = (await detalle.textContent()) ?? "";
    const cifra = (etiqueta: string) => {
      const hallado = texto.match(new RegExp(`${etiqueta}(-?)\\$\\s*([\\d.]+)`, "i"));
      expect(hallado, `Falta "${etiqueta}" en el detalle`).toBeTruthy();
      const [, signo, valor] = hallado as RegExpMatchArray;
      return (signo ? -1 : 1) * Number((valor ?? "").replaceAll(".", ""));
    };
    const apartado = cifra("Apartado a bolsillos");
    expect(apartado).toBeGreaterThanOrEqual(500_000);
    expect(cifra("Utilidad")).toBe(cifra("Ingresos") - cifra("Egresos") - apartado);
    await info.attach("balance-con-ahorro", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-36", "Un bolsillo cerrado no admite aportes", async ({ page }) => {
    await irA(page, AHORRO);

    await tarjetaDe(page, BOLSILLO)
      .getByRole("button", { name: /^cerrar$/i })
      .click();

    // Cerrado conserva su historial, pero el botón de abonar desaparece:
    // un control apagado obligaría a adivinar por qué no hace nada.
    const cerrado = tarjetaDe(page, BOLSILLO);
    await expect(cerrado).toContainText("Cerrado");
    await expect(cerrado).toContainText("$ 500.000 de $ 2.000.000");
    await expect(cerrado.getByRole("button", { name: /^abonar$/i })).toHaveCount(0);

    await cerrado.getByRole("button", { name: /reabrir/i }).click();
    await expect(
      tarjetaDe(page, BOLSILLO).getByRole("button", { name: /^abonar$/i }),
    ).toBeVisible();
  });
});
