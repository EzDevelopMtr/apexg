import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA } from "../support/app";

test.describe.configure({ mode: "serial" });

test.describe("F9 · La sesión aguanta la jornada", () => {
  caso("CP-29", "La renovación devuelve un token nuevo y vigente", async ({ page }, info) => {
    await irA(page, RUTAS.modulos);

    const antes = (await page.context().cookies()).find(
      (galleta) => galleta.name === "apexg_session",
    );
    expect(antes, "No hay cookie de sesión").toBeTruthy();

    const renovada = await page.request.post("/api/auth/refresh");
    expect(renovada.status()).toBe(200);

    const despues = (await page.context().cookies()).find(
      (galleta) => galleta.name === "apexg_session",
    );
    // Token distinto, no el mismo con otra fecha: el backend firma uno nuevo.
    expect(despues?.value).not.toBe(antes?.value);

    // Y el nuevo sirve: la siguiente petición autenticada pasa.
    const conElNuevo = await page.request.get("/api/auth/me");
    expect(conElNuevo.status()).toBe(200);

    await info.attach("renovacion", {
      body: `expira antes: ${antes?.expires} · expira ahora: ${despues?.expires}`,
      contentType: "text/plain",
    });
  });

  caso("CP-32", "Volver a la pestaña renueva el token", async ({ page }) => {
    await irA(page, RUTAS.modulos);

    // Comprueba que el efecto quedó montado y escuchando: si nadie registró
    // el listener, este evento no dispara ninguna petición y la espera vence.
    const renovacion = page.waitForRequest(
      (peticion) =>
        peticion.url().includes("/api/auth/refresh") &&
        peticion.method() === "POST",
      { timeout: 10_000 },
    );
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await renovacion;
  });

  caso("CP-30", "Sin sesión, renovar se rechaza", async ({ page }) => {
    await irA(page, RUTAS.modulos);

    // Un token caducado no se puede resucitar: renovar exige uno vigente.
    // El estado vacío va explícito: `storageState: undefined` deja que el
    // contexto herede la sesión del proyecto y la petición salía firmada.
    const anonimo = await page.context().browser()!.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const respuesta = await anonimo.request.post(
      `${new URL(page.url()).origin}/api/auth/refresh`,
      { failOnStatusCode: false },
    );
    expect(respuesta.status()).toBe(401);
    await anonimo.close();
  });

  caso("CP-31", "Navegar entre módulos no cierra la sesión", async ({ page }) => {
    await irA(page, RUTAS.modulos);

    for (const ruta of [
      RUTAS.ingreso,
      RUTAS.clientesTodos,
      RUTAS.pagosTodos,
      RUTAS.planesTodos,
      RUTAS.hoy,
      RUTAS.modulos,
    ]) {
      await irA(page, ruta);
      expect(page.url(), `Rebotó al login en ${ruta}`).not.toContain("/login");
    }
  });
});
