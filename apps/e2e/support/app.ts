import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Rutas reales de la app, en un solo sitio para que un cambio se note aqui. */
export const RUTAS = {
  modulos: "/modules",
  ingreso: "/modules/daily-log/checkin",
  hoy: "/modules/daily-log/today",
  venta: "/modules/daily-log/sell",
  clientesNuevo: "/modules/clients/add",
  clientesTodos: "/modules/clients/all",
  planesNuevo: "/modules/memberships/add",
  planesTodos: "/modules/memberships/all",
  cobrar: "/modules/payments/record",
  pagosTodos: "/modules/payments/all",
  categoriasInventario: "/modules/inventory/categories",
  categoriasEgresos: "/modules/expenses/categories",
} as const;

/** Sufijo unico por corrida: dos ejecuciones no pueden pisarse los datos. */
export function marca(): string {
  return String(Date.now()).slice(-6);
}

export function haceMeses(cantidad: number): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - cantidad);
  return fecha.toISOString().slice(0, 10);
}

export function haceDias(cantidad: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - cantidad);
  return fecha.toISOString().slice(0, 10);
}

export async function irA(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await page.waitForLoadState("networkidle");
}

export interface PlanNuevo {
  nombre: string;
  precioPesos: number;
  diasPorSemana: number;
  /** Vigencia en meses. Un plan de un mes es lo normal en el gimnasio. */
  meses?: number;
  abonoMinimoPesos?: number;
}

export async function crearPlan(page: Page, plan: PlanNuevo): Promise<void> {
  await irA(page, RUTAS.planesNuevo);
  await page.getByLabel("Nombre del plan").fill(plan.nombre);
  await page.getByLabel("Valor (COP)").fill(String(plan.precioPesos));
  if (plan.abonoMinimoPesos !== undefined) {
    await page
      .getByLabel(/abono mínimo/i)
      .fill(String(plan.abonoMinimoPesos));
  }
  await page.getByLabel("Vigencia").fill(String(plan.meses ?? 1));
  await page.getByLabel("Unidad").selectOption("month");
  await page
    .getByLabel("Días por semana")
    .selectOption(String(plan.diasPorSemana));
  await page.getByRole("button", { name: /guardar plan/i }).click();
  await expect(page.getByText(plan.nombre).first()).toBeVisible();
}

export interface ClienteNuevo {
  nombre: string;
  documento: string;
  plan: string;
  /** `YYYY-MM-DD`. Una fecha vieja deja la membresia vencida. */
  inicio?: string;
}

export async function crearCliente(
  page: Page,
  cliente: ClienteNuevo,
): Promise<void> {
  await irA(page, RUTAS.clientesNuevo);
  await page.getByLabel("Nombre completo").fill(cliente.nombre);
  await page.getByLabel("Documento").fill(cliente.documento);
  await page.getByLabel("Teléfono").first().fill("3000000000");
  await elegirOpcion(page, "Tipo de membresía", cliente.plan);
  if (cliente.inicio) {
    await page.getByLabel("Fecha de inicio").fill(cliente.inicio);
  }
  await page.getByRole("button", { name: /guardar cliente/i }).click();
  await expect(page.getByText(cliente.nombre).first()).toBeVisible();
}

/** La fila del panel de ingreso para ese nombre, con la lista ya desplegada. */
export async function buscarParaIngreso(
  page: Page,
  nombre: string,
): Promise<Locator> {
  const caja = page.getByLabel("Buscar cliente para registrar ingreso");
  await caja.click();
  await caja.fill(nombre);
  const fila = page
    .getByRole("listbox", { name: "Clientes" })
    .locator("div")
    .filter({ hasText: nombre })
    .first();
  await expect(fila).toBeVisible();
  return fila;
}

/**
 * Elige la opción cuyo texto contiene `parte`.
 *
 * `selectOption({ label })` solo acepta el texto exacto, y el catálogo muestra
 * el plan junto a su precio ("Plan X — $80.000"), que la prueba no conoce.
 */
export async function elegirOpcion(
  page: Page,
  etiqueta: string,
  parte: string,
): Promise<void> {
  const select = page.getByLabel(etiqueta);
  const valor = await select
    .locator("option", { hasText: parte })
    .first()
    .getAttribute("value");
  expect(valor, `No hay opción con "${parte}" en ${etiqueta}`).toBeTruthy();
  await select.selectOption(valor as string);
}

/**
 * Espera a que el formulario de cobro tenga listo el ciclo del cliente.
 *
 * El botón de guardar está deshabilitado hasta que el catálogo de planes y el
 * cliente están cargados; pulsarlo antes no hace nada y no avisa de nada, así
 * que la prueba creía haber cobrado y no había cobrado.
 */
export async function esperarResumenDePago(page: Page): Promise<void> {
  await expect(
    page.getByRole("button", { name: /registrar pago|renovar y registrar pago/i }),
  ).toBeEnabled();
}

/** La dirección base sin barra final: dos barras seguidas dan 404. */
export function baseUrl(): string {
  return (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * La respuesta del POST que una pantalla dispara al guardar.
 *
 * Se pide ANTES de pulsar el botón: entre el clic y la respuesta la prueba no
 * puede navegar, o el navegador aborta la petición y el registro nunca llega
 * a existir.
 */
export function esperarPost(page: Page, ruta: string) {
  return page.waitForResponse(
    (respuesta) =>
      respuesta.url().includes(`/api/backend`) &&
      respuesta.url().includes(ruta) &&
      respuesta.request().method() === "POST",
  );
}
