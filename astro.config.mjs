import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeExpressiveCode from "rehype-expressive-code";
import { rehypeCallouts } from "./src/plugins/rehype-callouts.ts";
import { remarkCodeGroups, rehypeCodeTabs } from "./src/plugins/code-tabs.ts";
import { rehypeLinks } from "./src/plugins/rehype-links.ts";
import { remarkQuoteAttribution } from "./src/plugins/remark-quote-attribution.ts";
import { siteConfig } from "./src/config/site.ts";

/** @type {import("rehype-expressive-code").RehypeExpressiveCodeOptions} */
const expressiveCode = {
  themes: ["github-dark-dimmed"],
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
    frames: {
      frameBoxShadowCssValue: "none",
      editorBackground: "var(--code-bg)",
      terminalBackground: "var(--code-bg)",
    },
  },
};

export default defineConfig({
  site: siteConfig.siteUrl,
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    // Expressive Code highlights code blocks, so Astro's own Shiki pass is off
    syntaxHighlight: false,
    processor: unified({
      // remarkQuoteAttribution skips [!TYPE] blockquotes, which rehypeCallouts turns into asides
      remarkPlugins: [remarkQuoteAttribution, remarkCodeGroups],
      rehypePlugins: [
        rehypeCallouts,
        rehypeLinks,
        [rehypeExpressiveCode, expressiveCode],
        rehypeCodeTabs,
      ],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
