<!--
  Site search: a dialog over the page, opened with Ctrl/Cmd+K, "/", or the header's search
  buttons. Results come from /search-index.json, fetched when the browser is idle or on first
  open, and are matched by src/lib/search.ts. Arrow keys move the selection, Enter opens it.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { siteConfig } from "../config/site";
  import {
    highlight,
    search,
    type SearchData,
    type SearchItem,
  } from "../lib/search";
  import { getDefaultDocIcon, getTechIconSvg } from "../utils/techIcons";

  let open = $state(false);
  let query = $state("");
  let data = $state<SearchData | null>(null);
  let selected = $state(-1);

  let input = $state<HTMLInputElement>();
  let backdrop = $state<HTMLDivElement>();
  // the result links in keyboard order: posts, then projects, then tags
  let items = $state<HTMLAnchorElement[]>([]);

  const trimmed = $derived(query.trim());
  const results = $derived(
    data && trimmed
      ? search(data, trimmed)
      : { posts: [], projects: [], tags: [] },
  );
  const total = $derived(
    results.posts.length + results.projects.length + results.tags.length,
  );

  // a new query selects the top result
  $effect(() => {
    void results;
    selected = total > 0 ? 0 : -1;
  });

  $effect(() => {
    items[selected]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  let loading: Promise<void> | null = null;
  function loadIndex() {
    loading ??= fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: SearchData) => {
        data = json;
      })
      .catch((err) => {
        console.error("Error loading search index:", err);
        loading = null;
      });
  }

  async function openDialog() {
    open = true;
    document.body.style.overflow = "hidden";
    loadIndex();
    await tick();
    input?.focus();
    input?.select();
  }

  function closeDialog() {
    open = false;
    document.body.style.overflow = "";
    query = "";
  }

  async function clearQuery() {
    query = "";
    await tick();
    input?.focus();
  }

  function move(step: number) {
    if (total > 0) selected = (selected + step + total) % total;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openDialog();
        return;
      }
      const typing = e.composedPath().some((el) => {
        if (!(el instanceof HTMLElement)) return false;
        const tag = el.tagName.toLowerCase();
        return tag === "input" || tag === "textarea" || el.isContentEditable;
      });
      if (e.key === "/" && !typing) {
        e.preventDefault();
        openDialog();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" && items[selected]) {
      e.preventDefault();
      items[selected].click();
    }
  }

  // the header's search buttons are Astro markup outside this island
  $effect(() => {
    const triggers = document.querySelectorAll(
      "#header-search-btn, #mobile-search-btn",
    );
    const onClick = (e: Event) => {
      e.preventDefault();
      openDialog();
    };
    triggers.forEach((btn) => btn.addEventListener("click", onClick));
    return () =>
      triggers.forEach((btn) => btn.removeEventListener("click", onClick));
  });

  // fetch the index once the page has settled, so the first search is instant
  $effect(() => {
    const preload = () =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(loadIndex)
        : setTimeout(loadIndex, 1500);
    if (document.readyState === "complete") preload();
    else window.addEventListener("load", preload, { once: true });
  });

  // static SVG strings from techIcons, never user content
  function iconSvg(item: SearchItem): string {
    const text = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
    if (text.includes("astro") || text.includes("ssg"))
      return getTechIconSvg("astro", 16);
    if (text.includes("vault")) return getTechIconSvg("vault", 16);
    if (text.includes("github") || text.includes("git"))
      return getTechIconSvg("github", 16);
    if (["gallery", "photo", "zoom"].some((w) => text.includes(w)))
      return getTechIconSvg("gallery", 16);
    if (text.includes("typography") || text.includes("writing"))
      return getTechIconSvg("typography", 16);
    if (text.includes("code")) return getTechIconSvg("code", 16);
    return getDefaultDocIcon(16);
  }

  // shared classes
  const pill =
    "inline-flex items-center gap-[0.4rem] rounded-[6px] border border-line bg-surface px-3 py-[0.4rem] text-[0.82rem] text-fg no-underline transition-[border-color,transform,background-color] duration-150 ease-[ease] hover:border-accent hover:bg-subtle hover:text-accent hover:[transform:translateY(-1px)]";
  const sectionHeading =
    "mb-[0.35rem] flex items-center justify-between px-[0.65rem] py-[0.35rem] font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-muted uppercase";
  const resultCard =
    "search-result-item group/item mb-[0.45rem] flex cursor-pointer items-start gap-3 rounded-[8px] border border-line bg-surface px-[0.85rem] py-[0.65rem] text-fg no-underline [transition:border-color_0.15s_ease,background-color_0.15s_ease,box-shadow_0.15s_ease,transform_0.12s_ease] hover:border-accent hover:bg-subtle hover:[transform:translateY(-1px)] [&.selected]:border-accent [&.selected]:bg-subtle [&.selected]:shadow-[0_0_0_1px_var(--accent),0_4px_14px_rgba(0,0,0,0.08)] [&.selected]:[transform:translateY(-1px)]";
  const resultIcon =
    "mt-[2px] inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border border-line bg-page text-[0.9rem] text-accent [&_svg.tech-svg]:block [&_svg.tech-svg]:shrink-0";
  const resultTitle =
    "truncate text-[0.88rem] leading-[1.3] font-semibold text-fg group-hover/item:text-accent group-[.selected]/item:text-accent";
  const resultMeta =
    "shrink-0 font-mono text-[0.72rem] whitespace-nowrap text-muted";
  const resultDescription =
    "mb-[0.4rem] truncate text-[0.78rem] leading-[1.4] text-muted";
  const tagBadge =
    "rounded-[4px] border border-line bg-page px-[0.45rem] py-[0.12rem] font-mono text-[0.68rem] text-muted";
  const mark =
    "rounded-[3px] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-[0.2rem] py-[0.05rem] font-bold text-accent";
