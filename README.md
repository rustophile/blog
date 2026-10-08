# Rustophile

> Learning Rust in public, one compiler error at a time.

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
