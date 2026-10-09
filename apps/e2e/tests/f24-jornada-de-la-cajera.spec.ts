import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  API_BACKEND,
  GIMNASIO,
  RUTAS,
  buscarParaIngreso,
  crearCliente,
  crearItemInventario,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  haceMeses,
  irA,
  marca,
} from "../support/app";
import { crearUsuarioEnElPanel, entrarAlPanel, iniciarTurno } from "../support/roles";
import type { Credencial } from "../support/roles";

const ID = marca();
const NOMBRE_CAJERA = `E2E Caja ${ID}`;
const PLAN = `E2E Caja Plan ${ID}`;
const CLIENTE_NUEVO = `E2E Caja Nuevo ${ID}`;
const CLIENTE_MORA = `E2E Caja Mora ${ID}`;
const VISITANTE = `E2E Caja Visitante ${ID}`;
const NOVEDAD = `Se dañó una caminadora ${ID}`;
const PRODUCTO = `E2E Caja Agua ${ID}`;
const COMPROBANTE = new URL("../fixtures/comprobante.png", import.meta.url).pathname.slice(1);

/** Lo que el panel le entregó a la cajera. */
let cajera: Credencial;

/** Los módulos de gestión: la cajera no entra a ninguno (§2.2 del ERS). */
const SOLO_ADMINISTRACION = ["memberships", "trainers", "expenses", "inventory", "finances"] as const;

/**
 * El Apartado diario es lo primero que abre la cajera. Si no carga, todo lo que
 * sigue falla por la misma causa: se dice aquí, con todas sus letras.
 */
async function abrirHoy(page: Page): Promise<void> {
  await irA(page, RUTAS.hoy);
  await expect(
    page.getByText("No pudimos cargar el apartado diario."),
    "El Apartado diario no carga para el perfil Recepcionista",
  ).toHaveCount(0);
}

test.describe.configure({ mode: "serial" });

