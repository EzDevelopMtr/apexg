import { test as base, expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

export { expect };

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
  cuerpo: (args: { page: Page }, testInfo: TestInfo) => Promise<void>,
): void {
  base(`${id} · ${titulo}`, async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: "caso", description: id });
    await cuerpo({ page }, testInfo);
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
