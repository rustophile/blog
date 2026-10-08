import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeExpressiveCode, {
  ExpressiveCodeTheme,
} from "rehype-expressive-code";
import rustdocDark from "./src/styles/rustdoc-dark.json" with { type: "json" };
import { rehypeCallouts } from "./src/plugins/rehype-callouts.ts";
import { remarkCodeGroups, rehypeCodeTabs } from "./src/plugins/code-tabs.ts";
import remarkMath from "remark-math";
import rehypeTypst from "@myriaddreamin/rehype-typst";
import rehypeSlug from "rehype-slug";
import { rehypeHeadingAnchors } from "./src/plugins/rehype-heading-anchors.ts";
import { rehypeLinks } from "./src/plugins/rehype-links.ts";
import { rehypeTypstCleanup } from "./src/plugins/rehype-typst-cleanup.ts";
import { remarkQuoteAttribution } from "./src/plugins/remark-quote-attribution.ts";
import { siteConfig } from "./src/config/site.ts";

/** @type {import("rehype-expressive-code").RehypeExpressiveCodeOptions} */
const expressiveCode = {
  // rustdoc's dark-theme highlighting (src/styles/rustdoc-dark.json), in both site themes
  themes: [new ExpressiveCodeTheme(rustdocDark)],
  useDarkModeMediaQuery: false,
  defaultProps: {
    wrap: true,
  },
  styleOverrides: {
    borderRadius: "8px",
    borderWidth: "1px",
    borderColor: "var(--border)",
    codeBackground: "var(--code-bg)",
    codeForeground: "var(--code-text)",
    codeFontFamily: "var(--font-mono)",
    uiFontFamily: "var(--font-sans)",
    codeFontSize: "0.9rem",
    codeLineHeight: "1.6",
    codePaddingBlock: "1.25rem",
    codePaddingInline: "1.25rem",
    textMarkers: {
      markBackground: "color-mix(in oklab, #d2991d 16%, transparent)",
      markBorderColor: "#d2991d",
    },
    frames: {
      frameBoxShadowCssValue: "none",
      editorActiveTabIndicatorTopColor: "var(--link-bright)",
      editorActiveTabBackground: "var(--code-bg)",
      editorTabBarBackground: "#232323",
      terminalTitlebarBackground: "#232323",
      editorBackground: "var(--code-bg)",
      terminalBackground: "var(--code-bg)",
    },
  },
};

export default defineConfig({
  site: siteConfig.siteUrl,
  // URLs never end in a slash (/blog, not /blog/): the dev server enforces it, canonical URLs
  // and the sitemap follow it, and Cloudflare redirects /blog/ to /blog (html_handling in
  // wrangler.jsonc)
  trailingSlash: "never",
  integrations: [svelte(), sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    // Expressive Code highlights code blocks, so Astro's own Shiki pass is off
    syntaxHighlight: false,
    processor: unified({
      // remarkQuoteAttribution skips [!TYPE] blockquotes, which rehypeCallouts turns into asides
      remarkPlugins: [remarkMath, remarkQuoteAttribution, remarkCodeGroups],
      rehypePlugins: [
        rehypeSlug,
        rehypeHeadingAnchors,
        rehypeCallouts,
        rehypeLinks,
        // $…$ and $$…$$ (remarkMath) compiled from Typst to SVG at build time
        rehypeTypst,
        rehypeTypstCleanup,
        [rehypeExpressiveCode, expressiveCode],
        rehypeCodeTabs,
      ],
    }),
  },
  // rustdoc's typefaces, self-hosted at build time
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Fira Sans",
      cssVariable: "--font-fira-sans",
      weights: [400, 500, 600, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Source Serif 4",
      cssVariable: "--font-source-serif",
      weights: [400, 600, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Source Code Pro",
      cssVariable: "--font-source-code-pro",
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    // dev only: pre-bundle shadcn-svelte's dependencies at startup instead of discovering
    // them page by page, which stops and reloads the first page that needs each one (as in the
    // Solobroneur blog). Add a Lucide icon here when a component starts importing a new one.
    // (Don't also pre-bundle bits-ui for SSR: on this project that made every page in
    // `astro dev` fail with "unable to find a component instance".)
    optimizeDeps: {
      include: [
        "bits-ui",
        "cn",
        "tailwind-variants",
        ...[
          "at-sign",
          "check",
          "chevron-down",
          "file-text",
          "globe",
          "link",
          "mail",
          "monitor",
          "moon",
          "package",
          "search",
          "share",
          "sun",
          "tag",
          "user",
          "x",
        ].map((icon) => `@lucide/svelte/icons/${icon}`),
      ],
    },
  },
});
