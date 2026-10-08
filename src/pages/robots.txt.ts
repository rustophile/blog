import type { APIRoute } from "astro";

// robots.txt, pointing crawlers at the sitemap on whatever site URL the build uses
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
