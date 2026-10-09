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
const ENTRENADOR = `E2E Coach ${ID}`;
const CLIENTE = `E2E Coach Cliente ${ID}`;
const COMPROBANTE = new URL("../fixtures/comprobante.png", import.meta.url).pathname.slice(1);

const fila = (page: Page, nombre: string) => page.locator("tr", { hasText: nombre });

test.describe.configure({ mode: "serial" });

test.describe("F27 · Entrenadores: cupo, asignación y comisiones", () => {
  caso("CP-132", "Un entrenador nuevo con cupo de un cliente nace disponible y sin clientes", async ({ page }, info) => {
    await crearEntrenador(page, { nombre: ENTRENADOR, documento: `63${ID}1`, cupo: 1 });
    await irA(page, RUTAS.entrenadoresTodos);
    await expect(fila(page, ENTRENADOR)).toContainText("0 / 1");
    await expect(fila(page, ENTRENADOR)).toContainText(/1 cupos?/);
    await info.attach("entrenador-disponible", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-133", "Con un cliente asignado llena su cupo y sale de «Disponibles»", async ({ page }, info) => {
    await crearCliente(page, { nombre: CLIENTE, documento: `63${ID}2`, plan: "Personalizado", entrenador: ENTRENADOR });
    await irA(page, RUTAS.entrenadoresTodos);
    await expect(fila(page, ENTRENADOR)).toContainText("1 / 1");
    await expect(fila(page, ENTRENADOR)).toContainText("Sin cupo");

    await page.getByRole("group", { name: /filtrar el listado/i }).getByRole("link", { name: "Disponibles" }).click();
    await page.waitForURL("**/available");
    await expect(fila(page, ENTRENADOR)).toHaveCount(0);
    await info.attach("sin-cupo-no-disponible", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-134", "Ampliar el cupo lo devuelve a «Disponibles» con los cupos que le quedan", async ({ page }) => {
    await irA(page, RUTAS.entrenadoresTodos);
    await page.getByRole("button", { name: `Editar a ${ENTRENADOR}` }).click();
    const dialogo = page.getByRole("dialog", { name: /editar entrenador/i });
    await dialogo.getByLabel("Cupo máximo").fill("3");
    await dialogo.getByRole("button", { name: /guardar entrenador/i }).click();
    await expect(dialogo).toBeHidden();

    await expect(fila(page, ENTRENADOR)).toContainText("1 / 3");
    await expect(fila(page, ENTRENADOR)).toContainText(/2 cupos/);
    await irA(page, RUTAS.entrenadoresTodos.replace("/all", "/available"));
    await expect(fila(page, ENTRENADOR)).toBeVisible();
  });

  caso("CP-135", "El cobro del cliente personalizado deja una comisión pendiente para su entrenador", async ({ page }, info) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("200000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    const cobro = esperarPost(page, "/payments");
    await page.getByRole("button", { name: /registrar pago/i }).click();
    expect((await cobro).status()).toBe(201);

    await irA(page, RUTAS.entrenadoresComisiones);
    // El plan Personalizado reparte la mitad (ver CP-76).
    await expect(fila(page, ENTRENADOR)).toContainText("$ 100.000");
    await expect(fila(page, ENTRENADOR).getByRole("button", { name: /pagar comisiones/i })).toBeVisible();
    await info.attach("comision-pendiente", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-136", "Pagar la comisión por transferencia exige el comprobante; con él queda al día y se puede ver", async ({ page }, info) => {
    await irA(page, RUTAS.entrenadoresComisiones);
    await fila(page, ENTRENADOR).getByRole("button", { name: new RegExp(`pagar comisiones de ${ENTRENADOR}`, "i") }).click();
    const dialogo = page.getByRole("dialog", { name: /pagar comisiones/i });
    await expect(dialogo).toContainText(CLIENTE);
    await dialogo.getByLabel("Forma de pago").selectOption("transfer");
    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toContainText(/adjunta la foto del comprobante/i);
    await expect(dialogo).toBeVisible();

    await page.locator("#settlementReceipt").setInputFiles(COMPROBANTE);
    await dialogo.getByRole("button", { name: /confirmar pago/i }).click();
    await expect(dialogo).toBeHidden();

    await expect(fila(page, ENTRENADOR)).toContainText("Al día");
    await fila(page, ENTRENADOR).getByRole("button", { name: /ver comprobante del último pago/i }).click();
    const visor = page.getByRole("dialog");
    await expect(visor.locator("img")).toBeVisible();
    await expect
      .poll(() => visor.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await info.attach("comprobante-de-la-comision", { body: await page.screenshot(), contentType: "image/png" });
  });

  caso("CP-137", "El documento de un entrenador no se repite", async ({ page }) => {
    await irA(page, RUTAS.entrenadoresNuevo);
    const dialogo = page.getByRole("dialog");
    await dialogo.getByLabel("Nombre completo").fill(`E2E Coach Repetido ${ID}`);
    await dialogo.getByLabel("Documento").fill(`63${ID}1`);
    await dialogo.getByLabel("Teléfono").fill("3000000000");
    await dialogo.getByLabel("Fecha de contratación").fill(new Date().toISOString().slice(0, 10));
    await dialogo.getByLabel("Sueldo (COP)").fill("1500000");
    await dialogo.getByLabel("Cupo máximo").fill("5");
    await dialogo.getByRole("button", { name: /guardar entrenador/i }).click();
    await expect(dialogo.locator("p[role=alert]")).toBeVisible();

    await irA(page, RUTAS.entrenadoresTodos);
    await expect(page.getByText(`E2E Coach Repetido ${ID}`)).toHaveCount(0);
  });
});
