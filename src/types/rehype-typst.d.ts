// @myriaddreamin/rehype-typst ships no types; it's a rehype plugin like rehype-katex
declare module "@myriaddreamin/rehype-typst" {
  import type { Root } from "hast";

  export default function rehypeTypst(): (tree: Root) => Promise<void>;
}
