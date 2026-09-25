import { caso, describe, expect } from "../support/caso";
import { RUTAS, irA } from "../support/app";

describe("F1 · Apertura del día", () => {
  caso("CP-02", "El selector muestra los módulos y cabe sin scroll", async ({ page }, info) => {
    await irA(page, RUTAS.modulos);

    const tarjetas = page.getByRole("link").filter({ hasText: /./ });
    expect(await tarjetas.count()).toBeGreaterThanOrEqual(8);

    // "Cabe en pantalla" es esto y no una impresión: el documento no desborda
    // el alto de la ventana, que es lo que obligaba a hacer scroll al 100%.
    const desborda = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 4,
    );
    expect(desborda).toBe(false);

    await info.attach("selector-de-modulos", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-03", "La lista de clientes aparece al enfocar y se va al salir", async ({ page }) => {
    await irA(page, RUTAS.ingreso);

    const lista = page.getByRole("listbox", { name: "Clientes" });
    await expect(lista).toBeHidden();

    await page.getByLabel("Buscar cliente para registrar ingreso").click();
    await expect(lista).toBeVisible();

    await page.getByRole("heading", { name: /registrar ingreso/i }).click();
    await expect(lista).toBeHidden();
  });
});
