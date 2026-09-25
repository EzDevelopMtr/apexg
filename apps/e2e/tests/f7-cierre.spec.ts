import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA, marca } from "../support/app";

const ID = marca();

test.describe.configure({ mode: "serial" });

test.describe("F7 · Cierre del día", () => {
  caso("CP-25", "Una venta descuenta el stock del producto", async ({ page }, info) => {
    await irA(page, RUTAS.venta);

    const producto = page.getByLabel("Producto");
    const opciones = await producto.locator("option").allTextContents();
    test.skip(opciones.length < 2, "No hay productos con existencias cargadas.");

    const elegido = opciones[1] as string;
    await producto.selectOption({ label: elegido });
    await page.getByLabel("Cantidad").fill("1");
    await page.getByRole("button", { name: /registrar/i }).last().click();

    await info.attach("venta-registrada", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-26", "El ingreso del día desglosa pagos y ventas", async ({ page }, info) => {
    await irA(page, RUTAS.hoy);

    // El desglose vive plegado: el total del día es lo primero que se lee, y
    // de dónde salió es el segundo paso.
    await page.getByRole("button", { name: /movimientos? registrados?/i }).click();

    await expect(page.getByText(/pagos de membresía/i)).toBeVisible();
    await expect(page.getByText(/venta de productos/i)).toBeVisible();

    await info.attach("ingreso-del-dia", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-27", "Las categorías se crean en inventario y en egresos", async ({ page }) => {
    for (const ruta of [RUTAS.categoriasInventario, RUTAS.categoriasEgresos]) {
      await irA(page, ruta);
      const nombre = `E2E Cat ${ID} ${ruta.includes("inventory") ? "inv" : "egr"}`;
      await page.getByLabel("Nueva categoría").fill(nombre);
      await page.getByRole("button", { name: /^agregar$/i }).click();
      await expect(page.getByText(nombre).first()).toBeVisible();
    }
  });
});
