import { expect, type Locator, type Page } from "@playwright/test";

// The header menus are Svelte islands: a click before they hydrate does nothing, so retry
// until the button reports its menu open. The menu is found through the button's
// aria-controls, since a just-closed menu can still be leaving the page.
export async function openMenu(page: Page, button: Locator) {
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") {
      await button.click();
    }
    await expect(button).toHaveAttribute("aria-expanded", "true", {
      timeout: 500,
    });
  }).toPass();
  const id = await button.getAttribute("aria-controls");
  const menu = page.locator(`[id="${id}"]`);
  await expect(menu).toBeVisible();
  return menu;
}
