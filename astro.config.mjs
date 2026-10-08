import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { rehypeCallouts } from './src/plugins/rehype-callouts.mjs';
import { siteConfig } from './src/config/site.ts';

export default defineConfig({
  site: siteConfig.siteUrl,
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  markdown: {
    processor: satteri({
      hastPlugins: [rehypeCallouts()],
    }),
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true
    }
  }
});
