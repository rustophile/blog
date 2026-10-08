import type { Blockquote, Paragraph, Root as MdastRoot } from "mdast";
import { visit } from "unist-util-visit";

// an attribution line starts with a dash: "— Name", or "--" before smartypants turns it
// into one; the name may be a link, so nothing is required after the dash in this text
const ATTRIBUTION = /^\s*(?:—|–|--)/;

function isAttribution(node: Blockquote["children"][number] | undefined) {
  if (node?.type !== "paragraph") return false;
  const first = node.children[0];
  return first?.type === "text" && ATTRIBUTION.test(first.value);
}

const CALLOUT_MARKER = /^\s*\[![a-zA-Z]+\]/;

function isCallout(node: Blockquote) {
  const first = node.children[0];
  if (first?.type !== "paragraph") return false;
  const text = first.children[0];
  return text?.type === "text" && CALLOUT_MARKER.test(text.value);
}

function firstLinkUrl(paragraph: Paragraph): string | undefined {
  let url: string | undefined;
  visit(paragraph, "link", (link) => {
    url ??= link.url;
  });
  return url;
}

// A blockquote whose last paragraph is an attribution becomes
//   <figure class="quote"><blockquote cite="…">…</blockquote><figcaption>— …</figcaption></figure>
// so the source is marked up as one, and a link in the attribution becomes the
// quote's cite URL. Callouts ([!TYPE] blockquotes) are left for rehypeCallouts
export function remarkQuoteAttribution(): (tree: MdastRoot) => void {
  return (tree) => {
    const quotes: Blockquote[] = [];
    visit(tree, "blockquote", (node) => {
      if (isCallout(node)) return;
      if (node.children.length < 2 || !isAttribution(node.children.at(-1))) {
        return;
      }
      quotes.push(node);
    });

    for (const node of quotes) {
      const attribution = node.children.pop() as Paragraph;
      const cite = firstLinkUrl(attribution);

      // the outer node becomes the figure; its content moves into a new blockquote
      node.data = {
        ...node.data,
        hName: "figure",
        hProperties: { className: ["quote"] },
      };
      node.children = [
        {
          type: "blockquote",
          data: cite ? { hProperties: { cite } } : undefined,
          children: node.children,
        },
        {
          ...attribution,
          data: { ...attribution.data, hName: "figcaption" },
        },
      ];
    }
  };
}
