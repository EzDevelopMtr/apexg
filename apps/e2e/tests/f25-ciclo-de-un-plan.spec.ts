import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, crearCliente, crearPlan, elegirOpcion, irA, marca } from "../support/app";

const ID = marca();
const PLAN = `E2E Ruta Plan ${ID}`;
const ANTIGUO = `E2E Ruta Antiguo ${ID}`;
const NUEVO = `E2E Ruta Nuevo ${ID}`;

/** Lo que dice el cobro: la cifra bajo «Valor del plan» del resumen del cliente. */
async function valorDelPlanEnElCobro(page: Page, cliente: string): Promise<string> {
  await irA(page, RUTAS.cobrar);
  await elegirOpcion(page, "Cliente", cliente);
  const cifra = page.getByText("Valor del plan", { exact: true }).locator("xpath=following-sibling::p[1]");
  await expect(cifra).toBeVisible();
  // formatCOP separa el signo con un espacio de no separación: se normaliza.
  return ((await cifra.textContent()) ?? "").replace(/\s+/g, " ").trim();
}

test.describe.configure({ mode: "serial" });

test.describe("F25 · El ciclo de un plan, de la creación al cobro", () => {
  caso("CP-119", "Un plan nuevo con abono mínimo aparece en el catálogo con su valor, vigencia y abono", async ({ page }, info) => {
    await crearPlan(page, { nombre: PLAN, precioPesos: 90_000, diasPorSemana: 5, abonoMinimoPesos: 30_000 });
    await irA(page, RUTAS.planesTodos);
    const fila = page.locator("tr", { hasText: PLAN });
    await expect(fila).toContainText("$ 90.000");
    await expect(fila).toContainText("1 mes");
    await expect(fila).toContainText("$ 30.000");
    await info.attach("plan-en-el-catalogo", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });

  caso("CP-120", "Un plan sin nombre, sin valor o con un abono mayor que el valor no se guarda", async ({ page }) => {
    await irA(page, RUTAS.planesNuevo);
    const dialogo = page.getByRole("dialog");
    await dialogo.getByRole("button", { name: /guardar plan/i }).click();
    await expect(dialogo.locator("p[role=alert]")).toContainText(/nombre es obligatorio/i);

    await dialogo.getByLabel("Nombre del plan").fill(`E2E Incompleto ${ID}`);
    await dialogo.getByRole("button", { name: /guardar plan/i }).click();
    await expect(dialogo.locator("p[role=alert]")).toContainText(/valor debe ser mayor que cero/i);

    await dialogo.getByLabel("Valor (COP)").fill("50000");
    await dialogo.getByLabel(/abono mínimo/i).fill("80000");
    await dialogo.getByRole("button", { name: /guardar plan/i }).click();
    await expect(dialogo.locator("p[role=alert]")).toContainText(/abono mínimo no puede superar/i);

    // Y nada de eso llegó al catálogo.
    await irA(page, RUTAS.planesTodos);
    await expect(page.getByText(`E2E Incompleto ${ID}`)).toHaveCount(0);
  });

  caso("CP-121", "Un cliente se inscribe al plan y su cobro dice el valor pactado", async ({ page }) => {
    await crearCliente(page, { nombre: ANTIGUO, documento: `61${ID}1`, plan: PLAN });
    expect(await valorDelPlanEnElCobro(page, ANTIGUO)).toBe("$ 90.000");
  });

  caso("CP-122", "Editar el plan avisa que solo afecta a inscripciones futuras y el catálogo cambia", async ({ page }, info) => {
    await irA(page, RUTAS.planesTodos);
    await page.getByRole("button", { name: `Editar ${PLAN}` }).click();
    const dialogo = page.getByRole("dialog", { name: /editar plan/i });
    await expect(dialogo).toContainText(/inscripciones futuras, no a las ya registradas/i);

    await dialogo.getByLabel("Valor (COP)").fill("100000");
    await dialogo.getByLabel("Condiciones").fill(`Condición actualizada ${ID}`);
    await info.attach("editando-el-plan", { body: await page.screenshot(), contentType: "image/png" });
    await dialogo.getByRole("button", { name: /guardar plan/i }).click();
    await expect(dialogo).toBeHidden();

    const fila = page.locator("tr", { hasText: PLAN });
    await expect(fila).toContainText("$ 100.000");
    await expect(fila).toContainText(`Condición actualizada ${ID}`);
  });


  caso("CP-124", "Promociones lista solo los planes promocionales, con su insignia; el plan nuevo no está", async ({ page }, info) => {
    await irA(page, RUTAS.planesTodos);
    await page.getByRole("link", { name: "Promociones" }).click();
    await page.waitForURL("**/promotions");
    const filas = page.locator("tbody tr");
    await expect(filas.first()).toBeVisible();
    const cuantas = await filas.count();
    for (let i = 0; i < cuantas; i++) {
      await expect(filas.nth(i)).toContainText("Promoción");
    }
    await expect(page.getByText(PLAN)).toHaveCount(0);
    await info.attach("promociones", { body: await page.screenshot(), contentType: "image/png" });
  });
  caso("CP-123", "Quien ya estaba inscrito conserva su precio; quien se inscribe después paga el nuevo", async ({ page }, info) => {
    await crearCliente(page, { nombre: NUEVO, documento: `61${ID}2`, plan: PLAN });
    expect(await valorDelPlanEnElCobro(page, NUEVO)).toBe("$ 100.000");
    expect(await valorDelPlanEnElCobro(page, ANTIGUO)).toBe("$ 90.000");
    await info.attach("cobro-del-cliente-antiguo", { body: await page.screenshot(), contentType: "image/png" });
  });
});
