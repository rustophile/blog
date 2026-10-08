// Renders public/og-image.png, the 1200×630 preview shown when a page is shared on social
// sites: the wordmark (with the Rust logo's R) and tagline on std Dark, in the site's fonts.
// Rerun after changing the title or tagline:  pnpm og-image
import { chromium } from "@playwright/test";
import { siteConfig } from "../src/config/site.ts";

// the R from the Rust logo, as in src/components/RustR.astro
const R =
  "M -9,-15 H 4 C 12,-15 12,-7 4,-7 H -9 Z M -40,22 H 0 V 11 H -9 V 3 H 1 C 12,3 6,22 15,22 H 40 V 3 H 34 V 5 C 34,13 25,12 24,7 C 23,2 19,-2 18,-2 C 33,-10 24,-26 12,-26 H -35 V -15 H -25 V 11 H -40 Z";

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<!doctype html>
<html>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@500;700&family=Source+Code+Pro:wght@500&display=block" rel="stylesheet" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 88px 96px;
    display: flex; flex-direction: column; justify-content: space-between;
    background: #353535; color: #dddddd; font-family: "Fira Sans", sans-serif;
    border-bottom: 12px solid #d2991d;
  }
  .wordmark { display: flex; align-items: baseline; font-size: 132px; font-weight: 700; letter-spacing: -0.02em; }
  .wordmark svg { height: 0.689em; width: auto; margin-right: 0.04em; overflow: visible; }
  .tagline { margin-top: 36px; max-width: 900px; font-size: 46px; font-weight: 500; line-height: 1.3; color: #aaaaaa; }
  .url { font-family: "Source Code Pro", monospace; font-size: 30px; color: #d2991d; }
</style>
</head>
<body>
  <div>
    <div class="wordmark">
      <svg viewBox="-40 -26 81 49" aria-hidden="true"><path transform="translate(0.5 0.5)" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" d="${R}"/></svg>${escape(siteConfig.title.slice(1))}
    </div>
    <p class="tagline">${escape(siteConfig.tagline)}</p>
  </div>
  <div class="url">${escape(new URL(siteConfig.siteUrl).host)}</div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("wrote public/og-image.png");
