import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  crearItemInventario,
  crearPlan,
  crearCliente,
  elegirOpcion,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const ITEM_NORMAL = `E2E Proteina ${ID}`;
const ITEM_BAJO_MINIMO = `E2E Bebida ${ID}`;
const ITEM_AGOTADO = `E2E Barra ${ID}`;
const CATEGORIA = `E2E Cat Inv ${ID}`;

test.describe.configure({ mode: "serial" });

test.describe("F16 · Inventario, a fondo", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearItemInventario(page, { nombre: ITEM_NORMAL, stock: 20, minimo: 5 });
    // 3 en existencia, mínimo 5: nace bajo mínimo.
    await crearItemInventario(page, { nombre: ITEM_BAJO_MINIMO, stock: 3, minimo: 5 });
    // Nace agotado.
    await crearItemInventario(page, { nombre: ITEM_AGOTADO, stock: 0, minimo: 2 });
    await page.close();
  });

  caso("CP-66", "Un ítem nuevo aparece con sus datos en el listado", async ({ page }, info) => {
    await irA(page, RUTAS.inventarioTodos);
    const fila = page.locator("tr", { hasText: ITEM_NORMAL }).first();
    await expect(fila).toContainText("20");
    await expect(fila).toContainText(/disponible/i);

    await info.attach("item-creado", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-67", "Un ítem por debajo del mínimo se marca y aparece en 'Bajo mínimo'", async ({ page }, info) => {
    await irA(page, RUTAS.inventarioTodos);
    const fila = page.locator("tr", { hasText: ITEM_BAJO_MINIMO }).first();
    await expect(fila).toContainText(/bajo mínimo/i);

    await irA(page, RUTAS.inventarioBajoMinimo);
    await expect(page.getByText(ITEM_BAJO_MINIMO).first()).toBeVisible();
    // El agotado NO cuenta como "bajo mínimo": es su propia categoría.
    await expect(page.getByText(ITEM_AGOTADO)).toHaveCount(0);

    await info.attach("bajo-minimo", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-68", "Un ítem en cero aparece en 'Agotados', no en 'Bajo mínimo'", async ({ page }, info) => {
    await irA(page, RUTAS.inventarioAgotados);
    await expect(page.getByText(ITEM_AGOTADO).first()).toBeVisible();

    const fila = page.locator("tr", { hasText: ITEM_AGOTADO }).first();
    await expect(fila).toContainText(/agotado/i);

    await info.attach("agotados", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-69", "Editar un ítem sin nombre no deja guardar", async ({ page }) => {
    await irA(page, RUTAS.inventarioTodos);
    await page
      .locator("tr", { hasText: ITEM_NORMAL })
      .getByRole("button")
      .first()
      .click();

    await page.getByLabel("Nombre").fill("");
    await page.getByRole("button", { name: /guardar ítem/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/nombre es obligatorio/i);
  });

  caso(
    "CP-70",
    "Unas existencias negativas las bloquea el navegador antes de llegar al formulario",
    async ({ page }) => {
      // No es un caso de éxito: es dejar constancia de que el mensaje propio
      // de la app ("Las existencias no pueden ser negativas") es código
      // muerto. El campo lleva min=0 nativo, así que el navegador bloquea el
      // envío del formulario ANTES de que el submit de React se ejecute — el
      // usuario ve el globo nativo del navegador, nunca el mensaje en
      // español que el formulario preparó para este caso.
      await irA(page, RUTAS.inventarioTodos);
      await page
        .locator("tr", { hasText: ITEM_NORMAL })
        .getByRole("button")
        .first()
        .click();

      const campo = page.getByLabel("Existencias");
      await campo.fill("-5");
      const valido = await campo.evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(valido).toBe(false);

      await page.getByRole("button", { name: /guardar ítem/i }).click();
      // Ningún mensaje de la app aparece: el submit ni siquiera llegó a React.
      await expect(page.locator("p[role=alert]")).toHaveCount(0);
    },
  );

  caso("CP-71", "Vender un producto descuenta el stock exactamente en lo vendido", async ({ page }, info) => {
    await irA(page, RUTAS.venta);
    await elegirOpcion(page, "Producto", ITEM_NORMAL);
    await page.getByLabel("Cantidad").fill("3");
    await page.getByLabel("Valor cobrado (COP)").fill("15000");
    await page.getByLabel("Forma de pago").selectOption("cash");
    await page.getByRole("button", { name: /registrar venta/i }).click();

    await irA(page, RUTAS.inventarioTodos);
    const fila = page.locator("tr", { hasText: ITEM_NORMAL }).first();
    await expect(fila).toContainText("17"); // 20 - 3

    await info.attach("stock-descontado", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-72", "Vender más de lo que hay en existencia se rechaza, y el stock no se mueve", async ({ page }) => {
    await irA(page, RUTAS.venta);
    await elegirOpcion(page, "Producto", ITEM_AGOTADO);
    await page.getByLabel("Cantidad").fill("1");
    await page.getByLabel("Valor cobrado (COP)").fill("5000");
    await page.getByLabel("Forma de pago").selectOption("cash");
    await page.getByRole("button", { name: /registrar venta/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(
      /negativo|no hay existencia/i,
    );

    await irA(page, RUTAS.inventarioAgotados);
    await expect(page.getByText(ITEM_AGOTADO).first()).toBeVisible();
  });

  caso("CP-73", "Una cantidad en cero se rechaza antes de llamar a la API", async ({ page }) => {
    await irA(page, RUTAS.venta);

    const peticiones: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/product-sales") && r.method() === "POST") {
        peticiones.push(r.url());
      }
    });

    await elegirOpcion(page, "Producto", ITEM_NORMAL);
    await page.getByLabel("Cantidad").fill("0");
    await page.getByLabel("Valor cobrado (COP)").fill("5000");
    await page.getByRole("button", { name: /registrar venta/i }).click();

    await expect(page.locator("p[role=alert]")).toContainText(/cantidad/i);
    expect(peticiones).toHaveLength(0);
  });

  caso("CP-74", "Una categoría nueva aparece disponible al crear un ítem", async ({ page }) => {
    await irA(page, RUTAS.categoriasInventario);
    await page.getByLabel("Nueva categoría").fill(CATEGORIA);
    await page.getByRole("button", { name: /^agregar$/i }).click();
    await expect(page.getByText(CATEGORIA).first()).toBeVisible();

    await irA(page, RUTAS.inventarioNuevo);
    const opciones = await page
      .getByLabel("Categoría")
      .locator("option")
      .allTextContents();
    expect(opciones.some((texto) => texto.includes(CATEGORIA))).toBe(true);
  });

  caso("CP-75", "La venta descuenta stock también cuando se vende a un cliente puntual", async ({ page }, info) => {
    const plan = `E2E Venta ${ID}`;
    const cliente = `E2E Venta ${ID}`;
    await crearPlan(page, { nombre: plan, precioPesos: 50_000, diasPorSemana: 6 });
    await crearCliente(page, { nombre: cliente, documento: `42${ID}`, plan });

    await irA(page, RUTAS.venta);
    await elegirOpcion(page, "Producto", ITEM_NORMAL);
    await page.getByLabel("Cantidad").fill("2");
    await page.getByLabel("Valor cobrado (COP)").fill("10000");
    await page.getByLabel("Forma de pago").selectOption("cash");
    await elegirOpcion(page, "Cliente", cliente);
    await page.getByRole("button", { name: /registrar venta/i }).click();

    await irA(page, RUTAS.inventarioTodos);
    const fila = page.locator("tr", { hasText: ITEM_NORMAL }).first();
    await expect(fila).toContainText("15"); // 17 - 2

    await info.attach("venta-a-cliente", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
