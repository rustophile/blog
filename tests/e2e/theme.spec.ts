import { expect, test } from "@playwright/test";

const html = (page: import("@playwright/test").Page) => page.locator("html");

test("defaults to Warm Paper", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-theme", "cream");
});

test("picking a theme applies it and remembers the choice", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select color theme" }).click();
  await page.getByRole("menuitem", { name: /Slate Navy/ }).click();
  await expect(html(page)).toHaveAttribute("data-theme", "slate");

  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "slate");
});
