import { test } from "@playwright/test";
import { caso, expect } from "../support/caso";
import {
  RUTAS,
  buscarParaIngreso,
  crearPlan,
  elegirOpcion,
  esperarPost,
  irA,
  marca,
} from "../support/app";

const ID = marca();
const PLAN = `E2E Foto ${ID}`;
const CON_FOTO = `E2E Con foto ${ID}`;
const SIN_FOTO = `E2E Sin foto ${ID}`;
const FOTO = new URL("../fixtures/foto-cliente.png", import.meta.url).pathname.slice(1);

test.describe.configure({ mode: "serial" });

test.describe("F12 · Foto del cliente", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await crearPlan(page, { nombre: PLAN, precioPesos: 80_000, diasPorSemana: 6 });
    await page.close();
  });

  caso("CP-40", "Crear un cliente con su foto", async ({ page }, info) => {
    await irA(page, RUTAS.clientesNuevo);

    await page.getByLabel("Nombre completo").fill(CON_FOTO);
    await page.getByLabel("Documento").fill(`60${ID}1`);
    await page.getByLabel("Teléfono").first().fill("3001112233");
    await elegirOpcion(page, "Tipo de membresía", PLAN);
    await page.locator("#photo").setInputFiles(FOTO);

    const guardado = esperarPost(page, "/clients");
    await page.getByRole("button", { name: /guardar cliente/i }).click();
    expect((await guardado).status()).toBe(201);

    // La foto viaja en la MISMA petición: una sola llamada, no dos.
    await expect(page.getByText(CON_FOTO).first()).toBeVisible();

    await info.attach("cliente-con-foto", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  caso("CP-41", "La foto se sirve y se abre en grande", async ({ page }, info) => {
    await irA(page, RUTAS.clientesTodos);

    const fila = page.getByRole("row", { name: new RegExp(CON_FOTO) });
    const avatar = fila.getByRole("button", { name: /ver la foto de/i });
    await expect(avatar).toBeVisible();

    // La imagen llegó de verdad, no es un roto. Se comprueba sobre el elemento
    // ya pintado y no esperando la petición: el avatar la carga al montar la
    // fila, así que para cuando la prueba pulsa, la respuesta ya pasó.
    const miniatura = avatar.locator("img");
    await expect(miniatura).toBeVisible();
    expect(
      await miniatura.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);

    const servida = await page.request.get(
      await miniatura.evaluate((img: HTMLImageElement) => img.src),
    );
    expect(servida.status()).toBe(200);
    expect(servida.headers()["content-type"]).toContain("image/");

    await avatar.click();
    const visor = page.getByRole("dialog", { name: new RegExp(CON_FOTO) });
    await expect(visor.locator("img")).toBeVisible();

    await info.attach("foto-en-grande", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await page.keyboard.press("Escape");
  });

  caso("CP-42", "Sin foto se muestran las iniciales, y no hay nada que abrir", async ({ page }) => {
    await irA(page, RUTAS.clientesNuevo);
    await page.getByLabel("Nombre completo").fill(SIN_FOTO);
    await page.getByLabel("Documento").fill(`60${ID}2`);
    await page.getByLabel("Teléfono").first().fill("3001112244");
    await elegirOpcion(page, "Tipo de membresía", PLAN);

    const guardado = esperarPost(page, "/clients");
    await page.getByRole("button", { name: /guardar cliente/i }).click();
    expect((await guardado).status()).toBe(201);

    await irA(page, RUTAS.clientesTodos);
    const fila = page.getByRole("row", { name: new RegExp(SIN_FOTO) });
    // Iniciales, no un hueco gris: distinguen igual entre dos personas y no
    // sugieren que falte algo por cargar.
    await expect(fila).toContainText("ES");
    await expect(
      fila.getByRole("button", { name: /ver la foto de/i }),
    ).toHaveCount(0);
  });

  caso("CP-43", "La foto aparece al registrar el ingreso", async ({ page }, info) => {
    await irA(page, RUTAS.ingreso);

    const fila = await buscarParaIngreso(page, CON_FOTO);
    const avatar = fila.getByRole("button", { name: /ver la foto de/i });
    await expect(avatar).toBeVisible();

    await info.attach("ingreso-con-foto", {
      body: await fila.screenshot(),
      contentType: "image/png",
    });

    await avatar.click();
    await expect(
      page.getByRole("dialog", { name: new RegExp(CON_FOTO) }).locator("img"),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // Y el ingreso sigue funcionando con el visor cerrado.
    const otraVez = await buscarParaIngreso(page, CON_FOTO);
    await otraVez.getByRole("button", { name: /registrar ingreso/i }).click();
    await expect(page.getByText(/dentro ahora/i)).toBeVisible();
  });

  caso("CP-44", "Sin sesión, la foto no se sirve", async ({ page }) => {
    await irA(page, RUTAS.clientesTodos);

    const lista = (await (
      await page.request.get("/api/backend/clients")
    ).json()) as { id: string; fullName: string }[];
    const conFoto = lista.find((uno) => uno.fullName === CON_FOTO);
    expect(conFoto, `No se encontró ${CON_FOTO}`).toBeTruthy();

    const anonimo = await page.context().browser()!.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const respuesta = await anonimo.request.get(
      `${new URL(page.url()).origin}/api/backend/clients/${conFoto?.id}/photo`,
      { failOnStatusCode: false },
    );
    expect(respuesta.status()).toBe(401);
    await anonimo.close();
  });
});
