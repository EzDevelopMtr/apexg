import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, crearCliente, irA, marca } from "../support/app";

const ID = marca();
const NUEVOS = Array.from({ length: 6 }, (_, i) => `E2E Nuevo hoy ${i + 1} ${ID}`);

test.describe("F21 · Apartado diario sin listas interminables", () => {
  caso("CP-95", "Con más de 5 clientes nuevos la lista se desplaza en vez de alargar la vista", async ({ page }, info) => {
    for (const [i, nombre] of NUEVOS.entries()) {
      await crearCliente(page, { nombre, documento: `8${ID}${i}`, plan: "Semana" });
    }

    await irA(page, RUTAS.hoy);
    const lista = page.getByRole("list", { name: /clientes nuevos de hoy/i });
    await expect(lista).toContainText(NUEVOS[0] as string);

    const { alto, visible, fila } = await lista.evaluate((ul) => ({
      alto: ul.scrollHeight,
      visible: ul.clientHeight,
      fila: ul.querySelector("li")?.getBoundingClientRect().height ?? 0,
    }));
    // Se ven exactamente cinco filas; el resto queda a un desplazamiento.
    expect(alto).toBeGreaterThan(visible);
    expect(Math.round(visible / fila)).toBe(5);

    await info.attach("clientes-nuevos-con-scroll", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
