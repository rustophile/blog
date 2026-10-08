import { expect, test, type Page } from "@playwright/test";

// the shortcut listener attaches once the module script runs, so retry until the dialog opens
async function openSearch(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Global Search" });
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/blog");
});

test("shortcut opens search with the input focused; Escape closes it", async ({
  page,
}) => {
  const dialog = await openSearch(page);
  await expect(dialog.getByRole("textbox")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("typing filters results and Enter opens the top match", async ({
  page,
}) => {
  const dialog = await openSearch(page);
  const input = dialog.getByRole("textbox");

  await input.fill("rustophile");
  const result = dialog.locator("a.search-result-item");
  await expect(result.first()).toHaveAttribute(
    "href",
    /\/blog\/hello-rustophile$/,
  );
  await expect(result.first()).toHaveClass(/\bselected\b/);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/blog\/hello-rustophile$/);
});

test("a query with no matches says so", async ({ page }) => {
  const dialog = await openSearch(page);
  await dialog.getByRole("textbox").fill("zzzz-no-match");
  await expect(
    dialog.getByText('No results found for "zzzz-no-match"'),
  ).toBeVisible();
});
