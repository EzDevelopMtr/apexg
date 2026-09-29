import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, baseUrl, irA } from "../support/app";

test.describe.configure({ mode: "serial" });

test.describe("F14 · Usuarios, sesión y permisos", () => {
  caso("CP-53", "Ya con sesión abierta, /login manda directo a /modules", async ({ page }) => {
    await irA(page, "/login");
    await page.waitForURL("**/modules");
  });

  caso("CP-54", "Cerrar sesión borra la cookie y bloquea el acceso a la API", async ({ page }) => {
    await irA(page, RUTAS.modulos);
    await page.getByRole("button", { name: /cerrar sesión/i }).click();
    await page.waitForURL("**/login");

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "apexg_session")).toBeUndefined();

    const sinSesion = await page.request.get("/api/backend/clients", {
      failOnStatusCode: false,
    });
    expect(sinSesion.status()).toBe(401);

    // Vuelve a entrar: el resto de la suite necesita la sesión abierta.
    await page.getByLabel("Usuario").fill(process.env.E2E_USERNAME ?? "");
    await page
      .getByRole("textbox", { name: "Contraseña" })
      .fill(process.env.E2E_PASSWORD ?? "");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForURL("**/modules");
  });

  caso("CP-55", "Un token con la firma alterada se rechaza igual que uno vencido", async ({ page }) => {
    await irA(page, RUTAS.modulos);

    const cookies = await page.context().cookies();
    const sesion = cookies.find((c) => c.name === "apexg_session");
    expect(sesion, "No hay cookie de sesión").toBeTruthy();

    // Se cambia un carácter del final: rompe la firma sin tocar el formato.
    const alterado = (sesion?.value ?? "").slice(0, -1) + (sesion?.value.endsWith("A") ? "B" : "A");
    await page.context().addCookies([
      { ...sesion!, value: alterado },
    ]);

    const respuesta = await page.request.get("/api/backend/clients", {
      failOnStatusCode: false,
    });
    expect(respuesta.status()).toBe(401);

    // Se restaura la cookie válida para no dejar la sesión rota.
    await page.context().addCookies([sesion!]);
  });

  caso("CP-56", "Sin token, cada endpoint de negocio rechaza con 401", async ({ page }) => {
    // page.url() empieza en "about:blank" mientras no se navegue: hay que
    // aterrizar primero, o new URL(page.url()).origin da el string "null".
    await irA(page, RUTAS.modulos);

    const anonimo = await page.context().browser()!.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const origen = baseUrl();

    const rutas = [
      "/api/backend/clients",
      "/api/backend/payments",
      "/api/backend/membership-types",
      "/api/backend/expenses",
      "/api/backend/inventory-items",
      "/api/backend/trainers",
      "/api/backend/savings-pockets",
      "/api/backend/attendances",
    ];

    for (const ruta of rutas) {
      const respuesta = await anonimo.request.get(`${origen}${ruta}`, {
        failOnStatusCode: false,
      });
      expect(respuesta.status(), `${ruta} debería exigir sesión`).toBe(401);
    }

    await anonimo.close();
  });

  caso("CP-57", "El administrador entra a todos los módulos que el ERS le concede", async ({ page }) => {
    for (const ruta of [
      RUTAS.clientesTodos,
      RUTAS.planesTodos,
      RUTAS.pagosTodos,
      RUTAS.entrenadoresTodos,
      RUTAS.egresosTodos,
      RUTAS.inventarioTodos,
      RUTAS.finanzasPanel,
      RUTAS.ingreso,
    ]) {
      await irA(page, ruta);
      expect(page.url(), `${ruta} rebotó al login`).not.toContain("/login");
      // Un módulo al que no se tiene acceso muestra su propio contenido, no
      // una pantalla en blanco ni un error sin manejar.
      await expect(page.locator("main")).not.toBeEmpty();
    }
  });
});
