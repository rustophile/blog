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
    ["Vec", "type"],
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

test("jumping to a section highlights its heading like rustdoc's :target", async ({
  page,
}) => {
  const heading = page.locator("article h2#the-first-program");
  const anchor = heading.locator("a.doc-anchor");
  await expect(anchor).toHaveAttribute("href", "#the-first-program");
  await expect(anchor).toHaveAccessibleName(
    "Link to section: The first program",
  );
  await expect(anchor).toHaveCSS("opacity", "0");

  await page
    .getByRole("complementary")
    .getByRole("link", { name: "The first program" })
    .click();
  await expect(page).toHaveURL(/#the-first-program$/);
  await expect(heading).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(heading).toHaveCSS("border-right-width", "3px");
  await expect(anchor).toHaveCSS("opacity", "1");

  // the heading lands below the sticky header rather than under it
  const header = await page.locator("header").first().boundingBox();
  const box = await heading.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
});

test("clicking a heading's § jumps to and highlights that section", async ({
  page,
}) => {
  const heading = page.locator("article h2#what-to-expect");
  await heading.hover();
  const anchor = heading.locator("a.doc-anchor");
  await expect(anchor).toHaveCSS("opacity", "1");
  await anchor.click();
  await expect(page).toHaveURL(/#what-to-expect$/);
  await expect(heading).toHaveCSS("border-right-width", "3px");

  // and from the keyboard
  await anchor.blur();
  await page.locator("article h2#the-first-program a.doc-anchor").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#the-first-program$/);
});

test("Typst math renders as labelled SVG in the text color", async ({
  page,
}) => {
  const equations = page.locator("article svg.typst-doc");
  await expect(equations).toHaveCount(3); // $2n$, $n$, and the display sum
  await expect(equations.first()).toHaveAttribute("role", "img");
  await expect(equations.first()).toHaveAttribute("aria-label", "2 𝑛");

  // typst.ts's viewer leftovers are stripped
  await expect(page.locator("article svg.typst-doc foreignObject")).toHaveCount(
    0,
  );
  await expect(page.locator("article svg.typst-doc style")).toHaveCount(0);

  const display = page.locator("article .math-display svg.typst-doc");
  await expect(display).toHaveCount(1);
  const glyph = display.locator('[fill="#000"]').first();
  const [glyphColor, textColor] = await Promise.all([
    glyph.evaluate((el) => getComputedStyle(el).fill),
    page
      .locator("article .post-content p")
      .first()
      .evaluate((el) => getComputedStyle(el).color),
  ]);
  expect(glyphColor).toBe(textColor);
});

test("the image viewer loads PhotoSwipe only when an image is clicked", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (req) => requested.push(req.url()));
  await page.reload();
  expect(requested.some((url) => /photoswipe\.esm/.test(url))).toBe(false);

  await page.locator("article img[src*='string-move']").click();
  await expect(page.locator(".pswp")).toBeVisible();
  expect(requested.some((url) => /photoswipe\.esm/.test(url))).toBe(true);
});

test("```rustc blocks color compiler output as rustc does", async ({
  page,
}) => {
  const block = page.locator(".expressive-code", { hasText: "error[E0382]" });
  const color = (text: string) =>
    block
      .locator("span", { hasText: new RegExp(`^${text}$`) })
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { color: s.color, bold: Number(s.fontWeight) >= 700 };
      });
  expect(await color("error")).toEqual({
    color: "rgb(238, 104, 104)",
    bold: true,
  });
  expect(await color("help")).toEqual({
    color: "rgb(62, 153, 159)",
    bold: true,
  });
  expect(await color("-->")).toEqual({
    color: "rgb(118, 154, 203)",
    bold: true,
  });
});
