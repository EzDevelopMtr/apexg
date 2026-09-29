import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: new URL(".env", import.meta.url).pathname.slice(1) });

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
