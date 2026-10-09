import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearItemInventario,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Cuadra Plan ${ID}`;
const CLIENTE = `E2E Cuadra Cliente ${ID}`;
const PRODUCTO = `E2E Cuadra Barra ${ID}`;
const VISITANTE = `E2E Cuadra Visitante ${ID}`;
const EGRESO = `E2E Cuadra Luz ${ID}`;

const PAGO = 80_000;
const VENTA = 15_000;
const PASE = 6_000;
const GASTO = 20_000;

/** «$ 1.234.567» → 1234567. El signo menos, si lo hay, se conserva. */
function pesos(texto: string): number {
  const hallado = texto.match(/(-?)\s*\$\s*(-?)\s*([\d.]+)/);
  expect(hallado, `No hay una cifra en «${texto}»`).toBeTruthy();
  const [, signo, signoDentro, valor] = hallado as RegExpMatchArray;
  return (signo || signoDentro ? -1 : 1) * Number((valor ?? "").replaceAll(".", ""));
}

interface Hoy {
  ingresos: number;
  pagos: number;
  ventas: number;
  pases: number;
}

/** El resumen de «Hoy»: el total del día y de dónde salió cada peso. */
async function leerHoy(page: Page): Promise<Hoy> {
  await irA(page, RUTAS.hoy);
  const total = page.getByText(/^ingresos del día$/i).locator("xpath=following-sibling::p[1]");
  const desglose = (await page.getByText(/^Pagos \$\s.* · Ventas \$\s.* · Pases \$\s/).textContent()) ?? "";
  const parte = (rotulo: string) => pesos(desglose.match(new RegExp(`${rotulo} (\\$\\s[\\d.]+)`))?.[1] ?? "");
  return {
    ingresos: pesos((await total.textContent()) ?? ""),
    pagos: parte("Pagos"),
    ventas: parte("Ventas"),
    pases: parte("Pases"),
  };
}

interface Finanzas {
  ingresos: number;
  utilidad: number;
}

/**
 * Los indicadores de Finanzas en el mes en curso. No hay uno de «Egresos»: se
 * ven en la utilidad, que es ingresos menos egresos menos lo apartado.
 */
async function leerFinanzas(page: Page): Promise<Finanzas> {
  await irA(page, RUTAS.finanzasPanel);
  const cifra = async (titulo: string) =>
    pesos((await page.getByRole("region", { name: titulo, exact: true }).textContent()) ?? "");
  return { ingresos: await cifra("Ingresos"), utilidad: await cifra("Utilidad") };
}

let hoyAntes: Hoy;
let finanzasAntes: Finanzas;

test.describe.configure({ mode: "serial" });

test.describe("F29 · El día de punta a punta: lo que se cobra, se vende y se gasta cuadra en todos los módulos", () => {
  caso("CP-143", "Se toma la foto de partida: el total de hoy y los indicadores del mes", async ({ page }, info) => {
    hoyAntes = await leerHoy(page);
    expect(hoyAntes.ingresos).toBe(hoyAntes.pagos + hoyAntes.ventas + hoyAntes.pases);
    finanzasAntes = await leerFinanzas(page);
    await info.attach("foto-de-partida", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-144", "Cobro en efectivo de un cliente nuevo: el plan, el alta y el pago", async ({ page }) => {
    await crearPlan(page, { nombre: PLAN, precioPesos: PAGO, diasPorSemana: 6 });
    await crearCliente(page, { nombre: CLIENTE, documento: `64${ID}1`, plan: PLAN });
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill(String(PAGO));
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    const cobro = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await cobro).status()).toBe(201);
  });

  caso("CP-145", "Venta de dos productos en el mostrador", async ({ page }) => {
    await crearItemInventario(page, { nombre: PRODUCTO, stock: 10, minimo: 2 });
    await irA(page, RUTAS.venta);
    await elegirOpcion(page, "Producto", PRODUCTO);
    await page.getByLabel("Cantidad").fill("2");
    await page.getByLabel("Valor cobrado (COP)").fill(String(VENTA));
    await page.getByLabel("Forma de pago").selectOption("cash");
    const venta = esperarPost(page, "/product-sales");
    await page.getByRole("dialog").getByRole("button", { name: /registrar venta/i }).click();
    expect((await venta).status()).toBe(201);
  });

  caso("CP-146", "Pase de día para un visitante", async ({ page }) => {
    await irA(page, RUTAS.hoy);
    await page.getByRole("button", { name: /^pase de día$/i }).click();
    const dialogo = page.getByRole("dialog", { name: /pase de día/i });
    await dialogo.getByLabel("Nombre").fill(VISITANTE);
    await dialogo.getByLabel(/valor/i).fill(String(PASE));
    const pase = esperarPost(page, "/day-passes");
    await dialogo.getByRole("button", { name: /^cobrar/i }).click();
    expect((await pase).status()).toBe(201);
  });

  caso("CP-147", "Un egreso del día", async ({ page }) => {
    await irA(page, RUTAS.egresosNuevo);
    const dialogo = page.getByRole("dialog");
    const categoria = await dialogo.getByLabel("Categoría").locator("option").nth(1).getAttribute("value");
    await dialogo.getByLabel("Categoría").selectOption(categoria as string);
    await dialogo.getByLabel("Concepto / justificación").fill(EGRESO);
    await dialogo.getByLabel("Valor (COP)").fill(String(GASTO));
    await dialogo.getByLabel("Forma de pago").selectOption("cash");
    const gasto = esperarPost(page, "/expenses");
    await dialogo.getByRole("button", { name: /registrar egreso/i }).click();
    expect((await gasto).status()).toBe(201);
  });

  caso("CP-148", "«Hoy» sube exactamente lo cobrado, y cada rubro lleva lo suyo", async ({ page }, info) => {
    const despues = await leerHoy(page);
    expect(despues.pagos - hoyAntes.pagos).toBe(PAGO);
    expect(despues.ventas - hoyAntes.ventas).toBe(VENTA);
    expect(despues.pases - hoyAntes.pases).toBe(PASE);
    expect(despues.ingresos - hoyAntes.ingresos).toBe(PAGO + VENTA + PASE);
    await info.attach("hoy-despues", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-149", "Finanzas suma los mismos ingresos y la utilidad baja en lo que se gastó", async ({ page }, info) => {
    const despues = await leerFinanzas(page);
    expect(despues.ingresos - finanzasAntes.ingresos).toBe(PAGO + VENTA + PASE);
    // Utilidad = ingresos − egresos − apartado: con el apartado quieto, sube lo cobrado menos el gasto.
    expect(despues.utilidad - finanzasAntes.utilidad).toBe(PAGO + VENTA + PASE - GASTO);
    await info.attach("finanzas-despues", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-150", "El inventario descontó las dos unidades vendidas", async ({ page }) => {
    await irA(page, RUTAS.inventarioTodos);
    await expect(page.locator("tr", { hasText: PRODUCTO })).toContainText("8");
  });
});
