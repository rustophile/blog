import type { Element, ElementContent, Root as HastRoot } from "hast";
import { toString } from "hast-util-to-string";
import { visit, SKIP } from "unist-util-visit";

// rehype-typst emits each equation as an <svg class="typst-doc"> carrying two things meant
// for typst.ts's interactive viewer, both removed here:
// - a copy of the viewer stylesheet, including a global `svg { fill: none }` that would
//   blank out other icons on the page (the rules equations need live in global.css)
// - a text-selection layer of <foreignObject><h5:div class="tsel"> per glyph run, which
//   shows up as overlapping text without that stylesheet and gets heading ids from Astro
//   (it reads `h5:div` as an <h5>); its text becomes the equation's aria-label instead
// Display equations are wrapped in a .math-display div so wide ones can scroll
// horizontally instead of overflowing.
export function rehypeTypstCleanup(): (tree: HastRoot) => void {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "svg") return;
      const classes = node.properties?.className;
      if (!Array.isArray(classes) || !classes.includes("typst-doc")) return;

      const labels: string[] = [];
      const strip = (children: ElementContent[]): ElementContent[] =>
        children.flatMap((child): ElementContent[] => {
          if (child.type !== "element") return [child];
          if (child.tagName === "style") return [];
          if (child.tagName === "foreignObject") {
            labels.push(toString(child).trim());
            return [];
          }
          child.children = strip(child.children);
          return [child];
        });
      node.children = strip(node.children);
      node.properties.role = "img";
      node.properties.ariaLabel = labels.filter(Boolean).join(" ");

      const style = String(node.properties.style ?? "");
      if (!style.includes("display: block") || !parent || index === undefined)
        return SKIP;

      // display equations get `vertical-align: -NaNem` and centring from the plugin; the
      // wrapper handles layout instead
      delete node.properties.style;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["math-display"] },
        children: [node],
      };
      parent.children[index] = wrapper;
      return SKIP;
    });
  };
}