test.describe("F24 · La jornada de la cajera", () => {
  test.beforeAll(async ({ browser }) => {
    // El administrador deja listo lo que la cajera encuentra al llegar: un plan
    // en el catálogo y un cliente cuya membresía ya venció.
    const admin = await browser.newPage();
    await crearPlan(admin, { nombre: PLAN, precioPesos: 60_000, diasPorSemana: 6 });
    await crearCliente(admin, { nombre: CLIENTE_MORA, documento: `51${ID}1`, plan: PLAN, inicio: haceMeses(6) });
    await crearItemInventario(admin, { nombre: PRODUCTO, stock: 5, minimo: 1 });
    await admin.close();

    // Y la plataforma le crea su usuario, como se haría con una persona nueva.
    const panel = await entrarAlPanel(browser);
    cajera = await crearUsuarioEnElPanel(panel.page, {
      nombre: NOMBRE_CAJERA,
      usuario: `caja.${ID}`,
      perfil: "Recepcionista",
    });
    await panel.cerrar();
  });

  caso("CP-108", "Al entrar, la cajera ve solo Apartado diario, Clientes y Pagos", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    for (const modulo of ["Apartado diario", "Clientes", "Pagos"]) {
      await expect(page.getByRole("link", { name: modulo, exact: true })).toBeVisible();
    }
    // Nada de lo que es del administrador, ni siquiera el título de su sección.
    await expect(page.getByText(/gestión del gimnasio/i)).toHaveCount(0);
    for (const modulo of ["Membresías", "Entrenadores", "Egresos", "Inventario", "Finanzas"]) {
      await expect(page.getByText(modulo, { exact: true })).toHaveCount(0);
    }
    await info.attach("selector-de-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-109", "Escribir a mano la dirección de un módulo de gestión no lo abre", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    for (const modulo of SOLO_ADMINISTRACION) {
      await page.goto(`/${GIMNASIO}/modules/${modulo}`);
      await page.waitForLoadState("networkidle");
      expect(page.url(), `${modulo} no debería quedar abierto`).not.toContain(`/modules/${modulo}`);
    }
    await info.attach("sin-acceso", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-110", "Aunque la pantalla se burlara, el servidor niega lo que no le toca a la cajera", async ({ browser }) => {
    const turno = await iniciarTurno(browser, cajera);
    const api = turno.page.request;
    const negadas: [string, string, object?][] = [
      ["GET", "/expenses"],
      ["GET", "/finance/dashboard"],
      ["GET", "/savings-pockets"],
      ["GET", "/inventory-items"],
      ["POST", "/membership-types", { name: "E2E no debe existir" }],
      ["POST", "/trainers", { fullName: "E2E no debe existir" }],
      ["POST", "/expenses", { description: "E2E no debe existir" }],
    ];
    for (const [metodo, ruta, cuerpo] of negadas) {
      const respuesta = await api.fetch(`${API_BACKEND}${ruta}`, { method: metodo, data: cuerpo, failOnStatusCode: false });
      expect(respuesta.status(), `${metodo} ${ruta} debería negarse`).toBe(403);
    }
    // Lo suyo sí responde.
    for (const ruta of ["/clients", "/payments", "/membership-types"]) {
      expect((await api.get(`${API_BACKEND}${ruta}`)).status(), `GET ${ruta}`).toBe(200);
    }
    await turno.cerrar();
  });

  caso("CP-111", "La cajera da de alta a un cliente nuevo con un plan del catálogo", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    await crearCliente(turno.page, { nombre: CLIENTE_NUEVO, documento: `52${ID}1`, plan: PLAN });
    await irA(turno.page, RUTAS.clientesTodos);
    await expect(turno.page.getByText(CLIENTE_NUEVO).first()).toBeVisible();
    await info.attach("cliente-dado-de-alta-por-la-cajera", { body: await turno.page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-112", "Cobra en efectivo, y el pago queda a nombre de ella", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_NUEVO);
    await page.getByLabel("Monto (COP)").fill("60000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    const fila = page.locator("tr", { hasText: CLIENTE_NUEVO }).first();
    await expect(fila).toContainText("$ 60.000");
    // La trazabilidad: quién registró el cobro (RNF-07).
    await expect(fila).toContainText(NOMBRE_CAJERA);
    await info.attach("pago-de-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-113", "Una transferencia sin foto del comprobante no se registra; con la foto, sí", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE_MORA);
    await page.getByLabel("Monto (COP)").fill("60000");
    await page.getByLabel("Método de pago").selectOption("transfer");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago|renovar y registrar pago/i }).click();
    await expect(page.locator("p[role=alert]")).toContainText(/comprobante/i);

    await page.locator("#receipt").setInputFiles(COMPROBANTE);
    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago|renovar y registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    const fila = page.locator("tr", { hasText: CLIENTE_MORA }).first();
    await fila.getByRole("button", { name: /ver comprobante/i }).click();
    await expect(page.getByRole("dialog").locator("img")).toBeVisible();
    await info.attach("comprobante-de-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-114", "Al cerrar el turno la sesión se acaba y el servidor ya no le responde", async ({ browser }) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await page.getByRole("button", { name: /cerrar sesión/i }).click();
    await page.waitForURL(`**/${GIMNASIO}`);
    const sinSesion = await page.request.get(`${API_BACKEND}/clients`, { failOnStatusCode: false });
    expect(sinSesion.status()).toBe(401);
    await turno.cerrar();
  });

  caso("CP-115", "Registra el ingreso del cliente que ya pagó y queda dentro", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await abrirHoy(page);
    const fila = await buscarParaIngreso(page, CLIENTE_NUEVO);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();
    await expect(page.getByText(/dentro ahora/i)).toBeVisible();
    await expect(page.getByText(CLIENTE_NUEVO).first()).toBeVisible();
    await info.attach("ingreso-registrado-por-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-116", "Vende un pase de día a un visitante y queda con su nombre como quien lo vendió", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await abrirHoy(page);
    await page.getByRole("button", { name: /^pase de día$/i }).click();
    const dialogo = page.getByRole("dialog", { name: /pase de día/i });
    await dialogo.getByLabel("Nombre").fill(VISITANTE);
    await dialogo.getByLabel(/valor/i).fill("7000");
    const venta = esperarPost(page, "/day-passes");
    await dialogo.getByRole("button", { name: /^cobrar/i }).click();
    expect((await venta).status()).toBe(201);

    const fila = page.getByRole("listitem").filter({ hasText: VISITANTE });
    await expect(fila).toContainText(/vendió/i);
    await expect(fila).toContainText(NOMBRE_CAJERA);
    await info.attach("pase-vendido-por-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-117", "Anota una novedad del día y sigue ahí al recargar la pantalla", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await abrirHoy(page);
    await page.getByLabel("Agregar novedad").fill(NOVEDAD);
    await page.getByLabel("Agregar novedad").press("Enter");
    await expect(page.getByText(NOVEDAD)).toBeVisible();

    await page.reload();
    await expect(page.getByText(NOVEDAD)).toBeVisible();
    // Quién la escribió queda al lado: no es una nota anónima.
    // Las novedades guardan el usuario; los pagos y los pases, el nombre.
    await expect(page.getByRole("listitem").filter({ hasText: NOVEDAD })).toContainText(
      new RegExp(`${NOMBRE_CAJERA}|${cajera.usuario.replace(".", "\\.")}`),
    );
    await info.attach("novedad-del-dia", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-118", "El resumen del día suma lo que ella cobró: el pago, el pase y el comprobante", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await abrirHoy(page);
    // Cobró 60.000 en efectivo, 60.000 por transferencia y un pase de 7.000.
    // El día puede traer más de otras corridas: se exige al menos esa suma.
    const ingresos = page.getByText(/^ingresos del día$/i).locator("xpath=following-sibling::p[1]");
    const cifra = Number(((await ingresos.textContent()) ?? "").replace(/\D/g, ""));
    expect(cifra).toBeGreaterThanOrEqual(127_000);
    await info.attach("resumen-del-dia", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    await turno.cerrar();
  });


  caso("CP-151", "Vende un producto en el mostrador sin tener acceso a Inventario", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    const { page } = turno;
    await abrirHoy(page);
    await page.getByRole("button", { name: "Registrar venta" }).click();
    const dialogo = page.getByRole("dialog", { name: /registrar venta de producto/i });
    await elegirOpcion(page, "Producto", PRODUCTO);
    await dialogo.getByLabel("Cantidad").fill("1");
    await dialogo.getByLabel("Valor cobrado (COP)").fill("4000");
    await dialogo.getByLabel("Forma de pago").selectOption("cash");
    const venta = esperarPost(page, "/product-sales");
    await dialogo.getByRole("button", { name: /registrar venta/i }).click();
    expect((await venta).status()).toBe(201);
    // Vender no le abre Inventario: el módulo sigue cerrado para ella.
    expect((await page.request.get(`${API_BACKEND}/inventory-items`, { failOnStatusCode: false })).status()).toBe(403);
    await info.attach("venta-de-la-cajera", { body: await page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });
});
