import { expect, test } from "@playwright/test";

// frontmatter dates are midnight UTC; formatting them in the build machine's time zone
// showed the day before anywhere west of UTC
test("post dates show the day written in the frontmatter", async ({ page }) => {
  await page.goto("/blog/hello-rustophile");
  await expect(page.locator("article time").first()).toHaveText(
    "October 8, 2026",
  );

  await page.goto("/blog");
  await expect(page.getByText("Oct 8, 2026").first()).toBeVisible();
});
