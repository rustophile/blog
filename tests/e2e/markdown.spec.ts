import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/blog/hello-rustophile");
});

test("callouts render as labelled notes", async ({ page }) => {
  const note = page.getByRole("note", { name: "Note" });
  await expect(note).toContainText("Posts are written while learning");
});

test("grouped code blocks become tabs", async ({ page }) => {
  const tabs = page.locator(".ec-tabs");
  await expect(tabs).toHaveCount(1);
  await expect(tabs.locator(".ec-tabs__tab")).toHaveText([
    "src/main.rs",
    "Cargo.toml",
  ]);
  await expect(tabs.getByText('println!("Hello, world!");')).toBeVisible();

  await tabs.getByText("Cargo.toml").click();
  await expect(tabs.getByText('edition = "2024"')).toBeVisible();
  await expect(tabs.getByText('println!("Hello, world!");')).toBeHidden();

  // the terminal block after the group stays its own frame
  await expect(
    page.locator(".expressive-code").filter({ hasText: "cargo run" }),
  ).not.toHaveAttribute("class", /ec-tabs/);
});

test("off-site links open in a new tab and say so", async ({ page }) => {
  const link = page
    .locator("article")
    .getByRole("link", { name: /The Rust Programming Language/ })
    .first();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toContainText("(opens in a new tab)");
});

test("a quote ending in an attribution becomes a captioned figure", async ({
  page,
}) => {
  const figure = page.locator("figure.quote");
  await expect(figure.locator("blockquote")).toHaveAttribute(
    "cite",
    "https://doc.rust-lang.org/book/ch00-00-introduction.html",
  );
  await expect(figure.locator("figcaption")).toContainText(
    "The Rust Programming Language",
  );
});
