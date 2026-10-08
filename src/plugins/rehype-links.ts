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
