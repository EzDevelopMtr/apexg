import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA } from "../support/app";

test.describe.configure({ mode: "serial" });

/** Las pestañas de la barra superior del módulo. */
const pestanas = (page: Page) =>
  page.getByRole("navigation", { name: /secciones de/i });

/** Los filtros y la acción principal, sobre la tabla. */
const filtros = (page: Page) =>
  page.getByRole("group", { name: /filtrar el listado/i });

test.describe("F18 · Navegación sin menú lateral ni redundancias", () => {
  caso("CP-77", "Cada módulo muestra el logo y su nombre arriba, sin riel lateral", async ({ page }, info) => {
    for (const [ruta, modulo] of [
      [RUTAS.clientesTodos, "Clientes"],
      [RUTAS.planesTodos, "Membresías"],
      [RUTAS.pagosTodos, "Pagos"],
      [RUTAS.entrenadoresTodos, "Entrenadores"],
      [RUTAS.egresosTodos, "Egresos"],
      [RUTAS.inventarioTodos, "Inventario"],
      [RUTAS.finanzasPanel, "Finanzas"],
      [RUTAS.hoy, "Apartado diario"],
    ] as const) {
      await irA(page, ruta);
      const barra = page.locator("header");
      await expect(barra.getByRole("img", { name: "APEX GYM" })).toBeVisible();
      await expect(barra).toContainText(modulo);
      await expect(page.locator("aside")).toHaveCount(0);
    }
    await irA(page, RUTAS.clientesTodos);
    await info.attach("clientes-sin-redundancia", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  caso("CP-78", "El nombre del módulo aparece una sola vez a la vista", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);
    // Antes: barra, rótulo, título y descripción repetían "clientes". Ahora
    // solo la barra; el título queda para lectores de pantalla.
    // Fuera de .sr-only: Playwright cuenta como visible el h1 de solo
    // lectores de pantalla, que ocupa un píxel recortado.
    const visibles = await page
      .locator("main")
      .getByText(/gestión de clientes|todos los clientes|administra los clientes/i)
      .evaluateAll(
        (nodos) => nodos.filter((nodo) => !nodo.closest(".sr-only")).length,
      );
    expect(visibles).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos los clientes");
  });

  caso("CP-79", "Un módulo con un solo lugar no muestra pestañas", async ({ page }) => {
    for (const ruta of [RUTAS.clientesTodos, RUTAS.pagosTodos, RUTAS.planesTodos]) {
      await irA(page, ruta);
      await expect(pestanas(page)).toHaveCount(0);
    }
  });

  caso("CP-80", "Agregar se abre desde un solo botón, y lleva título propio", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);
    const agregar = page.getByRole("link", { name: /agregar cliente/i });
    await expect(agregar).toHaveCount(1);
    await agregar.click();
    await page.waitForURL("**/modules/clients/add");
    // En el formulario sí hay título visible: nada más dice dónde se está.
    await expect(page.getByRole("heading", { level: 1, name: "Agregar cliente" })).toBeVisible();
    await expect(page.getByRole("button", { name: /guardar cliente/i })).toBeVisible();
    await info.attach("formulario-con-titulo", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    // Y lo mismo en los demás módulos con listado.
    for (const [ruta, accion, destino] of [
      [RUTAS.pagosTodos, /registrar pago/i, "record"],
      [RUTAS.planesTodos, /crear plan/i, "add"],
      [RUTAS.entrenadoresTodos, /agregar entrenador/i, "add"],
      [RUTAS.egresosTodos, /registrar egreso/i, "add"],
      [RUTAS.inventarioTodos, /agregar ítem/i, "add"],
    ] as const) {
      await irA(page, ruta);
      const boton = page.getByRole("link", { name: accion });
      await expect(boton).toHaveCount(1);
      await boton.click();
      await page.waitForURL(`**/${destino}`);
    }
  });

  caso("CP-81", "Los filtros quedan sobre la tabla y cada uno navega", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);
    await expect(filtros(page).getByRole("link")).toHaveText([
      "Todos",
      "Clientes activos",
      "Por vencer",
      "En mora",
    ]);
    await filtros(page).getByRole("link", { name: "En mora" }).click();
    await page.waitForURL("**/modules/clients/overdue");
    await expect(filtros(page).getByRole("link", { name: "En mora" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await info.attach("filtro-en-mora", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    for (const [ruta, filtro, destino] of [
      [RUTAS.inventarioTodos, "Agotados", "outOfStock"],
      [RUTAS.inventarioTodos, "Bajo mínimo", "lowStock"],
      [RUTAS.pagosTodos, "Con saldo pendiente", "outstanding"],
      [RUTAS.entrenadoresTodos, "Disponibles", "available"],
      [RUTAS.planesTodos, "Promociones", "promotions"],
    ] as const) {
      await irA(page, ruta);
      await filtros(page).getByRole("link", { name: filtro }).click();
      await page.waitForURL(`**/${destino}`);
    }

    // Un módulo con un solo listado no muestra filtros.
    await irA(page, RUTAS.egresosTodos);
    await expect(filtros(page)).toHaveCount(0);
  });

  caso("CP-82", "Las pestañas quedan solo donde hay lugares distintos", async ({ page }) => {
    await irA(page, RUTAS.inventarioTodos);
    await expect(pestanas(page).getByRole("link")).toHaveText(["Listado", "Categorías"]);
    await pestanas(page).getByRole("link", { name: "Categorías" }).click();
    await page.waitForURL("**/modules/inventory/categories");
    // En un panel no hay filtros ni acción de tabla.
    await expect(filtros(page)).toHaveCount(0);

    await irA(page, RUTAS.entrenadoresTodos);
    await pestanas(page).getByRole("link", { name: "Comisiones" }).click();
    await page.waitForURL("**/modules/trainers/commissions");

    // Sin listado, el formulario conserva su pestaña.
    await irA(page, RUTAS.hoy);
    await pestanas(page).getByRole("link", { name: "Registrar venta" }).click();
    await page.waitForURL("**/modules/daily-log/sell");
  });

  caso("CP-83", "Cambiar módulo vuelve al selector", async ({ page }) => {
    await irA(page, RUTAS.pagosTodos);
    await page.locator("header").getByRole("link", { name: /cambiar módulo/i }).click();
    await page.waitForURL("**/modules");
  });
});
