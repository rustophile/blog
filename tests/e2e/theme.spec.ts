import { expect, test, type Page } from "@playwright/test";

const html = (page: Page) => page.locator("html");
const themeColor = (page: Page) => page.locator('meta[name="theme-color"]');

async function pick(page: Page, name: string) {
  await page.getByRole("button", { name: "Select color theme" }).click();
  await page.getByRole("menuitemradio", { name }).click();
}

test.describe("with a light OS", () => {
  test.use({ colorScheme: "light" });

  test("follows the OS: Warm Paper", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "paper");
    await expect(themeColor(page)).toHaveAttribute("content", "#f7f4ea");
  });

  test("picking std Dark applies it, marks it, and remembers it", async ({
    page,
  }) => {
    await page.goto("/");
    await pick(page, "std Dark");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect(themeColor(page)).toHaveAttribute("content", "#353535");

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Select color theme" }).click();
    await expect(
      page.getByRole("menuitemradio", { name: "std Dark" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("with a dark OS", () => {
  test.use({ colorScheme: "dark" });

  test("follows the OS: std Dark", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("Warm Paper overrides the OS until System is picked", async ({
    page,
  }) => {
    await page.goto("/");
    await pick(page, "Warm Paper");
    await expect(html(page)).toHaveAttribute("data-theme", "paper");

    await pick(page, "System");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("page changes", () => {
  test.use({ colorScheme: "dark" });

  // an animated background faded from the browser's default canvas on every navigation
  test("the page background is set at once, never animated", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Blog", exact: true }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    const style = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return { background: s.backgroundColor, duration: s.transitionDuration };
    });
    expect(style).toEqual({ background: "rgb(53, 53, 53)", duration: "0s" });
  });
});
