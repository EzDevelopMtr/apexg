import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearEntrenador,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const ENTRENADOR = `E2E Paga ${ID}`;
const CLIENTE = `E2E Personal ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F17 · Pagar comisiones al entrenador", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearEntrenador(page, { nombre: ENTRENADOR, documento: `43${ID}1` });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `43${ID}2`,
      plan: "Personalizado",
      entrenador: ENTRENADOR,
    });
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("200000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);
    await page.close();
  });

  caso("CP-76", "Pagar muestra el detalle y deja al entrenador al día", async ({ page }, info) => {
    await irA(page, RUTAS.entrenadoresComisiones);
    const fila = page.locator("tr", { hasText: ENTRENADOR });
    await expect(fila).toContainText("$ 100.000");

    await fila.getByRole("button", { name: new RegExp(`pagar comisiones de ${ENTRENADOR}`, "i") }).click();
    const dialogo = page.getByRole("dialog", { name: /pagar comisiones/i });
    await expect(dialogo).toContainText(CLIENTE);
    await expect(dialogo).toContainText("$ 100.000");
    await info.attach("detalle-antes-de-pagar", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toBeHidden();

    const despues = page.locator("tr", { hasText: ENTRENADOR });
    await expect(despues).toContainText("Al día");
    await expect(despues.getByRole("button", { name: /pagar/i })).toHaveCount(0);
    await info.attach("entrenador-al-dia", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
