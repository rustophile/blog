import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Element, Root as HastRoot } from "hast";
import { visit } from "unist-util-visit";

// the slice of a vfile this plugin uses
interface MarkdownFile {
  path?: string;
}

const EXTERNAL_HREF = /^(?:https?:)?\/\//i;
// collections whose entries are pages, by URL segment: /blog/<slug> → src/content/blog
const LINKED_COLLECTIONS = new Set(["blog", "projects"]);
const CONTENT_DIR = join(process.cwd(), "src", "content");

// rustdoc pages are named <kind>.<Name>.html (struct.String.html, trait.Iterator.html,
// macro.println.html) and modules are <path>/index.html; methods are #method.<name> anchors
const RUSTDOC_HOSTS = new Set(["doc.rust-lang.org", "docs.rs"]);
const ITEM_KINDS: Record<string, string> = {
  struct: "type",
  enum: "type",
  union: "type",
  type: "type",
  primitive: "type",
  trait: "trait",
  traitalias: "trait",
  fn: "fn",
  macro: "macro",
  derive: "macro",
  attr: "macro",
  keyword: "keyword",
  constant: "constant",
  static: "constant",
};

// the rustdoc item kind a link points at, which sets its color like rustdoc's own links
export function rustdocKind(href: string): string | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (!RUSTDOC_HOSTS.has(url.hostname)) return undefined;
  if (/^#(?:ty)?method\./.test(url.hash)) return "method";
  const page = url.pathname.split("/").pop() ?? "";
  if (page === "index.html" || page === "") {
    // /std/, /std/collections/index.html, /clap/latest/clap/ are modules or crates;
    // the book and other guides on doc.rust-lang.org are plain links
    return /^\/(?:std|core|alloc|proc_macro|test)\//.test(url.pathname) ||
      url.hostname === "docs.rs"
      ? "mod"
      : undefined;
  }
  return ITEM_KINDS[/^([a-z]+)\.[^.]+\.html$/.exec(page)?.[1] ?? ""];
}

function addClass(node: Element, className: string) {
  const current = node.properties.className;
  const list = Array.isArray(current) ? current : current ? [current] : [];
  node.properties.className = [...list, className];
}

// entries are either <slug>.md or <slug>/index.md (a page bundle with its images)
function entryExists(collection: string, slug: string) {
  const base = join(CONTENT_DIR, collection, slug);
  return [".md", ".mdx", "/index.md", "/index.mdx"].some((ext) =>
    existsSync(base + ext),
  );
}

// Off-site links open in a new tab and say so (the ↗ is CSS; a visually hidden note tells
// screen readers). Links to a post or project that doesn't exist fail the build, so a
// renamed slug can't leave a dead link behind.
export function rehypeLinks() {
  return (tree: HastRoot, file: MarkdownFile) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      const href = node.properties.href;
      if (typeof href !== "string") return;

      if (EXTERNAL_HREF.test(href.trim())) {
        const rel = new Set(
          String(node.properties.rel ?? "")
            .split(/[\s,]+/)
            .filter(Boolean),
        );
        rel.add("noopener");
        rel.add("noreferrer");
        node.properties.target = "_blank";
        node.properties.rel = [...rel];
        addClass(node, "external-link");
        const kind = rustdocKind(href.trim());
        if (kind) {
          addClass(node, "rust-item");
          node.properties.dataRustItem = kind;
        }
        node.children.push({
          type: "element",
          tagName: "span",
          properties: { className: ["sr-only"] },
          children: [{ type: "text", value: " (opens in a new tab)" }],
        });
        return;
      }

      const path = /^\/([^?#]*)/.exec(href)?.[1];
      if (path === undefined) return;
      const [collection, ...rest] = path.replace(/\/$/, "").split("/");
      const slug = rest.join("/");
      if (!LINKED_COLLECTIONS.has(collection) || !slug) return;
      if (!entryExists(collection, slug)) {
        throw new Error(
          `${file.path ?? "markdown"}: link to ${href}, but there is no ${collection} entry "${slug}"`,
        );
      }
    });
  };
}
