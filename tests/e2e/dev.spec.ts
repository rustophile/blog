import { expect, test } from "@playwright/test";
import { pages } from "./pages";

// Every page renders under `astro dev` too, without errors in the browser.
for (const path of pages) {
  test(`${path} renders in dev`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("navigation", { name: "Main Navigation" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
