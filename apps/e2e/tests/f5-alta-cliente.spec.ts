import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  elegirOpcion,
  esperarResumenDePago,
  buscarParaIngreso,
  crearPlan,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Alta ${ID}`;
const CLIENTE = `E2E Nuevo ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F5 · Alta de cliente", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, {
      nombre: PLAN,
      precioPesos: 70_000,
      diasPorSemana: 6,
    });
    await page.close();
  });

  caso("CP-19", "Crear un cliente sin el campo de comentarios", async ({ page }, info) => {
    await irA(page, RUTAS.clientesNuevo);
    await expect(page.getByLabel(/comentarios/i)).toHaveCount(0);

    await page.getByLabel("Nombre completo").fill(CLIENTE);
    await page.getByLabel("Documento").fill(`93${ID}1`);
    await page.getByLabel("Teléfono").first().fill("3001112233");
    await elegirOpcion(page, "Tipo de membresía", PLAN);

    // RF-07: el vencimiento se deriva del plan, no se escribe.
    const vencimiento = page.getByLabel("Fecha de vencimiento");
    await expect(vencimiento).toBeDisabled();
    await expect(vencimiento).not.toHaveValue("—");

    await info.attach("vencimiento-derivado", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await page.getByRole("button", { name: /guardar cliente/i }).click();
    await expect(page.getByText(CLIENTE).first()).toBeVisible();
  });

  caso("CP-20", "El foco salta al primer campo inválido", async ({ page }, info) => {
    await irA(page, RUTAS.clientesNuevo);
    await page.getByLabel("Nombre completo").fill(`E2E Incompleto ${ID}`);
    await page.getByRole("button", { name: /guardar cliente/i }).click();

    const enfocado = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(enfocado).toBe("idNumber");

    const campo = page.getByLabel("Documento");
    const descrito = await campo.getAttribute("aria-describedby");
    expect(descrito).toBeTruthy();
    await expect(page.locator(`#${descrito}`)).toContainText(/documento/i);

    await info.attach("primer-campo-invalido", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-21", "El cliente nuevo se cobra e ingresa sin pasos intermedios", async ({ page }) => {
    await irA(page, RUTAS.cobrar);
    await elegirOpcion(page, "Cliente", CLIENTE);
    await page.getByLabel("Monto (COP)").fill("70000");
    await page.getByLabel("Método de pago").selectOption("cash");
    await esperarResumenDePago(page);
    await page.getByRole("button", { name: /registrar pago/i }).click();

    await irA(page, RUTAS.ingreso);
    const fila = await buscarParaIngreso(page, CLIENTE);
    await fila.getByRole("button", { name: /registrar ingreso/i }).click();
    await expect(page.getByText(/dentro ahora/i)).toBeVisible();
  });
});
