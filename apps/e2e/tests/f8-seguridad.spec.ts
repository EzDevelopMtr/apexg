import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearCliente,
  crearPlan,
  haceMeses,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E API ${ID}`;
const CLIENTE = `E2E ApiMora ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F8 · Seguridad", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, { nombre: PLAN, precioPesos: 60_000, diasPorSemana: 6 });
    await crearCliente(page, {
      nombre: CLIENTE,
      documento: `95${ID}1`,
      plan: PLAN,
      inicio: haceMeses(6),
    });
    await page.close();
  });

  caso("CP-28", "La API rechaza lo mismo que la pantalla", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);

    // El id del cliente se toma de la propia API, no de la pantalla: la
    // prueba ataca el backend directamente, saltándose la UI a propósito.
    const lista = await page.request.get("/api/backend/clients");
    expect(lista.ok()).toBeTruthy();
    const clientes = (await lista.json()) as { id: string; fullName: string }[];
    const moroso = clientes.find((cliente) => cliente.fullName === CLIENTE);
    expect(moroso, `No se encontró ${CLIENTE} en la API`).toBeTruthy();

    const ingreso = await page.request.post("/api/backend/attendances", {
      data: { clientId: moroso?.id },
      failOnStatusCode: false,
    });
    expect(ingreso.ok()).toBeFalsy();
    const cuerpo = await ingreso.text();
    await info.attach("rechazo-de-la-api", {
      body: `${ingreso.status()} ${cuerpo}`,
      contentType: "text/plain",
    });
    expect(cuerpo).toMatch(/vencida|mora/i);

    // Contra un pago que existe de verdad: contra un id inventado, un 404 de
    // "no existe" se confundiría con la negativa por falta de sesión.
    const pagos = (await (await page.request.get("/api/backend/payments")).json()) as {
      id: string;
      receiptPath: string | null;
    }[];
    const conComprobante = pagos.find((pago) => pago.receiptPath);
    expect(conComprobante, "No hay ningún pago con comprobante").toBeTruthy();

    // `browser.newContext()` hereda las opciones del proyecto, incluida la
    // sesión guardada: sin anularla, la petición "anónima" iba firmada y el
    // 404 del pago inexistente parecía un fallo de la API.
    const anonimo = await page.context().browser()!.newContext({
      storageState: undefined,
    });
    const sinSesion = await anonimo.request.get(
      // El origen se toma de la propia página, no del .env.
      `${new URL(page.url()).origin}/api/backend/payments/${conComprobante?.id}/receipt`,
      { failOnStatusCode: false },
    );
    await info.attach("comprobante-sin-sesion", {
      body: `${sinSesion.status()} ${sinSesion.url()}`,
      contentType: "text/plain",
    });
    expect([401, 403]).toContain(sinSesion.status());
    await anonimo.close();
  });
});
