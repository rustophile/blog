import type { Element, ElementContent, Root as HastRoot } from "hast";
import { visit } from "unist-util-visit";

// GitHub/Obsidian-style callouts: a blockquote starting with `[!TYPE] Optional title` becomes
// <aside class="callout callout-TYPE" role="note"> with an icon and a title row

const DEFAULT_TITLES: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
  info: "Info",
};

const TYPE_ALIASES: Record<string, string> = {
  hint: "tip",
  attention: "warning",
  alert: "warning",
  bug: "danger",
  error: "danger",
  todo: "note",
  seealso: "note",
  abstract: "info",
  summary: "info",
  tldr: "info",
};

const MARKER = /^\s*\[!([a-zA-Z]+)\][+-]?(?:[ \t]+([^\r\n]*))?(?:\r?\n|$)/;

// Lucide-style 24×24 stroke icons, as [tagName, attributes] pairs
type Shape = [string, Record<string, string | number>];
const INFO: Shape[] = [
  ["circle", { cx: 12, cy: 12, r: 10 }],
  ["line", { x1: 12, y1: 16, x2: 12, y2: 12 }],
  ["line", { x1: 12, y1: 8, x2: 12.01, y2: 8 }],
];
const ICONS: Record<string, Shape[]> = {
  tip: [
    [
      "path",
      {
        d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      },
    ],
    ["path", { d: "M9 18h6" }],
    ["path", { d: "M10 22h4" }],
  ],
  important: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["line", { x1: 12, y1: 8, x2: 12, y2: 12 }],
    ["line", { x1: 12, y1: 16, x2: 12.01, y2: 16 }],
  ],
  warning: [
    [
      "path",
      {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
      },
    ],
    ["line", { x1: 12, y1: 9, x2: 12, y2: 13 }],
    ["line", { x1: 12, y1: 17, x2: 12.01, y2: 17 }],
  ],
  danger: [
    [
      "polygon",
      {
        points:
          "7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2",
      },
    ],
    ["line", { x1: 12, y1: 8, x2: 12, y2: 12 }],
    ["line", { x1: 12, y1: 16, x2: 12.01, y2: 16 }],
  ],
};
ICONS.caution = ICONS.danger;

function icon(type: string): Element {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    children: (ICONS[type] ?? INFO).map(([tagName, properties]) => ({
      type: "element",
      tagName,
      properties,
      children: [],
    })),
  };
}

export function rehypeCallouts() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "blockquote") return;

      const paragraph = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "p",
      );
      const text = paragraph?.children[0];
      if (!paragraph || text?.type !== "text") return;

      const match = MARKER.exec(text.value);
      if (!match) return;

      const rawType = match[1].toLowerCase();
      const type = TYPE_ALIASES[rawType] ?? rawType;
      const title =
        match[2]?.trim() ||
        DEFAULT_TITLES[type] ||
        rawType.charAt(0).toUpperCase() + rawType.slice(1);

      const rest = text.value.slice(match[0].length);
      if (rest.trim()) {
        text.value = rest;
      } else {
        paragraph.children.shift();
        // a marker-only first paragraph leaves nothing behind
        if (
          paragraph.children.every((c) => c.type === "text" && !c.value.trim())
        ) {
          node.children = node.children.filter((c) => c !== paragraph);
        }
      }

      const titleRow: ElementContent = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-title"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["callout-icon"], ariaHidden: "true" },
            children: [icon(type)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["callout-title-text"] },
            children: [{ type: "text", value: title }],
          },
        ],
      };

      node.tagName = "aside";
      node.properties = {
        className: ["callout", `callout-${type}`],
        dataCallout: type,
        role: "note",
        ariaLabel: title,
      };
      node.children = [titleRow, ...node.children];
    });
  };
}
