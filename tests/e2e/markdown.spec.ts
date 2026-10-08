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

test("links to std items are tagged with rustdoc's item kind", async ({
  page,
}) => {
  const kinds = await page
    .locator("article a.rust-item")
    .evaluateAll((links) =>
      links.map((a) => [
        a.textContent?.split(" (")[0],
        a.getAttribute("data-rust-item"),
      ]),
    );
  expect(kinds).toEqual([
    ["String", "type"],
    ["Copy", "trait"],
    ["println!", "macro"],
    ["clone", "method"],
    ["std::rc", "mod"],
  ]);

  // and colored by kind: a trait link differs from a type link
  const color = (name: string) =>
    page
      .locator("article a.rust-item", { hasText: name })
      .evaluate((a) => getComputedStyle(a).color);
  expect(await color("Copy")).not.toBe(await color("String"));
});

test("posts load giscus comments for this page", async ({ page }) => {
  const comments = page.getByRole("region", { name: "Comments" });
  await comments.scrollIntoViewIfNeeded();
  const frame = comments.locator("iframe.giscus-frame");
  await expect(frame).toBeAttached({ timeout: 15_000 });
  const src = new URL((await frame.getAttribute("src"))!);
  expect(src.origin).toBe("https://giscus.app");
  expect(src.searchParams.get("repo")).toBe("rustophile/blog");
  expect(src.searchParams.get("term")).toBe("blog/hello-rustophile");
});
