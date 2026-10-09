import { expect, test } from "@playwright/test";
import { siteConfig } from "@/config/site";
import { pages } from "./pages";

for (const path of pages) {
  test(`${path} renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    for (const { title } of siteConfig.navLinks) {
      await expect(nav.getByRole("link", { name: title })).toBeVisible();
    }

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      path === "/" ? `${siteConfig.siteUrl}/` : `${siteConfig.siteUrl}${path}`,
    );

    // internal links use the canonical no-trailing-slash form (only "/" ends in a slash)
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
    expect(
      hrefs.filter(
        (href) => href !== "/" && href.split(/[?#]/)[0].endsWith("/"),
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const path of ["/blog/does-not-exist", "/nope"]) {
  test(`${path} returns 404`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}
