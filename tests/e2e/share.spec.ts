import { expect, test } from "@playwright/test";

test("the share dialog offers the post's link and closes with Escape", async ({
  page,
}) => {
  await page.goto("/blog/hello-rustophile");
  const share = page.getByRole("button", { name: "Share article" });
  const dialog = page.getByRole("dialog", { name: "Share article" });

  // opened from the keyboard, so focus has somewhere to return to (WebKit doesn't focus
  // buttons on click); a Svelte island, so retry until it has hydrated and opens
  await expect(async () => {
    await share.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass();

  const link = dialog.getByRole("textbox", { name: "Link to this post" });
  await expect(link).toBeFocused();
  await expect(link).toHaveValue(/\/blog\/hello-rustophile\/?$/);
  await expect(
    dialog.getByRole("link", { name: "Share on X" }),
  ).toHaveAttribute(
    "href",
    /url=https%3A%2F%2Frustophile\.com%2Fblog%2Fhello-rustophile/,
  );

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(share).toBeFocused();
});
