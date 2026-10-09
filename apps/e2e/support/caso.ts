import { test as base, expect } from "@playwright/test";
import type { Browser, Page, TestInfo } from "@playwright/test";

export { expect };

/** El gimnasio que se prueba: su sesión se renueva por su propia dirección. */
const GIMNASIO = process.env.E2E_GYM ?? "apex-gym";
/** La sesión que cada caso recibe al abrir su navegador: la guarda `auth.setup.ts`. */
const SESION = new URL("../reports/session.json", import.meta.url).pathname.slice(1);

/**
 * Un caso del plan de pruebas, no un `test` suelto.
 *
 * El id viaja en el titulo y en una anotacion: el titulo es lo que lee una
 * persona en el reporte HTML, y la anotacion es lo que lee el script que
 * vuelca los resultados al xlsx. Sin el id no hay forma de saber que fila
 * llenar.
 */
export function caso(
  id: string,
  titulo: string,
  cuerpo: (args: { page: Page; browser: Browser }, testInfo: TestInfo) => Promise<void>,
): void {
  base(`${id} · ${titulo}`, async ({ page, browser }, testInfo) => {
    testInfo.annotations.push({ type: "caso", description: id });
    // El token dura 15 minutos y cada caso abre su navegador desde la sesión
    // guardada al inicio: en una corrida larga (con ventana visible, 15 o más)
    // llegaría vencida. Cada caso la renueva y vuelve a guardarla, así el
    // siguiente arranca con una vigente. Sin sesión (login) no hace nada.
    const renovada = await page.request.post(`/${GIMNASIO}/api/auth/refresh`, { failOnStatusCode: false });
    if (renovada.ok()) await page.context().storageState({ path: SESION });
    await cuerpo({ page, browser }, testInfo);
  });
}

export const describe = base.describe;
export const paso = base.step;

/**
 * Captura adjunta al reporte con un nombre legible.
 *
 * Playwright ya guarda una captura al final de cada prueba; esta sirve para
 * los momentos intermedios que el resultado final ya no muestra — el aviso
 * que aparecio y se fue, la fila antes de pulsar el boton.
 */
export async function evidencia(
  testInfo: TestInfo,
  page: Page,
  nombre: string,
): Promise<void> {
  await testInfo.attach(nombre, {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
}
