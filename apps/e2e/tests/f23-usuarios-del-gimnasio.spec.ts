import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { caso, expect } from "../support/caso";
import { GIMNASIO, marca } from "../support/app";
import {
  abrirGimnasioEnElPanel,
  crearUsuarioEnElPanel,
  detalleDeUsuario,
  entrarAlPanel,
  escribirCredencial,
  filaDeUsuario,
  iniciarTurno,
  leerClaveEmitida,
  navegadorAparte,
} from "../support/roles";
import type { Credencial } from "../support/roles";

const ID = marca();
const NOMBRE = `E2E Cajera ${ID}`;
const USUARIO = `cajera.${ID}`;

/** Lo que el panel le entregó a la cajera: se llena en CP-101 y lo usa el resto. */
let cajera: Credencial;

/** Quien administra la plataforma abre la hoja del gimnasio y ya está en sus usuarios. */
async function conLaHojaAbierta(page: Page): Promise<void> {
  await abrirGimnasioEnElPanel(page);
  await expect(page.getByText(/usuarios? activos?/i).first()).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.describe("F23 · Usuarios del gimnasio, desde el panel de plataforma", () => {
  caso("CP-100", "El panel pide correo y clave: con una equivocada no entra, con la correcta lista los gimnasios", async ({ browser }, info) => {
    const { page, cerrar } = await navegadorAparte(browser, "panel");
    await page.goto("/admin/login");
    await page.getByLabel("Correo").fill(process.env.E2E_PLATFORM_EMAIL ?? "");
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-equivocada");
    await page.getByRole("button", { name: /^ingresar$/i }).click();
    await expect(page.locator("p[role=alert]")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/admin/login");

    await page.getByLabel("Contraseña", { exact: true }).fill(process.env.E2E_PLATFORM_PASSWORD ?? "");
    await page.getByRole("button", { name: /^ingresar$/i }).click();
    await page.waitForURL("**/admin");
    await expect(page.getByText(/gimnasios? en la plataforma/i)).toBeVisible();
    await info.attach("panel-de-plataforma", { body: await page.screenshot(), contentType: "image/png" });
    await cerrar();
  });

  caso("CP-101", "Crear a la cajera con el perfil Recepcionista entrega usuario, clave y la entrada del gimnasio", async ({ browser }, info) => {
    const panel = await entrarAlPanel(browser);
    cajera = await crearUsuarioEnElPanel(panel.page, { nombre: NOMBRE, usuario: USUARIO, perfil: "Recepcionista" });

    expect(cajera.clave.length).toBeGreaterThanOrEqual(8);
    // La tarjeta dice dónde entra: la dirección del gimnasio, no la de otro.
    await expect(panel.page.getByText(new RegExp(`/${GIMNASIO}$`)).first()).toBeVisible();
    await expect(filaDeUsuario(panel.page, USUARIO)).toContainText("Recepcionista");
    await info.attach("credenciales-de-la-cajera", { body: await panel.page.screenshot(), contentType: "image/png" });
    await panel.cerrar();
  });

  caso("CP-102", "Un usuario repetido se avisa mientras se escribe, antes de crearlo", async ({ browser }) => {
    const panel = await entrarAlPanel(browser);
    await conLaHojaAbierta(panel.page);
    await panel.page.getByRole("button", { name: /nuevo usuario/i }).click();
    await panel.page.getByLabel("Usuario", { exact: true }).fill(USUARIO);
    await expect(panel.page.getByText("Ya existe en este gimnasio.")).toBeVisible();

    // Y con un nombre sin sentido para un usuario, también.
    await panel.page.getByLabel("Usuario", { exact: true }).fill("Con Espacios");
    await expect(panel.page.getByText(/solo minúsculas, números/i)).toBeVisible();
    await panel.cerrar();
  });

  caso("CP-103", "La cajera entra con lo que se le entregó y es Recepcionista", async ({ browser }, info) => {
    const turno = await iniciarTurno(browser, cajera);
    await expect(turno.page.getByText("Recepcionista", { exact: true })).toBeVisible();
    await expect(turno.page.getByText(USUARIO, { exact: true })).toBeVisible();
    await info.attach("turno-de-la-cajera", { body: await turno.page.screenshot(), contentType: "image/png" });
    await turno.cerrar();
  });

  caso("CP-104", "Restablecer la contraseña: la anterior deja de servir y la nueva entra", async ({ browser }) => {
    const panel = await entrarAlPanel(browser);
    await conLaHojaAbierta(panel.page);
    await filaDeUsuario(panel.page, USUARIO).click();
    await detalleDeUsuario(panel.page, USUARIO).getByRole("button", { name: /restablecer contraseña/i }).click();
    const nueva = await leerClaveEmitida(panel.page);
    expect(nueva).not.toBe(cajera.clave);

    // La vieja ya no abre la puerta…
    const { page: pagina, cerrar: cerrarIntento } = await navegadorAparte(browser, "intento");
    await escribirCredencial(pagina, cajera);
    await expect(pagina.locator("p[role=alert]")).toBeVisible();
    expect(new URL(pagina.url()).pathname).toBe(`/${GIMNASIO}`);
    await cerrarIntento();

    // …y la nueva sí.
    cajera = { usuario: USUARIO, clave: nueva };
    const turno = await iniciarTurno(browser, cajera);
    await turno.cerrar();
    await panel.cerrar();
  });

  caso("CP-105", "Desactivar a la cajera le cierra la puerta; reactivarla se la abre", async ({ browser }, info) => {
    const panel = await entrarAlPanel(browser);
    await conLaHojaAbierta(panel.page);
    await filaDeUsuario(panel.page, USUARIO).click();
    await detalleDeUsuario(panel.page, USUARIO).getByRole("button", { name: /^desactivar$/i }).click();
    await expect(filaDeUsuario(panel.page, USUARIO)).toContainText("desactivado");

    const { page: pagina, cerrar: cerrarIntento } = await navegadorAparte(browser, "intento");
    await escribirCredencial(pagina, cajera);
    await expect(pagina.locator("p[role=alert]")).toBeVisible();
    expect(new URL(pagina.url()).pathname).toBe(`/${GIMNASIO}`);
    await info.attach("cajera-desactivada", { body: await pagina.screenshot(), contentType: "image/png" });
    await cerrarIntento();

    await detalleDeUsuario(panel.page, USUARIO).getByRole("button", { name: /^reactivar$/i }).click();
    await expect(filaDeUsuario(panel.page, USUARIO)).not.toContainText("desactivado");
    const turno = await iniciarTurno(browser, cajera);
    await turno.cerrar();
    await panel.cerrar();
  });

  caso("CP-106", "El único administrador no se puede desactivar: la pantalla lo dice y el botón está apagado", async ({ browser }) => {
    const panel = await entrarAlPanel(browser);
    await conLaHojaAbierta(panel.page);
    await filaDeUsuario(panel.page, process.env.E2E_USERNAME ?? "").click();
    const administrador = detalleDeUsuario(panel.page, process.env.E2E_USERNAME ?? "");
    await expect(administrador.getByText(/único administrador activo/i)).toBeVisible();
    await expect(administrador.getByRole("button", { name: /^desactivar$/i })).toBeDisabled();
    await panel.cerrar();
  });

  caso("CP-107", "Cambiar el perfil a Administrador abre los ocho módulos; devolverlo a Recepcionista los vuelve a tres", async ({ browser }, info) => {
    const panel = await entrarAlPanel(browser);
    await conLaHojaAbierta(panel.page);
    await filaDeUsuario(panel.page, USUARIO).click();
    await detalleDeUsuario(panel.page, USUARIO).getByRole("tab", { name: "Administrador", exact: true }).click();
    await expect(filaDeUsuario(panel.page, USUARIO)).toContainText("Administrador");

    const comoAdmin = await iniciarTurno(browser, cajera);
    await expect(comoAdmin.page.getByRole("link", { name: /finanzas/i }).first()).toBeVisible();
    await info.attach("cajera-como-administradora", { body: await comoAdmin.page.screenshot(), contentType: "image/png" });
    await comoAdmin.cerrar();

    await detalleDeUsuario(panel.page, USUARIO).getByRole("tab", { name: "Recepcionista", exact: true }).click();
    await expect(filaDeUsuario(panel.page, USUARIO)).toContainText("Recepcionista");
    const deVuelta = await iniciarTurno(browser, cajera);
    await expect(deVuelta.page.getByRole("link", { name: /finanzas/i })).toHaveCount(0);
    await deVuelta.cerrar();
    await panel.cerrar();
  });
});

