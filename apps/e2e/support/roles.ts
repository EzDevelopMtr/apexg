import { expect, test } from "@playwright/test";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { GIMNASIO, NOMBRE_GIMNASIO, baseUrl } from "./app";

/** Quien entra: el usuario y la clave que le entregó el administrador. */
export interface Credencial {
  usuario: string;
  clave: string;
}

/** Una persona con su propio navegador: su sesión no se mezcla con la de nadie. */
export interface Sesion {
  page: Page;
  context: BrowserContext;
  /** Cierra el navegador y deja su video en el reporte, junto al de la prueba. */
  cerrar: () => Promise<void>;
}

/**
 * Un navegador limpio: sin sesión, listo para mostrar el formulario de entrada.
 *
 * Los contextos que se abren dentro de una prueba no heredan el video de la
 * configuración (la página de la prueba se queda en blanco mientras otra
 * persona trabaja), así que cada uno graba el suyo y lo adjunta al cerrar.
 */
export async function navegadorAparte(browser: Browser, quien = "navegador"): Promise<Sesion> {
  const info = test.info();
  const context = await browser.newContext({
    baseURL: baseUrl(),
    locale: "es-CO",
    timezoneId: "America/Bogota",
    viewport: { width: 1440, height: 900 },
    // Sin sesión guardada: cada persona entra por el formulario, como en el gimnasio.
    storageState: { cookies: [], origins: [] },
    recordVideo: { dir: info.outputPath(`video-${quien}`), size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  return {
    context,
    page,
    async cerrar() {
      const video = page.video();
      await context.close();
      if (video) await info.attach(`video · ${quien}`, { path: await video.path(), contentType: "video/webm" });
    },
  };
}

/** Escribe usuario y clave en el formulario del gimnasio y pulsa Ingresar. */
export async function escribirCredencial(page: Page, { usuario, clave }: Credencial): Promise<void> {
  await page.goto(`/${GIMNASIO}`);
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(clave);
  await page.getByRole("button", { name: /ingresar/i }).click();
}

/** Inicia el turno de esa persona: formulario de entrada y selector de módulos. */
export async function iniciarTurno(browser: Browser, credencial: Credencial, quien = credencial.usuario): Promise<Sesion> {
  const sesion = await navegadorAparte(browser, quien);
  await escribirCredencial(sesion.page, credencial);
  await sesion.page.waitForURL("**/modules");
  return sesion;
}

/** El panel de plataforma: otra puerta, con correo y no con usuario. */
export async function entrarAlPanel(browser: Browser): Promise<Sesion> {
  const correo = process.env.E2E_PLATFORM_EMAIL;
  const clave = process.env.E2E_PLATFORM_PASSWORD;
  expect(correo && clave, "Falta E2E_PLATFORM_EMAIL o E2E_PLATFORM_PASSWORD en apps/e2e/.env.dev.local").toBeTruthy();

  const sesion = await navegadorAparte(browser, "panel");
  await sesion.page.goto("/admin/login");
  await sesion.page.getByLabel("Correo").fill(correo as string);
  await sesion.page.getByLabel("Contraseña", { exact: true }).fill(clave as string);
  await sesion.page.getByRole("button", { name: /^ingresar$/i }).click();
  await sesion.page.waitForURL("**/admin");
  return sesion;
}

/** La hoja del gimnasio de pruebas dentro del panel, abierta en su sección de usuarios. */
export async function abrirGimnasioEnElPanel(page: Page): Promise<void> {
  await page.getByRole("button", { name: new RegExp(NOMBRE_GIMNASIO, "i") }).first().click();
  await expect(page.getByRole("dialog", { name: /editar gimnasio/i })).toBeVisible();
}

export interface UsuarioNuevo {
  nombre: string;
  usuario: string;
  /** El perfil tal como se lee en el panel: «Recepcionista» o «Administrador». */
  perfil: string;
}

/**
 * Crea un usuario desde el panel y devuelve lo que se le entrega a la persona.
 * La clave se genera en el servidor y se muestra una sola vez: esta es la única
 * oportunidad de leerla.
 */
export async function crearUsuarioEnElPanel(page: Page, nuevo: UsuarioNuevo): Promise<Credencial> {
  await abrirGimnasioEnElPanel(page);
  await page.getByRole("button", { name: /nuevo usuario/i }).click();
  await page.getByLabel("Nombre completo").fill(nuevo.nombre);
  await page.getByLabel("Usuario", { exact: true }).fill(nuevo.usuario);
  // El formulario va encima de la lista: su selector de perfil es el primero.
  await page.getByRole("tab", { name: nuevo.perfil, exact: true }).first().click();
  await page.getByRole("button", { name: /^crear usuario$/i }).click();
  await expect(page.getByText(`${nuevo.nombre} ya puede entrar.`)).toBeVisible();
  return { usuario: nuevo.usuario, clave: await leerClaveEmitida(page) };
}

/** La clave de la tarjeta de credenciales que acaba de aparecer. */
export async function leerClaveEmitida(page: Page): Promise<string> {
  const tarjeta = page.locator("div").filter({ hasText: /no se vuelve a mostrar/i }).last();
  const clave = await tarjeta.getByText("Contraseña", { exact: true }).locator("xpath=following-sibling::code").textContent();
  expect(clave, "La tarjeta no mostró la contraseña").toBeTruthy();
  return (clave as string).trim();
}

/** El botón de la fila de ese usuario dentro de la hoja del gimnasio. */
export function filaDeUsuario(page: Page, usuario: string) {
  return page.getByRole("button", { name: new RegExp(`@${usuario}(?!\\w)`) });
}

/**
 * La fila entera, con su detalle desplegable: cada usuario trae sus propios
 * botones (restablecer, desactivar, perfil), así que se busca dentro de la suya.
 */
export function detalleDeUsuario(page: Page, usuario: string) {
  return filaDeUsuario(page, usuario).locator("xpath=..");
}