</script>

<svelte:window onkeydown={onKeydown} />

<!-- prefix ("#" for tags) joins the first segment's text node, so the text shapes as one run -->
{#snippet highlighted(text: string, prefix: string = "")}
  {#each highlight(text, trimmed) as segment, i (i)}
    {#if segment.match}{i === 0 ? prefix : ""}<mark class={mark}
        >{segment.text}</mark
      >{:else}{(i === 0 ? prefix : "") + segment.text}{/if}
  {/each}
{/snippet}

{#snippet card(item: SearchItem, index: number, meta: string)}
  <a
    href={item.url}
    class={[resultCard, { selected: selected === index }]}
    data-search-item
    bind:this={items[index]}
    onmouseenter={() => (selected = index)}
  >
    <div class={resultIcon}>
      {#if item.type === "project"}
        <span style="font-size: 15px; line-height: 1;"
          >{item.emoji ?? "📦"}</span
        >
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- static icon markup -->
        {@html iconSvg(item)}
      {/if}
    </div>
    <div class="min-w-0 flex-1">
      <div class="mb-[0.18rem] flex items-center justify-between gap-2">
        <div class={resultTitle}>{@render highlighted(item.title)}</div>
        <div class={resultMeta}>{meta}</div>
      </div>
      <div class={resultDescription}>
        {@render highlighted(item.description)}
      </div>
      <div class="flex flex-wrap gap-[0.35rem]">
        {#if item.type === "project"}
          <span
            class="rounded-[4px] border border-accent bg-page px-[0.45rem] py-[0.12rem] font-mono text-[0.68rem] font-semibold text-accent"
            >⚡ {item.category ?? "Project"}</span
          >
        {/if}
        {#each item.tags.slice(0, item.type === "project" ? 3 : 4) as tag (tag)}
          <span class={tagBadge}>{@render highlighted(tag, "#")}</span>
        {/each}
      </div>
    </div>
  </a>
{/snippet}

<div
  bind:this={backdrop}
  id="search-modal-backdrop"
  class={[
    "group/modal fixed inset-0 z-[1000] hidden items-start justify-center overflow-y-auto bg-scrim px-4 pt-14 pb-8 opacity-0 backdrop-blur-[8px] transition-opacity duration-[180ms] ease-[ease] max-sm:px-2 max-sm:py-4 [&.open]:flex [&.open]:opacity-100",
    { open },
  ]}
  aria-hidden={!open}
  role="dialog"
  aria-modal="true"
  aria-label="Global Search"
  tabindex="-1"
  onclick={(e) => {
    if (e.target === backdrop) closeDialog();
  }}
>
  <div
    class="flex w-full max-w-[620px] [transform:scale(0.97)_translateY(-8px)] flex-col overflow-hidden rounded-[12px] border border-line bg-page shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)] transition-transform duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-[.open]/modal:[transform:scale(1)_translateY(0)]"
    id="search-modal-dialog"
  >
    <!-- Header -->
    <div
      class="flex items-center gap-3 border-b border-line bg-surface px-[1.15rem] py-[0.85rem]"
    >
      <div class="flex flex-1 items-center gap-[0.65rem]">
        <svg
          class="shrink-0 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
        <input
          bind:this={input}
          bind:value={query}
          type="text"
          id="search-modal-input"
          class="min-w-0 flex-1 border-none bg-transparent font-sans text-[0.95rem] text-fg outline-none placeholder:text-muted placeholder:opacity-80"
          placeholder="Search articles, projects, topics, tags..."
          aria-label="Search"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
        {#if query}
          <button
            id="search-modal-clear"
            class="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[50%] border-none bg-line p-0 text-muted transition-[background,color] duration-150 ease-[ease] hover:bg-muted hover:text-page"
            aria-label="Clear search"
            type="button"
            onclick={clearQuery}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        {/if}
      </div>
      <button
        id="search-modal-close"
        class="cursor-pointer border-none bg-transparent p-0"
        type="button"
        aria-label="Close search (Esc)"
        title="Close (Esc)"
        onclick={closeDialog}
      >
        <kbd
          class="inline-flex items-center justify-center rounded-[4px] border border-line bg-page px-[0.4rem] py-[0.15rem] font-mono text-[0.6875rem] font-semibold text-muted shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          ESC
        </kbd>
      </button>
    </div>

    <!-- Results -->
    <div
      id="search-modal-results"
      class="max-h-[55vh] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-y-auto p-[0.85rem] outline-none [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-line"
      tabindex="-1"
    >
      {#if !trimmed}
        <div class="px-3 py-5 text-center">
          <div
            class="mb-4 font-mono text-[0.72rem] font-semibold tracking-[0.06em] text-muted uppercase"
          >
            Quick Access &amp; Navigation
          </div>
          <div class="mb-5 flex flex-wrap justify-center gap-2">
            <a href="/blog" class={pill}
              ><span>📄</span> <span>All Articles</span></a
            >
            <a href="/projects" class={pill}
              ><span>📦</span> <span>All Projects</span></a
            >
            <a href="/tags" class={pill}
              ><span>🏷️</span> <span>All Tags</span></a
            >
            <a href="/about" class={pill}><span>👤</span> <span>About</span></a>
          </div>
          <div
            class="text-[0.82rem] leading-[1.5] text-muted [&_code]:rounded-[4px] [&_code]:border [&_code]:border-line [&_code]:bg-surface [&_code]:px-[0.35rem] [&_code]:py-[0.1rem] [&_code]:font-mono [&_code]:text-[0.75rem] [&_code]:text-accent"
          >
            Type any keyword (e.g., <code>ownership</code>, <code>traits</code>,
            <code>cargo</code>, <code>async</code>) to filter in real-time.
          </div>
        </div>
      {:else if !data}
        <div class="px-4 py-12 text-center text-muted">
          <div class="mb-[0.65rem] text-[2rem]">⏳</div>
          <div class="mb-[0.35rem] text-[0.95rem] font-semibold text-fg">
            Loading search index...
          </div>
        </div>
      {:else if total === 0}
        <div class="px-4 py-12 text-center text-muted">
          <div class="mb-[0.65rem] text-[2rem]">🔍</div>
          <div class="mb-[0.35rem] text-[0.95rem] font-semibold text-fg">
            No results found for "{trimmed}"
          </div>
          <div class="text-[0.82rem] text-muted">
            Try searching for keywords like <code>ownership</code>,
            <code>traits</code>, <code>cargo</code> or <code>async</code>.
          </div>
        </div>
      {:else}
        {#if results.posts.length}
          <div class="mb-[1.15rem] last:mb-1">
            <div class={sectionHeading}>
              <span>📄 Blog Articles</span>
              <span class="font-mono text-[0.6875rem] opacity-75"
                >{results.posts.length}</span
              >
            </div>
            {#each results.posts as post, i (post.url)}
              {@render card(post, i, post.date)}
            {/each}
          </div>
        {/if}
        {#if results.projects.length}
          <div class="mb-[1.15rem] last:mb-1">
            <div class={sectionHeading}>
              <span>📦 Projects</span>
              <span class="font-mono text-[0.6875rem] opacity-75"
                >{results.projects.length}</span
              >
            </div>
            {#each results.projects as project, i (project.url)}
              {@render card(
                project,
                results.posts.length + i,
                project.category ?? "Project",
              )}
            {/each}
          </div>
        {/if}
        {#if results.tags.length}
          <div class="mb-[1.15rem] last:mb-1">
            <div class={sectionHeading}>
              <span>🏷️ Tags &amp; Topics</span>
              <span class="font-mono text-[0.6875rem] opacity-75"
                >{results.tags.length}</span
              >
            </div>
            <div class="flex flex-wrap gap-[0.45rem] px-[0.65rem] py-1">
              {#each results.tags as tag, i (tag.url)}
                {@const index =
                  results.posts.length + results.projects.length + i}
                <a
                  href={tag.url}
                  class={[
                    "inline-flex items-center gap-[0.4rem] rounded-[6px] border border-line bg-surface px-[0.65rem] py-[0.35rem] font-mono text-[0.78rem] text-fg no-underline transition-[border-color,transform,color] duration-[120ms] ease-[ease] hover:[transform:translateY(-1px)] hover:border-accent hover:bg-subtle hover:text-accent [&.selected]:[transform:translateY(-1px)] [&.selected]:border-accent [&.selected]:bg-subtle [&.selected]:text-accent",
                    { selected: selected === index },
                  ]}
                  data-search-item
                  bind:this={items[index]}
                  onmouseenter={() => (selected = index)}
                >
                  <span>{@render highlighted(tag.name, "#")}</span>
                  <span class="text-[0.7rem] opacity-60">({tag.count})</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between border-t border-line bg-surface px-[1.15rem] py-[0.6rem] text-[0.72rem] text-muted"
    >
      <div
        class="flex items-center gap-[0.85rem] [&_kbd]:rounded-[3px] [&_kbd]:border [&_kbd]:border-line [&_kbd]:bg-page [&_kbd]:px-[0.32rem] [&_kbd]:py-[0.1rem] [&_kbd]:font-mono [&_kbd]:text-[0.625rem] [&_kbd]:text-fg"
      >
        <span class="inline-flex items-center gap-1"
          ><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span
        >
        <span class="inline-flex items-center gap-1"><kbd>↵</kbd> Select</span>
        <span class="inline-flex items-center gap-1"><kbd>ESC</kbd> Close</span>
      </div>
      <div class="font-mono text-[0.6875rem] opacity-80 max-sm:hidden">
        🦀 {siteConfig.title} Search
      </div>
    </div>
  </div>
</div>
