import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// dotenv no pisa lo que ya está definido: el archivo de desarrollo va primero y
// manda sobre .env (que quedó con las credenciales del piloto).
for (const archivo of [".env.dev.local", ".env"]) {
  loadEnv({ path: new URL(archivo, import.meta.url).pathname.slice(1) });
}

/**
 * Las pruebas crean y borran datos: jamás contra producción.
 *
 * Desde 2026-10-08 producción es el puerto 3000 y el link público; desarrollo,
 * el 3100, y el entorno de pruebas, el 3200. Sin destino explícito la suite se
 * negaba a arrancar contra el 3000 por defecto, así que ahora se niega a
 * hacerlo salvo que se pida con E2E_PERMITIR_PRODUCCION=1.
 */
const destino = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3000");
const esLocal = ["localhost", "127.0.0.1", "[::1]"].includes(destino.hostname);
if (!process.env.E2E_PERMITIR_PRODUCCION && (!esLocal || destino.port === "3000" || destino.port === "")) {
  throw new Error(
    `E2E_BASE_URL=${destino.origin} es producción (3000 o un link público). ` +
      "Apunta a desarrollo (http://localhost:3100) en apps/e2e/.env.dev.local.",
  );
}

/**
 * Evidencia por defecto, no bajo demanda.
 *
 * El plan de pruebas exige evidencia de ejecucion en cada caso, asi que la
 * traza, el video y las capturas se graban siempre: un fallo que solo aparece
 * una vez no deja reproducirse para volver a grabarlo.
 */
export default defineConfig({
  testDir: "tests",
  outputDir: "reports/artifacts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/results.json" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "on",
    video: "on",
    screenshot: "on",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "apexg",
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /\.anon\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "reports/session.json",
      },
    },
    {
      // Sin sesión guardada: para lo que solo se puede probar SIN haber
      // iniciado sesión — el formulario de login en sí. El proyecto "apexg"
      // ya trae la cookie puesta, así que /login redirige de inmediato antes
      // de que la prueba llegue a ver el formulario.
      name: "anon",
      testMatch: /\.anon\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
