import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Assumes the app is already running:
 *   frontend  http://localhost:3000   (production build: `next build && next start`)
 *   backend   http://127.0.0.1:8000   (FastAPI on a PostgreSQL test DB)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    actionTimeout: 10_000,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
