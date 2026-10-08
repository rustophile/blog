# Rustophile

> Learn Rust, one borrow at a time.  
> A journey through compiler errors toward a language you’ll love.

The home of Rustophile on the internet: notes, exercises, and small projects from learning the Rust programming language.

## What's inside

- [Astro](https://astro.build) for static pages and content collections
- The [Minrock](https://github.com/rnt-rez/minrock) theme by Renato Rezende, with search, a table of contents, text-to-speech, and share links
- [Tailwind CSS v4](https://tailwindcss.com) for styling, and [shadcn-svelte](https://shadcn-svelte.com) components (in `src/lib/components/ui`, added with `pnpm exec shadcn-svelte add <name>`) on the site's own theme tokens
- Two themes in the Rust standard library docs' colors: **Light** (Minrock's cream reading palette with rustdoc's dark-theme accents) and **std Dark** (rustdoc's dark theme), plus a System option that follows the OS. Palette tokens live in `src/styles/global.css`
- rustdoc's typefaces: Fira Sans, Source Serif 4, and Source Code Pro, self-hosted at build time
- Code highlighted with rustdoc's dark-theme colors (`src/styles/rustdoc-dark.json`)

## Getting started

You'll need Node.js 24 or newer (pinned in `.node-version`, so fnm or nvm can switch to it automatically) and `pnpm`.

```bash
pnpm install
pnpm dev
```

Open http://localhost:4321.

## Site content

### Site settings live in `src/config/site.ts`

Title, tagline, description, site URL, social links, navigation, and feature flags.

### Blog posts live in `src/content/blog/<slug>/index.md`

Posts are served at `/blog/<slug>`, and images can sit next to `index.md` in the same folder. Frontmatter:

```yaml
---
title: "Post title"
description: "Short summary shown in listings and search."
pubDate: 2026-10-08
tags: ["ownership", "traits"]
draft: false
---
```

### Markdown features

Code blocks are rendered by [Expressive Code](https://expressive-code.com):

- `title="src/main.rs"` gives a block a file tab; `frame="terminal"` draws a terminal window.
- `{3-4}` highlights lines; `ins={2}` and `del={3}` mark added and removed lines.
- ` ```rustc ` colors pasted compiler output (`error[E…]`, `warning`, the `-->` and `|` gutter, `^^^` and `---` labels, `help:`, `+++` suggestions) as rustc does in a terminal; add `frame="terminal"` for a terminal window. The grammar is `src/styles/rustc-diagnostics.tmLanguage.json`.
- Consecutive blocks with the same `group="name"` become one block with a tab per block, labelled by `tab="label"`:

  ````md
  ```rust group="hello" tab="src/main.rs"
  fn main() {}
  ```

  ```toml group="hello" tab="Cargo.toml"
  [package]
  ```
  ````

Also:

- `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]` blockquotes become callouts; text after the marker replaces the title.
- A blockquote whose last line starts with `— Name` becomes a quote with a caption; a link in that line becomes the quote's `cite`.
- Off-site links open in a new tab, marked with ↗.
- Links to `/blog/<slug>` or `/projects/<slug>` fail the build if that entry doesn't exist.
- Math is written in [Typst](https://typst.app/docs/reference/math/) syntax and compiled to SVG at build time: `$2n$` inline, and `$$` on their own lines for a display equation. A lone `$` starts a math span, so write currency as `\$5` or in backticks.

### Projects live in `src/content/projects/<slug>/index.md`

The projects page shows "Nothing built yet." until the first one is added.

## Scripts

| Command        | What it does                        |
| -------------- | ----------------------------------- |
| `pnpm dev`     | Start the dev server                |
| `pnpm build`   | Build the static site into `./dist` |
| `pnpm preview` | Serve the production build locally  |
| `pnpm check`   | Type-check with `astro check`       |
| `pnpm qa`      | Type-check, then build              |

## Deploying

The site is fully static and deploys to [Cloudflare Workers](https://docs.astro.build/en/guides/deploy/cloudflare/) as static assets; no adapter is needed. `wrangler.jsonc` serves `dist/`, uses the site's 404 page, and redirects `/blog/` to `/blog` so URLs match the canonical no-trailing-slash form (`trailingSlash: "never"` in `astro.config.mjs`). `public/_headers` caches Astro's hashed assets for a year.

```bash
pnpm preview:cf   # build and serve through Cloudflare's runtime locally
pnpm run deploy   # build and deploy from your machine (after `pnpm exec wrangler login`)
```

Use `pnpm run deploy`, not `pnpm deploy`: the latter is a built-in pnpm command and won't run the script.

The site URL comes from `siteUrl` in `src/config/site.ts`; change it there if the domain ever changes, and rerun `pnpm og-image`.

### CI/CD

`.github/workflows/ci.yml` runs on every push to `master` and every pull request:

| Job                      | Runs on          | What it does                                                                                                           |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Format, lint, types**  | push and PR      | `pnpm format:check`, `pnpm lint`, `pnpm check:astro`, `pnpm check:svelte`                                              |
| **Build and e2e**        | push and PR      | `pnpm build`, then the Playwright tests in Chromium against that build plus the dev-server smoke test; uploads `dist/` |
| **Deploy to Cloudflare** | push to `master` | `wrangler deploy` with the tested `dist/`, only if both jobs above passed                                              |
| **Preview deploy**       | PR (not forks)   | `wrangler versions upload` with the tested `dist/`, then comments the preview URLs on the PR. Production is untouched  |

A failing check stops the deploy, but the commit still lands on `master`, so fix forward. Firefox, WebKit and the screenshot tests only run locally.

### One-time setup

Steps 1 to 3 get CI deploying; step 4 puts the site on rustophile.com.

#### 1. Create a Cloudflare API token

1. **My Profile → API Tokens → Create Token**, and pick the **Edit Cloudflare Workers** template.
2. Under **Account Resources**, choose your account. Under **Zone Resources**, choose **All zones** (or just `rustophile.com` once it's on Cloudflare).
3. Create it and copy the token. Cloudflare shows it only once.

#### 2. Find your Cloudflare account ID

It's on **Workers & Pages → Overview** in the right-hand sidebar, and in the dashboard URL: `dash.cloudflare.com/<account-id>/...`.

#### 3. Add the GitHub repository secrets

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret                  | Value                 |
| ----------------------- | --------------------- |
| `CLOUDFLARE_API_TOKEN`  | the token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | the ID from step 2    |

Then push to `master`. The deploy job creates the Worker on its first run and serves it at `https://rustophile.<your-subdomain>.workers.dev`. PR previews only work after this first deploy, because they upload versions of an existing Worker.

#### 4. Put rustophile.com on the Worker

A Worker can only serve a custom domain whose DNS is on Cloudflare, so the domain stays with its registrar but Cloudflare takes over its DNS.

1. **Add the domain to Cloudflare:** **Add a domain**, enter `rustophile.com`, and pick the Free plan. Delete any imported records that point at the registrar's parking page, since they'd conflict with the Worker.
2. **Switch nameservers** at your registrar to the two Cloudflare assigns (turn off DNSSEC there first, if it's on).
3. **Wait for Cloudflare to show the domain as Active**, usually under an hour.
4. **Deploy again** (or rerun the deploy job): `wrangler.jsonc` routes `rustophile.com` to the Worker, and Cloudflare creates the DNS record and certificate.
5. **Redirect `www` to the bare domain:** in the zone, add an `AAAA` record named `www` with address `100::`, proxied, then **Rules → Redirect Rules → Create rule** from the **Redirect from WWW to root** template.

## Testing

End-to-end tests use [Playwright](https://playwright.dev) and run against the production build in Chromium, Firefox, and WebKit.

```bash
pnpm exec playwright install   # first time only
pnpm test:e2e
```

The `visual` project takes full-page screenshots of every page in each theme at desktop and phone widths. Baselines are platform-specific, so they're gitignored: generate them before a refactor that shouldn't change the look, then compare after.

```bash
pnpm test:e2e --project visual --update-snapshots   # before
pnpm test:e2e --project visual                      # after
```

## License

The R in the site's name is the R from the [Rust logo](https://github.com/rust-lang/rust-artwork) by the Rust Project, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and shown without its gear (`src/components/RustR.astro`). Rust and the Rust logo are trademarks of the Rust Foundation; this site is not affiliated with or endorsed by the Rust Project or the Rust Foundation.

The rest of this repository:

[MIT](LICENSE)
