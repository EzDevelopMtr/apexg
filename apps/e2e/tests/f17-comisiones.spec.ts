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

/** Un cliente personalizado del entrenador que paga $ 200.000: le deja $ 100.000. */
async function clienteQuePaga(page: Page, entrenador: string, cliente: string, documento: string) {
  await crearCliente(page, { nombre: cliente, documento, plan: "Personalizado", entrenador });
  await irA(page, RUTAS.cobrar);
  await elegirOpcion(page, "Cliente", cliente);
  await page.getByLabel("Monto (COP)").fill("200000");
  await page.getByLabel("Método de pago").selectOption("cash");
  await esperarResumenDePago(page);
  const guardado = esperarPost(page, "/payments");
  await page.getByRole("button", { name: /registrar pago/i }).click();
  expect((await guardado).status()).toBe(201);
}

/** Un entrenador con un cliente personalizado que ya pagó: le debe $ 100.000. */
async function entrenadorConComision(page: Page, entrenador: string, cliente: string, sufijo: string) {
  await crearEntrenador(page, { nombre: entrenador, documento: `43${ID}${sufijo}1` });
  await clienteQuePaga(page, entrenador, cliente, `43${ID}${sufijo}2`);
}

/** La cifra de un indicador de Finanzas («Utilidad», «Comisiones por pagar»). */
async function indicador(page: Page, titulo: string): Promise<number> {
  return pesos((await page.getByRole("region", { name: titulo, exact: true }).textContent()) ?? "");
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

// Con varios entrenadores a la vez: A con una comisión, B con dos.
const ENTRENADOR_A = `E2E Varios A ${ID}`;
const ENTRENADOR_B = `E2E Varios B ${ID}`;
let utilidadAntes = 0;

test.describe("F17 · Comisiones de varios entrenadores", () => {
  test.beforeAll(async ({ browser }) => {
    // Dos entrenadores y tres clientes con su cobro: no cabe en los 60 s.
    test.setTimeout(240_000);
    const page = await browser.newPage();
    await crearEntrenador(page, { nombre: ENTRENADOR_A, documento: `44${ID}1` });
    await crearEntrenador(page, { nombre: ENTRENADOR_B, documento: `44${ID}2` });
    await clienteQuePaga(page, ENTRENADOR_A, `E2E Varios A1 ${ID}`, `44${ID}3`);
    await clienteQuePaga(page, ENTRENADOR_B, `E2E Varios B1 ${ID}`, `44${ID}4`);
    await clienteQuePaga(page, ENTRENADOR_B, `E2E Varios B2 ${ID}`, `44${ID}5`);
    await page.close();
  });

  caso("CP-154", "Pagarle a un entrenador no toca lo pendiente de otro", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    utilidadAntes = await indicador(page, "Utilidad");
    const porPagarAntes = await indicador(page, "Comisiones por pagar");

    const filaB = page.locator("tr", { hasText: ENTRENADOR_B });
    await expect(filaB).toContainText("$ 200.000");

    const filaA = page.locator("tr", { hasText: ENTRENADOR_A });
    await filaA.getByRole("button", { name: new RegExp(`pagar comisiones de ${ENTRENADOR_A}`, "i") }).click();
    const dialogo = page.getByRole("dialog", { name: /pagar comisiones/i });
    await expect(dialogo).toContainText("$ 100.000");
    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toBeHidden();

    await expect(filaA).toContainText("Al día");
    // B sigue debiendo sus dos comisiones, con su botón de pagar.
    await expect(filaB).toContainText("$ 200.000");
    await expect(filaB.getByRole("button", { name: /pagar/i })).toBeVisible();
    await expect.poll(() => indicador(page, "Comisiones por pagar")).toBe(porPagarAntes - 100_000);
    await info.attach("a-pagado-b-pendiente", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-155", "Dos pagos el mismo día suman en la utilidad y quedan como dos egresos", async ({ page }, info) => {
    await irA(page, RUTAS.finanzasPanel);
    const filaB = page.locator("tr", { hasText: ENTRENADOR_B });
    await filaB.getByRole("button", { name: new RegExp(`pagar comisiones de ${ENTRENADOR_B}`, "i") }).click();
    const dialogo = page.getByRole("dialog", { name: /pagar comisiones/i });
    // Las dos comisiones de B en un solo pago.
    await expect(dialogo).toContainText(`E2E Varios B1 ${ID}`);
    await expect(dialogo).toContainText(`E2E Varios B2 ${ID}`);
    await expect(dialogo).toContainText("$ 200.000");
    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toBeHidden();
    await expect(filaB).toContainText("Al día");

    await expect.poll(() => indicador(page, "Utilidad")).toBe(utilidadAntes - 300_000);

    await irA(page, RUTAS.egresosTodos);
    const egresoA = page.locator("tr", { hasText: `Comisiones de ${ENTRENADOR_A}` });
    const egresoB = page.locator("tr", { hasText: `Comisiones de ${ENTRENADOR_B}` });
    await expect(egresoA).toHaveCount(1);
    await expect(egresoA).toContainText("$ 100.000");
    await expect(egresoA).toContainText("1 comisión");
    await expect(egresoB).toHaveCount(1);
    await expect(egresoB).toContainText("$ 200.000");
    await expect(egresoB).toContainText("2 comisiones");
    await info.attach("dos-egresos", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
});
