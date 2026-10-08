import { defineConfig, devices } from "@playwright/test";

// tests run against the production build; 4322 keeps clear of `astro dev` on 4321
// (E2E_PORT lets parallel checkouts run their own preview servers side by side)
const PORT = Number(process.env.E2E_PORT ?? 4322);
const baseURL = `http://localhost:${PORT}`;

// screenshot baselines are platform-specific and local-only (see tests/e2e/visual.spec.ts)
const visual = /visual\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: visual,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: visual,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testIgnore: visual,
      use: { ...devices["Desktop Safari"] },
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
  webServer: {
    // --ignore-lock: run alongside any other preview server
    // CI builds dist/ in an earlier step and deploys that same build, so don't rebuild here
    command: `${process.env.CI ? "" : "pnpm build && "}pnpm preview --port ${PORT} --ignore-lock`,
    // Astro backgrounds `preview` when it detects an AI agent; Playwright needs it in the foreground
    env: { ASTRO_PREVIEW_BACKGROUND: "0" },
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
