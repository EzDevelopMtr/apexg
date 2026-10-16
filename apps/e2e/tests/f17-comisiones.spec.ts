import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
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
const ENTRENADOR_FINANZAS = `E2E Paga Finanzas ${ID}`;
const CLIENTE_FINANZAS = `E2E Personal Finanzas ${ID}`;

/** «$ 1.234.567» → 1234567. El signo menos, si lo hay, se conserva. */
function pesos(texto: string): number {
  const hallado = texto.match(/(-?)\s*\$\s*(-?)\s*([\d.]+)/);
  expect(hallado, `No hay una cifra en «${texto}»`).toBeTruthy();
  const [, signo, signoDentro, valor] = hallado as RegExpMatchArray;
  return (signo || signoDentro ? -1 : 1) * Number((valor ?? "").replaceAll(".", ""));
}

/** Un entrenador con un cliente personalizado que ya pagó: le debe $ 100.000. */
async function entrenadorConComision(page: Page, entrenador: string, cliente: string, sufijo: string) {
  await crearEntrenador(page, { nombre: entrenador, documento: `43${ID}${sufijo}1` });
  await crearCliente(page, {
    nombre: cliente,
    documento: `43${ID}${sufijo}2`,
    plan: "Personalizado",
    entrenador,
  });
  await irA(page, RUTAS.cobrar);
  await elegirOpcion(page, "Cliente", cliente);
  await page.getByLabel("Monto (COP)").fill("200000");
  await page.getByLabel("Método de pago").selectOption("cash");
  await esperarResumenDePago(page);
  const guardado = esperarPost(page, "/payments");
  await page.getByRole("button", { name: /registrar pago/i }).click();
  expect((await guardado).status()).toBe(201);
}

test.describe.configure({ mode: "serial" });

test.describe("F17 · Pagar comisiones al entrenador", () => {
  test.beforeAll(async ({ browser }) => {
    // Dos entrenadores, cada uno con su cliente y su cobro: no cabe en los 60 s.
    test.setTimeout(150_000);
    const page = await browser.newPage();
    await entrenadorConComision(page, ENTRENADOR, CLIENTE, "");
    await entrenadorConComision(page, ENTRENADOR_FINANZAS, CLIENTE_FINANZAS, "9");
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

  caso("CP-153", "Pagar desde Finanzas baja la utilidad y queda en Egresos", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    const utilidad = page.getByRole("region", { name: "Utilidad", exact: true });
    const antes = pesos((await utilidad.textContent()) ?? "");

    const fila = page.locator("tr", { hasText: ENTRENADOR_FINANZAS });
    await fila.getByRole("button", { name: new RegExp(`pagar comisiones de ${ENTRENADOR_FINANZAS}`, "i") }).click();
    const dialogo = page.getByRole("dialog", { name: /pagar comisiones/i });
    await expect(dialogo).toContainText("$ 100.000");
    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.locator("tr", { hasText: ENTRENADOR_FINANZAS })).toContainText("Al día");

    // La comisión pagada es un egreso del día: la utilidad baja lo mismo.
    await expect.poll(async () => pesos((await utilidad.textContent()) ?? "")).toBe(antes - 100_000);
    await info.attach("pagado-desde-finanzas", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

    await irA(page, RUTAS.egresosTodos);
    const egreso = page.locator("tr", { hasText: `Comisiones de ${ENTRENADOR_FINANZAS}` });
    await expect(egreso).toContainText("$ 100.000");
    await expect(egreso).toContainText("Comisiones de entrenadores");
    await info.attach("comision-en-egresos", { body: await page.screenshot(), contentType: "image/png" });
  });
});
