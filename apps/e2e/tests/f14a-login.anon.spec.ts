import { caso, expect } from "../support/caso";
import { irA, marca } from "../support/app";

const ID = marca();

// Sin sesión de por medio (proyecto "anon"): esto es justo lo que no se
// puede probar una vez logueado, porque /login redirige antes de que el
// formulario llegue a aparecer.
caso("CP-49", "Contraseña incorrecta rechaza el login sin decir cuál campo falló", async ({ page }, info) => {
  await irA(page, "/login");
  await page.getByLabel("Usuario").fill(process.env.E2E_USERNAME ?? "apexg");
  await page
    .getByRole("textbox", { name: "Contraseña" })
    .fill("una-clave-que-no-es-2026");
  await page.getByRole("button", { name: /ingresar/i }).click();

  const alerta = page.getByRole("alert").filter({ hasText: /./ });
  await expect(alerta).toBeVisible();
  // Genérico: no debe distinguir "usuario no existe" de "clave incorrecta",
  // porque eso le regalaría a un atacante cuáles usuarios sí existen.
  await expect(alerta).not.toContainText(/usuario/i);
  expect(page.url()).toContain("/login");

  await info.attach("login-rechazado", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

caso("CP-50", "Un usuario inexistente da el mismo rechazo genérico", async ({ page }) => {
  await irA(page, "/login");
  await page.getByLabel("Usuario").fill(`no_existe_${ID}`);
  await page.getByRole("textbox", { name: "Contraseña" }).fill("cualquiera-123");
  await page.getByRole("button", { name: /ingresar/i }).click();

  const alerta = page.getByRole("alert").filter({ hasText: /./ });
  await expect(alerta).toBeVisible();
  await expect(alerta).not.toContainText(/usuario/i);
});

caso("CP-51", "El formulario exige usuario y contraseña antes de llamar a la API", async ({ page }) => {
  await irA(page, "/login");

  const peticiones: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/auth/login")) peticiones.push(r.url());
  });

  await page.getByRole("button", { name: /ingresar/i }).click();
  await expect(page.locator("p[role=alert]")).toContainText(/usuario/i);
  expect(peticiones).toHaveLength(0);
});

caso("CP-52", "Cinco intentos fallidos bloquean el inicio de sesión", async ({ page }, info) => {
  // Usuario ficticio, no el real: el bloqueo dura 15 minutos y es por
  // "empresa:usuario" — usar el admin real lo dejaría fuera de su propia
  // cuenta durante la sesión de pruebas.
  const usuario = `rate_limit_${ID}`;
  await irA(page, "/login");

  for (let intento = 1; intento <= 5; intento++) {
    await page.getByLabel("Usuario").fill(usuario);
    await page.getByRole("textbox", { name: "Contraseña" }).fill(`clave-${intento}`);
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page.locator("p[role=alert]")).toBeVisible();
  }

  // El sexto, con cualquier clave, debe rebotar por bloqueo, no por
  // credenciales: el mensaje cambia.
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByRole("textbox", { name: "Contraseña" }).fill("otra-clave");
  await page.getByRole("button", { name: /ingresar/i }).click();

  const alerta = page.locator("p[role=alert]");
  await expect(alerta).toContainText(/intentos/i);

  await info.attach("bloqueo-por-intentos", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
