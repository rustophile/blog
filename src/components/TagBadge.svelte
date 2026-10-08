<!--
  A tag link on shadcn-svelte's Badge. Rendered from .astro files without a client directive,
  so it ships as plain HTML.
  - inline: the gold "#tag" in post lists, post headers and project cards
  - pill: a bordered chip, with an optional post count, for tag clouds and filters
-->
<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";

  interface Props {
    tag: string;
    variant?: "inline" | "pill";
    count?: number;
    class?: string;
  }
  let { tag, variant = "inline", count, class: className }: Props = $props();

  const variants = {
    inline:
      "rounded-sm border-transparent bg-transparent px-[0.45rem] py-[0.12rem] text-[0.8rem] text-link duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[1.5px] hover:scale-[1.04] hover:border-link hover:bg-muted hover:text-link hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:scale-[0.98]",
    pill: "gap-[0.45rem] rounded-full border-border bg-card px-[0.85rem] py-[0.4rem] text-[0.9rem] text-foreground duration-200 hover:border-link hover:bg-muted hover:text-link",
  };
</script>

<Badge
  href={`/tags/${tag}`}
  variant="outline"
  class={["h-auto font-medium no-underline", variants[variant], className]}
>
  #{tag}
  {#if count !== undefined}
    <span
      class="rounded-full bg-muted px-[0.4rem] py-[0.1rem] font-mono text-[0.75rem] font-normal text-muted-foreground"
      >{count}</span
    >
  {/if}
</Badge>
