# Rustophile

> Learning Rust in public, one compiler error at a time.

The home of Rustophile on the internet: notes, exercises, and small projects from learning the Rust programming language.

## What's inside

- [Astro](https://astro.build) for static pages and content collections
- The [Minrock](https://github.com/rnt-rez/minrock) theme by Renato Rezende, with search, a table of contents, text-to-speech, and share links

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

## License

[MIT](LICENSE)
