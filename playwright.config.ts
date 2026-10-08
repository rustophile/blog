import { defineConfig, devices } from "@playwright/test";

// tests run against the production build; 4322 keeps clear of `astro dev` on 4321
// (E2E_PORT lets parallel checkouts run their own preview servers side by side)
const PORT = Number(process.env.E2E_PORT ?? 4322);
const baseURL = `http://localhost:${PORT}`;

// `astro dev`, for the dev smoke test: the other tests only see the production build, and a
// config change once broke every page in dev while the build stayed fine
const DEV_PORT = PORT + 10;

// screenshot baselines are platform-specific and local-only (see tests/e2e/visual.spec.ts)
const visual = /visual\.spec\.ts/;
const dev = /dev\.spec\.ts/;
const notBuild = [visual, dev];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    // the default per-pixel tolerance (0.2) let whole-overlay color changes pass unnoticed
    toHaveScreenshot: { threshold: 0.05 },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: notBuild,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: notBuild,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testIgnore: notBuild,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "dev",
      testMatch: dev,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${DEV_PORT}`,
      },
    },
    ...(process.env.CI
      ? []
      : [
          {
            name: "visual",
            testMatch: visual,
            use: { ...devices["Desktop Chrome"] },
          },
        ]),
  ],
  webServer: [
    {
      // --ignore-lock: run alongside any other preview server
      // CI builds dist/ in an earlier step and deploys that same build, so don't rebuild here
      command: `${process.env.CI ? "" : "pnpm build && "}pnpm preview --port ${PORT} --ignore-lock`,
      // Astro backgrounds `preview` when it detects an AI agent; Playwright needs it in the foreground
      env: { ASTRO_PREVIEW_BACKGROUND: "0" },
      url: baseURL,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // --ignore-lock: run alongside your own `astro dev`
      command: `pnpm astro dev --port ${DEV_PORT} --ignore-lock`,
      // Astro backgrounds `dev` when it detects an AI agent; Playwright needs it in the foreground
      env: { ASTRO_DEV_BACKGROUND: "0" },
      url: `http://localhost:${DEV_PORT}`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
