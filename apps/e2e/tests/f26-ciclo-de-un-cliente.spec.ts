import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  haceDias,
  haceMeses,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Vida Plan ${ID}`;
const COMPLETO = `E2E Vida Completo ${ID}`;
const AL_DIA = `E2E Vida Al día ${ID}`;
const POR_VENCER = `E2E Vida Por vencer ${ID}`;
const EN_MORA = `E2E Vida En mora ${ID}`;
const DOC_COMPLETO = `62${ID}0`;

/** Los filtros del listado, con su conteo al lado. */
const filtros = (page: Page) => page.getByRole("group", { name: /filtrar el listado/i });
const fila = (page: Page, nombre: string) => page.getByRole("row", { name: `Abrir a ${nombre}` });

/** El número que acompaña a un filtro: «En mora4» → 4. */
async function conteoDe(page: Page, filtro: RegExp): Promise<number> {
  const texto = (await filtros(page).getByRole("link", { name: filtro }).textContent()) ?? "";
  return Number(texto.replace(/\D/g, ""));
}

test.describe.configure({ mode: "serial" });

test.describe("F26 · El ciclo de un cliente, del alta al cobro", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, { nombre: PLAN, precioPesos: 70_000, diasPorSemana: 6 });
    await crearCliente(page, { nombre: AL_DIA, documento: `62${ID}1`, plan: PLAN });
    // 27 días sobre un plan mensual: dentro de la ventana de aviso, sin vencer.
    await crearCliente(page, { nombre: POR_VENCER, documento: `62${ID}2`, plan: PLAN, inicio: haceDias(27) });
    await crearCliente(page, { nombre: EN_MORA, documento: `62${ID}3`, plan: PLAN, inicio: haceMeses(6) });
    await page.close();
  });

  caso("CP-125", "Un alta con todos los datos queda guardada y se vuelve a abrir completa", async ({ page }, info) => {
    await irA(page, RUTAS.clientesNuevo);
    const dialogo = page.getByRole("dialog");
    await dialogo.getByLabel("Nombre completo").fill(COMPLETO);
    await dialogo.getByLabel("Documento").fill(DOC_COMPLETO);
    await dialogo.getByLabel("Teléfono", { exact: true }).fill("3001234567");
    await dialogo.getByLabel(/correo electrónico/i).fill(`vida.${ID}@correo.test`);
    await dialogo.getByLabel("Contacto de emergencia").fill("Marta Pérez");
    await dialogo.getByLabel("Teléfono de emergencia").fill("3109876543");
    await dialogo.getByLabel("Tipo de sangre").selectOption({ index: 1 });
    await dialogo.getByLabel("Fecha de nacimiento").fill("1990-05-17");
    await dialogo.getByLabel("Condición médica").fill("Asma leve");
    await elegirOpcion(page, "Tipo de membresía", PLAN);
    await info.attach("alta-completa", { body: await page.screenshot(), contentType: "image/png" });
    const alta = esperarPost(page, "/clients");
    await dialogo.getByRole("button", { name: /guardar cliente/i }).click();
    expect((await alta).status()).toBe(201);

    await expect(fila(page, COMPLETO)).toContainText("Activo");
    await fila(page, COMPLETO).click();
    const edicion = page.getByRole("dialog", { name: /editar cliente/i });
    await expect(edicion.getByLabel("Teléfono", { exact: true })).toHaveValue("3001234567");
    await expect(edicion.getByLabel(/correo electrónico/i)).toHaveValue(`vida.${ID}@correo.test`);
    await expect(edicion.getByLabel("Contacto de emergencia")).toHaveValue("Marta Pérez");
    await expect(edicion.getByLabel("Fecha de nacimiento")).toHaveValue("1990-05-17");
    await expect(edicion.getByLabel("Condición médica")).toHaveValue("Asma leve");
  });

  caso("CP-126", "Un documento repetido se rechaza con aviso y no duplica al cliente", async ({ page }) => {
    await irA(page, RUTAS.clientesNuevo);
    const dialogo = page.getByRole("dialog");
    await dialogo.getByLabel("Nombre completo").fill(`E2E Vida Repetido ${ID}`);
    await dialogo.getByLabel("Documento").fill(DOC_COMPLETO);
    await dialogo.getByLabel("Teléfono", { exact: true }).fill("3000000000");
    await elegirOpcion(page, "Tipo de membresía", PLAN);
    await dialogo.getByRole("button", { name: /guardar cliente/i }).click();
    await expect(dialogo.locator("p[role=alert]")).toContainText(/ya existe un cliente con ese documento/i);

    await irA(page, RUTAS.clientesTodos);
    await expect(page.getByText(`E2E Vida Repetido ${ID}`)).toHaveCount(0);
  });

  caso("CP-127", "Editar el teléfono y el correo se guarda y se ve al volver", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);
    await fila(page, COMPLETO).click();
    const edicion = page.getByRole("dialog", { name: /editar cliente/i });
    await edicion.getByLabel("Teléfono", { exact: true }).fill("3205556677");
    await edicion.getByLabel(/correo electrónico/i).fill(`nuevo.${ID}@correo.test`);
    await edicion.getByRole("button", { name: /guardar cliente/i }).click();
    await expect(edicion).toBeHidden();

    await irA(page, RUTAS.clientesTodos);
    await fila(page, COMPLETO).click();
    await expect(page.getByRole("dialog", { name: /editar cliente/i }).getByLabel("Teléfono", { exact: true })).toHaveValue("3205556677");
    await expect(page.getByRole("dialog", { name: /editar cliente/i }).getByLabel(/correo electrónico/i)).toHaveValue(`nuevo.${ID}@correo.test`);
  });

  caso("CP-128", "Cada estado cae en su filtro, y el conteo de cada filtro es el de sus filas", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);
    for (const [filtro, ruta, esperado, ausentes] of [
      [/^Clientes activos/, "active", AL_DIA, [EN_MORA]],
      [/^Por vencer/, "expiring", POR_VENCER, [AL_DIA, EN_MORA]],
      [/^En mora/, "overdue", EN_MORA, [AL_DIA, POR_VENCER]],
    ] as const) {
      await filtros(page).getByRole("link", { name: filtro }).click();
      await page.waitForURL(`**/modules/clients/${ruta}`);
      await expect(fila(page, esperado)).toBeVisible();
      for (const otro of ausentes) await expect(fila(page, otro)).toHaveCount(0);
      // El número del filtro es cuántas filas muestra.
      expect(await page.locator("tbody tr").count()).toBe(await conteoDe(page, filtro));
    }
    await info.attach("clientes-en-mora", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-129", "Se busca por nombre, por documento y por teléfono", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);
    const caja = page.getByLabel("Buscar clientes");
    await caja.fill(AL_DIA);
    await expect(fila(page, AL_DIA)).toBeVisible();
    await expect(fila(page, EN_MORA)).toHaveCount(0);

    await caja.fill(DOC_COMPLETO);
    await expect(fila(page, COMPLETO)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);

    await caja.fill("3205556677");
    await expect(fila(page, COMPLETO)).toBeVisible();
  });

  caso("CP-130", "La búsqueda rápida del selector lleva al cliente, ya filtrado en su listado", async ({ page }, info) => {
    await irA(page, RUTAS.modulos);
    await page.getByLabel("Buscar cliente", { exact: true }).fill(POR_VENCER);
    await page.getByRole("button", { name: new RegExp(POR_VENCER) }).click();
    await page.waitForURL(/modules\/clients\/all\?q=/);
    await expect(fila(page, POR_VENCER)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await info.attach("busqueda-rapida", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-131", "El cliente en mora paga y pasa de «En mora» a «Activos»", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", EN_MORA);
    await expect(page.getByText(/membresía vencida/i)).toBeVisible();
    await page.getByLabel("Monto (COP)").fill("70000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    const cobro = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /renovar y registrar pago/i }).click();
    expect((await cobro).status()).toBe(201);

    await irA(page, RUTAS.clientesTodos);
    await filtros(page).getByRole("link", { name: /^En mora/ }).click();
    await page.waitForURL("**/overdue");
    await expect(fila(page, EN_MORA)).toHaveCount(0);
    await filtros(page).getByRole("link", { name: /^Clientes activos/ }).click();
    await page.waitForURL("**/active");
    await expect(fila(page, EN_MORA)).toContainText("Activo");
    await info.attach("ya-activo", { body: await page.screenshot(), contentType: "image/png" });
  });
});
