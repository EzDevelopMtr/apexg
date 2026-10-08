import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { API_BACKEND, RUTAS, irA, marca } from "../support/app";

test.describe.configure({ mode: "serial" });

/** Filas de datos de la tabla (sin la de "no hay pagos"). */
const filas = (page: Page) =>
  page.locator("tbody tr").filter({ hasNot: page.getByText(/no hay pagos/i) });

/**
 * La búsqueda necesita un pago de alguien con tilde. En un gimnasio recién
 * creado no hay ninguno, así que se deja uno hecho por la API (la pantalla
 * ya se probó en otros casos): un cliente con un abono.
 */
async function sembrarPagoDeJuanPerez(page: Page) {
  const planes = (await (await page.request.get(`${API_BACKEND}/membership-types`)).json()) as { items?: unknown[] } | unknown[];
  const lista = (Array.isArray(planes) ? planes : (planes.items ?? [])) as { id: string; name: string; minimumPayment: string | null; price: string }[];
  const plan = lista.find((p) => p.name.startsWith("Mensualidad")) ?? lista[0];
  const cliente = await page.request.post(`${API_BACKEND}/clients`, {
    data: { documentNumber: `7${marca()}`, fullName: "Juan Pérez", phone: "3000000000", membershipTypeId: plan?.id },
  });
  expect(cliente.status()).toBe(201);
  const { currentMembership } = (await cliente.json()) as { currentMembership: { id: string } };
  const pago = await page.request.post(`${API_BACKEND}/payments`, {
    data: { clientMembershipId: currentMembership.id, amount: plan?.minimumPayment ?? plan?.price, paymentMethod: "cash" },
  });
  expect(pago.status()).toBe(201);
}

/** Hoy, en la zona del gimnasio: la fecha que lleva el pago que se acaba de hacer. */
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Un plan con abono mínimo, un abono y el pago final de hoy: lo que el filtro
 * «Abono final» debe encontrar. Por la API, para no depender de pagos de otro
 * gimnasio con una fecha fija.
 */
async function sembrarAbonoFinalDeHoy(page: Page): Promise<{ saldo: number }> {
  const planes = (await (await page.request.get(`${API_BACKEND}/membership-types`)).json()) as { items?: unknown[] } | unknown[];
  const lista = (Array.isArray(planes) ? planes : (planes.items ?? [])) as { id: string; name: string; minimumPayment: string | null; price: string }[];
  const plan = lista.find((p) => p.minimumPayment) ?? lista[0];
  const cliente = await page.request.post(`${API_BACKEND}/clients`, {
    data: { documentNumber: `6${marca()}`, fullName: "E2E Abono Final", phone: "3000000000", membershipTypeId: plan?.id },
  });
  expect(cliente.status()).toBe(201);
  const { currentMembership } = (await cliente.json()) as { currentMembership: { id: string } };
  const minimo = Number(plan?.minimumPayment ?? plan?.price);
  for (const monto of [minimo, Number(plan?.price) - minimo]) {
    const pago = await page.request.post(`${API_BACKEND}/payments`, {
      data: { clientMembershipId: currentMembership.id, amount: monto.toFixed(2), paymentMethod: "cash" },
    });
    expect(pago.status()).toBe(201);
  }
  // Tras el 1.º abono queda por pagar lo que falta del plan.
  return { saldo: Number(plan?.price) - minimo };
}

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
    await sembrarPagoDeJuanPerez(page);
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
    await sembrarAbonoFinalDeHoy(page);
    await irA(page, RUTAS.pagosTodos);
    const total = await filas(page).count();

    await page.getByLabel("Desde").fill(hoy());
    await page.getByLabel("Hasta").fill(hoy());
    await page.getByLabel("Tipo").selectOption("finalInstallment");
    // Cada fila que queda cumple los DOS criterios, sin importar cuántas sean.
    const vistas = filas(page);
    await expect(vistas.first()).toBeVisible();
    const cuantas = await vistas.count();
    expect(cuantas).toBeLessThan(total);
    for (let i = 0; i < cuantas; i++) {
      await expect(vistas.nth(i)).toContainText("Abono final");
      await expect(vistas.nth(i)).toContainText(hoy());
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
    // Un cliente con un abono y su pago final, hechos para esta prueba.
    const { saldo } = await sembrarAbonoFinalDeHoy(page);
    await irA(page, RUTAS.pagosTodos);
    await expect(page.getByRole("columnheader", { name: /saldo tras el pago/i })).toBeVisible();

    // Su 1.º abono deja un saldo, y el pago final lo salda.
    const abono = page
      .locator("tbody tr", { hasText: "E2E Abono Final" })
      .filter({ hasText: "1.º abono" })
      .first();
    await expect(abono).toContainText(saldo.toLocaleString("es-CO"));
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
