import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { RUTAS, irA, API_AUTH, GIMNASIO } from "../support/app";

/** Same name the web app uses: `COOKIE_PREFIX` when set (see lib/session-cookie-name.ts). */
const SESSION_COOKIE = `${process.env.COOKIE_PREFIX ?? "apexg"}_gym_session`;

test.describe.configure({ mode: "serial" });

test.describe("F9 · La sesión aguanta la jornada", () => {
  caso("CP-29", "La renovación devuelve un token nuevo y vigente", async ({ page }, info) => {
    await irA(page, RUTAS.modulos);

    const antes = (await page.context().cookies()).find(
      (galleta) => galleta.name === SESSION_COOKIE,
    );
    expect(antes, "No hay cookie de sesión").toBeTruthy();

    const renovada = await page.request.post(`${API_AUTH}/refresh`);
    expect(renovada.status()).toBe(200);

    const despues = (await page.context().cookies()).find(
      (galleta) => galleta.name === SESSION_COOKIE,
    );
    // Token distinto, no el mismo con otra fecha: el backend firma uno nuevo.
    expect(despues?.value).not.toBe(antes?.value);

    // Y el nuevo sirve: la siguiente petición autenticada pasa.
    const conElNuevo = await page.request.get(`${API_AUTH}/me`);
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
        peticion.url().includes(`${API_AUTH}/refresh`) &&
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
      `${new URL(page.url()).origin}${API_AUTH}/refresh`,
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
      // Un rebote ahora cae en la entrada del gimnasio, no en /login.
      expect(new URL(page.url()).pathname, `Rebotó al login en ${ruta}`).not.toBe(`/${GIMNASIO}`);
    }
  });
});
