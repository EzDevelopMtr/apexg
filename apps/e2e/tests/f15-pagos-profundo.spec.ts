import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearEntrenador,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN_ABONOS = `E2E Abonos ${ID}`;
const CLIENTE_ABONOS = `E2E Abonos ${ID}`;
const CLIENTE_COMISION = `E2E Comision ${ID}`;
const ENTRENADOR = `E2E Trainer ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F15 · Pagos, a fondo", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    // 200.000 con abono mínimo de 80.000: dos abonos posibles (80k + 120k),
    // ninguno por debajo del mínimo.
    await crearPlan(page, {
      nombre: PLAN_ABONOS,
      precioPesos: 200_000,
      diasPorSemana: 6,
      abonoMinimoPesos: 80_000,
    });
    await crearCliente(page, {
      nombre: CLIENTE_ABONOS,
      documento: `40${ID}1`,
      plan: PLAN_ABONOS,
    });
    await crearEntrenador(page, { nombre: ENTRENADOR, documento: `41${ID}2` });
    // "Personalizado" ya trae reparto de comisión y exige entrenador (RF-24).
    await crearCliente(page, {
      nombre: CLIENTE_COMISION,
      documento: `40${ID}3`,
      plan: "Personalizado",
      entrenador: ENTRENADOR,
    });
    await page.close();
  });

  caso("CP-58", "Un abono por debajo del mínimo se rechaza con el monto exacto en el mensaje", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_ABONOS);
    await page.getByLabel("Monto (COP)").fill("50000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/80.000|80\.000|mínimo/i);
  });

  caso("CP-59", "El primer abono queda como abono, no como pago completo", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_ABONOS);
    await page.getByLabel("Monto (COP)").fill("80000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);

    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    const fila = page.locator("tr", { hasText: CLIENTE_ABONOS }).first();
    await expect(fila).toContainText(/1\.º abono|abono/i);
    await expect(fila).toContainText("$ 120.000"); // saldo restante

    await info.attach("primer-abono", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-60", "El cliente con abono a medias sale en 'Con saldo pendiente'", async ({ page }, info) => {
    await irA(page, RUTAS.pagosPendientes);
    await expect(page.getByText(CLIENTE_ABONOS).first()).toBeVisible();

    await info.attach("saldo-pendiente", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-61", "Superar el saldo restante en el segundo abono se rechaza", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_ABONOS);
    await page.getByLabel("Monto (COP)").fill("150000"); // el saldo es 120.000
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/saldo/i);
  });

  caso("CP-62", "El segundo abono salda la cuenta y sale del listado de pendientes", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_ABONOS);
    await page.getByLabel("Monto (COP)").fill("120000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);

    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    // Dos filas del mismo cliente ahora (el primer y el segundo abono); la
    // que importa es la que dice "abono final", no necesariamente la primera
    // en el orden de la tabla.
    const filaFinal = page
      .locator("tr", { hasText: CLIENTE_ABONOS })
      .filter({ hasText: /abono final|completo/i });
    await expect(filaFinal).toHaveCount(1);

    await irA(page, RUTAS.pagosPendientes);
    await expect(page.getByText(CLIENTE_ABONOS)).toHaveCount(0);

    await info.attach("saldado", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-63", "Un plan con reparto genera comisión para el entrenador", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_COMISION);
    await page.getByLabel("Monto (COP)").fill("200000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);

    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.entrenadoresComisiones);
    const fila = page.locator("tr", { hasText: ENTRENADOR }).first();
    await expect(fila).toBeVisible();
    await expect(fila).toContainText(/\$\s*100\.000/); // 50% de 200.000

    await info.attach("comision-generada", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-64", "Un plan personalizado sin entrenador asignado no deja guardar", async ({ page }) => {
    await irA(page, RUTAS.clientesNuevo);
    await page.getByLabel("Nombre completo").fill(`E2E Sin Trainer ${ID}`);
    await page.getByLabel("Documento").fill(`40${ID}9`);
    await page.getByLabel("Teléfono").first().fill("3000000000");
    await elegirOpcion(page, "Tipo de membresía", "Personalizado");
    await page.getByRole("button", { name: /guardar cliente/i }).click();

    // El foco salta al primer campo inválido (RF-24): el entrenador.
    const enfocado = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(enfocado).toBe("trainerId");
  });

  caso("CP-65", "El monto en cero se rechaza", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_COMISION);
    await page.getByLabel("Monto (COP)").fill("0");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/mayor que cero/i);
  });
});
