import { test as setup, expect } from "@playwright/test";

const SESSION = "reports/session.json";

/**
 * Inicia sesion una vez y guarda la cookie para el resto de la suite.
 *
 * Tambien es el CP-01: si esto falla, ningun otro caso tiene sentido, y el
 * reporte lo dice antes de intentar los 27 restantes.
 */
setup("CP-01 · Iniciar sesion con credenciales validas", async ({ page }) => {
  const usuario = process.env.E2E_USERNAME;
  const clave = process.env.E2E_PASSWORD;

  expect(
    usuario && clave,
    "Falta E2E_USERNAME o E2E_PASSWORD en apps/e2e/.env",
  ).toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario as string);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(clave as string);
  await page.getByRole("button", { name: /ingresar/i }).click();

  await page.waitForURL("**/modules");
  // La contraseña no puede quedar en la barra de direcciones ni, por tanto,
  // en el historial del navegador o en los logs del servidor.
  expect(page.url()).not.toContain(clave as string);

  await page.context().storageState({ path: SESSION });
});
