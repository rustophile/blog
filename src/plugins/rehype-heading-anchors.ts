import type { Root as HastRoot } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";

const LINKED = new Set(["h2", "h3", "h4"]);

// rustdoc's § links: each section heading gets an anchor to itself, shown on hover to the left
// of the heading. The § is drawn by CSS (a.doc-anchor::before), so the heading's text, which
// feeds the table of contents, search, and the audio player, stays unchanged. Runs after the
// heading ids exist. Clicking it (or Enter on it) jumps to the section, which highlights it.
export function rehypeHeadingAnchors() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node) => {
      if (!LINKED.has(node.tagName)) return;
      const id = node.properties.id;
      if (typeof id !== "string" || !id) return;
      node.children.unshift({
        type: "element",
        tagName: "a",
        properties: {
          className: ["doc-anchor"],
          href: `#${id}`,
          ariaLabel: `Link to section: ${toString(node).trim()}`,
        },
        children: [],
      });
    });
  };
}
