/**
 * Granular Feature Flags ("Complete by default, minimalist on demand")
 *
 * All flags default to `true` when omitted.
 * Minimalist or purist technical writers can set any flag to `false`
 * to completely eliminate markup, styles, and scripts during SSG build.
 */
export interface SiteFeatures {
  /** Full-text search modal + Ctrl/Cmd+K shortcuts + header triggers */
  search?: boolean;
  /** Sticky sidebar table of contents in blog posts */
  tableOfContents?: boolean;
  /** "X min read" badge in post headers */
  readingTime?: boolean;
  /** Accessible text-to-speech audio reader in blog posts and project details */
  audioPlayer?: boolean;
  /** Tag badges in post headers, article cards, and tag clouds */
  tags?: boolean;
  /** Notion-style share modal and trigger bar in blog posts */
  socialShare?: boolean;
  /** Theme picker: Warm Paper, std Dark, or follow the OS */
  themeSwitcher?: boolean;
  /** Floating smooth-scroll back-to-top button */
  backToTop?: boolean;
  /** Medium-style smooth image zoom modal on click */
  imageZoom?: boolean;
}

export interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  author: string;
  siteUrl: string;
  features?: SiteFeatures;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
  navLinks: {
    title: string;
    href: string;
  }[];
  /**
   * Giscus comments (GitHub Discussions). Post pages show them once repoId and categoryId are
   * set; get both from https://giscus.app after enabling Discussions and installing the app.
   */
  comments: {
    repo: `${string}/${string}`;
    repoId: string;
    category: string;
    categoryId: string;
  };
}

export const siteConfig: SiteConfig = {
  title: "Rustophile",
  tagline: "Learning Rust in public, one compiler error at a time.",
  description:
    "Notes, exercises, and mistakes from learning the Rust programming language.",
  author: "Rustophile",
  // production domain, used for canonical URLs, Open Graph, RSS, and the sitemap
  siteUrl: "https://rustophile.com",
  // Granular Feature Flags — "Complete by default, minimalist on demand"
  // Toggle any feature to false to completely omit markup & scripts in static build
  features: {
    search: true,
    tableOfContents: true,
    readingTime: true,
    audioPlayer: true,
    tags: true,
    socialShare: true,
    themeSwitcher: true,
    backToTop: true,
    imageZoom: true,
  },
  socialLinks: {
    github: "https://github.com/rustophile",
  },
  navLinks: [
    { title: "Home", href: "/" },
    { title: "Blog", href: "/blog" },
    { title: "Projects", href: "/projects" },
    { title: "Tags", href: "/tags" },
    { title: "About", href: "/about" },
  ],
  comments: {
    repo: "rustophile/blog",
    repoId: "R_kgDOVBdjuw",
    // an Announcements-type category, so only you and giscus can start discussions
    category: "Announcements",
    categoryId: "DIC_kwDOVBdju84DHXCP",
  },
};
