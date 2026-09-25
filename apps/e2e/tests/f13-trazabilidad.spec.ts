import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  buscarParaIngreso,
  crearCliente,
  crearPlan,
  elegirOpcion,
  esperarPost,
  esperarResumenDePago,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Rastro ${ID}`;
const CLIENTE = `E2E Rastro ${ID}`;

/** Quien corre las pruebas es el usuario del .env; su nombre sale de la API. */
let AUTOR = "";

test.describe.configure({ mode: "serial" });

test.describe("F13 · Quién hizo qué", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, { nombre: PLAN, precioPesos: 80_000, diasPorSemana: 6 });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `50${ID}1`,
      plan: PLAN,
    });

    await irA(page, RUTAS.modulos);
    const yo = (await (await page.request.get("/api/auth/me")).json()) as {
      user: { fullName: string };
    };
    AUTOR = yo.user.fullName;
    await page.close();
  });

  caso("CP-45", "El cobro queda a nombre de quien lo registró", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("80000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);

    const guardado = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.pagosTodos);
    const fila = page.locator("tr", { hasText: CLIENTE }).first();
    await expect(fila).toContainText(AUTOR);

    await info.attach("pagos-con-autor", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-46", "El ingreso queda a nombre de quien lo registró", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);

    const fila = await buscarParaIngreso(page, CLIENTE);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();

    // En la bitácora del día, junto al plan.
    await expect(
      page.getByText(new RegExp(`registró ${AUTOR}`, "i")).first(),
    ).toBeVisible();

    await info.attach("ingresos-con-autor", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-47", "El ingreso del día dice quién recibió cada peso", async ({ page }, info) => {
    await irA(page, RUTAS.hoy);
    await page
      .getByRole("button", { name: /movimientos? registrados?/i })
      .click();

    const desglose = page.getByText(new RegExp(CLIENTE)).first();
    await expect(desglose).toContainText(AUTOR);

    await info.attach("desglose-con-autor", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-48", "El autor lo pone el servidor, no el cliente", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);

    const lista = (await (
      await page.request.get("/api/backend/clients")
    ).json()) as { id: string; fullName: string; registeredBy: string }[];
    const nuestro = lista.find((uno) => uno.fullName === CLIENTE);
    expect(nuestro?.registeredBy).toBe(AUTOR);

    // Mandarlo a mano ni siquiera se acepta: el DTO no lo declara y la API
    // rechaza los campos que no conoce, así que el autor solo puede salir
    // del token.
    const respuesta = await page.request.patch(
      `/api/backend/clients/${nuestro?.id}`,
      {
        data: { fullName: CLIENTE, registeredBy: "Otra persona" },
        failOnStatusCode: false,
      },
    );
    expect(respuesta.status()).toBe(400);

    // Y el autor sigue siendo el de verdad.
    const despues = (await (
      await page.request.get(`/api/backend/clients/${nuestro?.id}`)
    ).json()) as { registeredBy: string };
    expect(despues.registeredBy).toBe(AUTOR);
  });
});
