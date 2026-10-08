import type { Data, Parent as MdastParent, Root as MdastRoot } from "mdast";
import type {
  Element,
  ElementContent,
  Properties,
  Root as HastRoot,
} from "hast";
import type {} from "mdast-util-to-hast";
import { visit } from "unist-util-visit";

// placeholder node marking where a run of grouped code blocks starts; rehypeCodeTabs replaces it
interface EcTabsMarker extends MdastParent {
  type: "ecTabsMarker";
  data: Data;
}

declare module "mdast" {
  interface RootContentMap {
    ecTabsMarker: EcTabsMarker;
  }
}

const META_DIRECTIVE = /(?:^|\s)(group|tab)\s*=\s*["']([^"']+)["']/g;

type CodeMeta = Record<string, string>;

function codeMeta(meta: unknown): CodeMeta {
  const out: CodeMeta = {};
  if (typeof meta === "string") {
    for (const match of String(meta).matchAll(META_DIRECTIVE)) {
      out[match[1]] = match[2];
    }
  }
  return out;
}

function classes(properties: Properties | undefined): string[] {
  const cls = properties?.className;
  return Array.isArray(cls) ? cls.map(String) : [];
}

function propertyTag(
  properties: Properties | undefined,
  name: string,
): string | undefined {
  const value = properties?.[name];
  return typeof value === "string" ? value : undefined;
}

export function remarkCodeGroups(): (tree: MdastRoot) => void {
  return (tree) => {
    const groups: Array<{
      parent: MdastParent;
      index: number;
      group: string;
      labels: string[];
    }> = [];
    const seen = new WeakSet<object>();
    visit(tree, (node, index, parent) => {
      if (parent === null || parent === undefined || typeof index !== "number")
        return;
      if (node.type !== "code") return;
      if (seen.has(node)) return;
      const group = codeMeta(node.meta).group;
      if (!group) return;

      const children = parent.children;
      let end = index + 1;
      const labels = [codeMeta(node.meta).tab || "Tab 1"];
      while (end < children.length) {
        const next = children[end];
        if (!next || next.type !== "code") break;
        const nextMeta = codeMeta(next.meta);
        if (nextMeta.group !== group) break;
        labels.push(nextMeta.tab || `Tab ${labels.length + 1}`);
        seen.add(next);
        end++;
      }
      if (end - index < 2) return;
      seen.add(node);
      groups.push({ parent, index, group, labels });
    });

    for (const { parent, index, group, labels } of groups.reverse()) {
      parent.children.splice(index, 0, {
        type: "ecTabsMarker",
        data: {
          hName: "div",
          hProperties: {
            className: ["ec-tabs"],
            "data-ec-group": group,
            "data-ec-labels": JSON.stringify(labels),
          },
        },
        children: [],
      });
    }
  };
}

export function rehypeCodeTabs(): (tree: HastRoot) => void {
  return (tree) => {
    const groups: Array<{
      parent: HastRoot | Element;
      index: number;
      j: number;
      group: string;
      labelsRaw: string;
      frames: Element[];
    }> = [];

    visit(tree, (node, index, parent) => {
      if (parent === null || parent === undefined || typeof index !== "number")
        return;
      if (node.type !== "element" || node.tagName !== "div") return;
      if (!classes(node.properties).includes("ec-tabs")) return;
      const group = propertyTag(node.properties, "data-ec-group");
      const labelsRaw = propertyTag(node.properties, "data-ec-labels");
      if (!group || !labelsRaw) return;

      // only as many frames as the group has blocks: a code block right after the group
      // (a terminal frame, say) is its own frame, not another tab
      let count = 0;
      try {
        const parsed = JSON.parse(labelsRaw);
        if (Array.isArray(parsed)) count = parsed.length;
      } catch {
        return;
      }

      const children = parent.children;
      const frames: Element[] = [];
      let j = index + 1;
      for (; j < children.length && frames.length < count; j++) {
        const sib = children[j];
        if (!sib) break;
        if (sib.type === "text") {
          if (String(sib.value ?? "").trim() === "") continue;
          break;
        }
        if (sib.type !== "element" || sib.tagName !== "div") break;
        if (!classes(sib.properties).includes("expressive-code")) break;
        frames.push(sib);
      }
      if (frames.length < 2) return;
      groups.push({ parent, index, j, group, labelsRaw, frames });
    });

    for (const {
      parent,
      index,
      j,
      group,
      labelsRaw,
      frames,
    } of groups.reverse()) {
      let labels: string[];
      try {
        labels = JSON.parse(labelsRaw);
      } catch {
        labels = [];
      }
      if (!Array.isArray(labels)) labels = [];
      while (labels.length < frames.length)
        labels.push(`Tab ${labels.length + 1}`);

      const name = `ec-tabs-${group.replace(/\s+/g, "-")}`;

      const radios = frames.map((_frame, idx): Element => ({
        type: "element",
        tagName: "input",
        properties: {
          type: "radio",
          name,
          id: `${name}-${idx}`,
          className: ["ec-tabs__radio"],
          checked: idx === 0,
        },
        children: [],
      }));

      const bar: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["ec-tabs__bar"] },
        children: labels.map((label, idx) => ({
          type: "element",
          tagName: "label",
          properties: {
            className: ["ec-tabs__tab"],
            for: `${name}-${idx}`,
          },
          children: [{ type: "text", value: String(label) }],
        })),
      };

      const panels: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["ec-tabs__panels"] },
        children: frames.map((frame) => ({
          type: "element",
          tagName: "div",
          properties: { className: ["ec-tabs__panel"] },
          children: [frame],
        })),
      };

      const tabs: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["ec-tabs"], "data-tabs": "" },
        children: [...radios, bar, panels],
      };
      // Root and Element children are different array types, but an Element is valid in both
      (parent.children as ElementContent[]).splice(index, j - index, tabs);
    }
  };
}
