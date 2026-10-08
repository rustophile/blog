import { expect, test } from "@playwright/test";
import { pages } from "./pages";

// Full-page screenshots of every route in each theme at desktop and phone widths, so
// refactors that shouldn't change the look (like a CSS rewrite) can be checked pixel for pixel.
// Baselines are platform-specific and gitignored: regenerate them locally before a refactor with
//   pnpm test:e2e --project visual --update-snapshots

const themes = ["paper", "dark"];
const viewports = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

for (const theme of themes) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test.describe(`${theme} ${device}`, () => {
      test.use({ viewport });

      for (const path of pages) {
        test(path, async ({ page }) => {
          await page.addInitScript((theme) => {
            localStorage.setItem("rustophile_theme", theme);
          }, theme);
          await page.goto(path);
          await page.evaluate(() => document.fonts.ready);
          await expect(page).toHaveScreenshot(
            `${theme}-${device}${path === "/" ? "-home" : path.replaceAll("/", "-")}.png`,
            { fullPage: true, animations: "disabled" },
          );
        });
      }
    });
  }
}

// open menus, dialogs, and drawers, captured at the viewport rather than full page
const states: {
  name: string;
  path: string;
  open: (page: import("@playwright/test").Page) => Promise<void>;
}[] = [
  {
    name: "search",
    path: "/blog",
    open: async (page) => {
      const dialog = page.getByRole("dialog", { name: "Global Search" });
      await expect(async () => {
        await page.keyboard.press("ControlOrMeta+k");
        await expect(dialog).toBeVisible({ timeout: 500 });
      }).toPass();
      await dialog.getByRole("textbox").fill("rust");
      await expect(
        dialog.locator("a.search-result-item").first(),
      ).toBeVisible();
    },
  },
  {
    name: "theme-menu",
    path: "/",
    open: (page) => page.locator("#theme-toggle-btn").click(),
  },
  {
    name: "social-menu",
    path: "/",
    open: (page) => page.locator("#social-menu-btn").click(),
  },
  {
    name: "share-dialog",
    path: "/blog/hello-rustophile",
    open: async (page) => {
      await page.locator("#open-share-modal").click();
      await expect(page.locator("#share-modal-dialog")).toBeVisible();
    },
  },
  {
    name: "audio-drawer",
    path: "/blog/hello-rustophile",
    open: async (page) => {
      await page.locator("#audio-toggle-btn").click();
      await expect(page.locator("#audio-player-drawer")).toBeVisible();
    },
  },
];

for (const theme of themes) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test.describe(`${theme} ${device} states`, () => {
      test.use({ viewport });

      for (const state of states) {
        test(state.name, async ({ page }) => {
          await page.addInitScript((theme) => {
            localStorage.setItem("rustophile_theme", theme);
          }, theme);
          await page.goto(state.path);
          await page.evaluate(() => document.fonts.ready);
          await state.open(page);
          await expect(page).toHaveScreenshot(
            `${theme}-${device}-state-${state.name}.png`,
            { animations: "disabled" },
          );
        });
      }
    });
  }
}
