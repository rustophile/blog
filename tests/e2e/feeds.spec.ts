import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/config/site";

test("RSS feed lists published posts", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  expect(xml).toContain(`<title>${siteConfig.title}</title>`);
  expect(xml).toContain("<title>Hello, Rustophile</title>");
});

test("pages link to the RSS feed", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator('link[rel="alternate"][type="application/rss+xml"]'),
  ).toHaveAttribute("href", new URL("/rss.xml", siteConfig.siteUrl).href);
});

test("sitemap index and robots.txt are served", async ({ request }) => {
  expect((await request.get("/sitemap-index.xml")).ok()).toBe(true);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(
    `Sitemap: ${new URL("/sitemap-index.xml", siteConfig.siteUrl).href}`,
  );
});
