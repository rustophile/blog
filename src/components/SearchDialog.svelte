<!--
  Site search: a dialog over the page, opened with Ctrl/Cmd+K, "/", or the header's search
  buttons. Built on shadcn-svelte's Dialog and Command: bits-ui handles the arrow keys, Enter,
  Escape, focus trapping and scroll locking. Results come from /search-index.json, fetched
  when the browser is idle or on first open, and are matched by src/lib/search.ts.
-->
<script lang="ts">
  import { Command as CommandPrimitive } from "bits-ui";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import PackageIcon from "@lucide/svelte/icons/package";
  import SearchIcon from "@lucide/svelte/icons/search";
  import TagIcon from "@lucide/svelte/icons/tag";
  import UserIcon from "@lucide/svelte/icons/user";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Command from "$lib/components/ui/command";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Kbd } from "$lib/components/ui/kbd";
  import {
    highlight,
    search,
    type SearchData,
    type SearchItem,
  } from "$lib/search";
  import { siteConfig } from "../config/site";

  let open = $state(false);
  let query = $state("");
  let data = $state<SearchData | null>(null);

  const trimmed = $derived(query.trim());
  const results = $derived(
    data && trimmed
      ? search(data, trimmed)
      : { posts: [], projects: [], tags: [] },
  );
  const total = $derived(
    results.posts.length + results.projects.length + results.tags.length,
  );

  // the selected result's value (its URL): a new query selects the top result, and bits-ui
  // moves it with the arrow keys
  let selected = $derived(
    results.posts[0]?.url ??
      results.projects[0]?.url ??
      results.tags[0]?.url ??
      "",
  );

  // a closed dialog starts empty next time
  $effect(() => {
    if (!open) query = "";
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

  function openDialog() {
    open = true;
    loadIndex();
  }

  function onKeydown(e: KeyboardEvent) {
    if (open) return;
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

  // shared classes
  const pill =
    "inline-flex items-center gap-[0.4rem] rounded-[6px] border border-border bg-card px-3 py-[0.4rem] text-[0.82rem] text-foreground no-underline transition-[border-color,transform,background-color] duration-150 ease-[ease] hover:border-link hover:bg-muted hover:text-link hover:[transform:translateY(-1px)] [&_svg]:size-[14px] [&_svg]:text-link";
  const sectionHeading =
    "mb-[0.35rem] flex items-center justify-between px-[0.65rem] py-[0.35rem] font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase";
  const resultCard =
    "group/item mb-[0.45rem] flex cursor-pointer items-start gap-3 rounded-[8px]! border border-border bg-card px-[0.85rem] py-[0.65rem] text-foreground no-underline [transition:border-color_0.15s_ease,background-color_0.15s_ease,box-shadow_0.15s_ease,transform_0.12s_ease] data-selected:border-link data-selected:bg-muted data-selected:text-foreground data-selected:shadow-[0_0_0_1px_var(--link),0_4px_14px_rgba(0,0,0,0.08)] data-selected:[transform:translateY(-1px)]";
  const resultIcon =
    "mt-[2px] inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border border-border bg-background text-link [&_svg]:size-4";
  const resultTitle =
    "truncate text-[0.88rem] leading-[1.3] font-semibold text-foreground group-data-selected/item:text-link";
  const resultMeta =
    "shrink-0 font-mono text-[0.72rem] whitespace-nowrap text-muted-foreground";
  const resultDescription =
    "mb-[0.4rem] truncate text-[0.78rem] leading-[1.4] text-muted-foreground";
  const tagBadge =
    "rounded-[4px] border border-border bg-background px-[0.45rem] py-[0.12rem] font-mono text-[0.68rem] text-muted-foreground";
  const mark =
    "rounded-[3px] bg-[color-mix(in_srgb,var(--link)_18%,transparent)] px-[0.2rem] py-[0.05rem] font-bold text-link";
  const kbd =
    "h-auto min-w-0 rounded-[3px] border border-border bg-background px-[0.32rem] py-[0.1rem] font-mono text-[0.625rem] text-foreground";
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

{#snippet card(item: SearchItem, meta: string)}
  <Command.LinkItem href={item.url} value={item.url} class={resultCard}>
    <div class={resultIcon}>
      {#if item.type === "project"}<PackageIcon
          aria-hidden="true"
        />{:else}<FileTextIcon aria-hidden="true" />{/if}
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
            class="rounded-[4px] border border-link bg-background px-[0.45rem] py-[0.12rem] font-mono text-[0.68rem] font-semibold text-link"
            >{item.category ?? "Project"}</span
          >
        {/if}
        {#each item.tags.slice(0, item.type === "project" ? 3 : 4) as tag (tag)}
          <span class={tagBadge}>{@render highlighted(tag, "#")}</span>
        {/each}
      </div>
    </div>
  </Command.LinkItem>
{/snippet}

<Dialog.Root bind:open>
  <Dialog.Content
    showCloseButton={false}
    class="top-14 max-h-[calc(100dvh-5.5rem)] w-[calc(100%-2rem)] max-w-[620px] translate-y-0 gap-0 overflow-hidden rounded-[12px] border border-border bg-background p-0 text-foreground shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] ring-0 max-sm:top-4 max-sm:w-[calc(100%-1rem)] sm:max-w-[620px]"
  >
    <Dialog.Title class="sr-only">Global Search</Dialog.Title>
    <Dialog.Description class="sr-only"
      >Search articles, projects and tags</Dialog.Description
    >
    <Command.Root
      shouldFilter={false}
      loop
      bind:value={selected}
      class="rounded-none! bg-background p-0 text-foreground"
    >
      <!-- Header -->
      <div
        class="flex items-center gap-3 border-b border-border bg-card px-[1.15rem] py-[0.85rem]"
      >
        <div class="flex flex-1 items-center gap-[0.65rem]">
          <SearchIcon
            class="size-[18px] shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <CommandPrimitive.Input
            bind:value={query}
            id="search-modal-input"
            class="min-w-0 flex-1 border-none bg-transparent font-sans text-[0.95rem] leading-normal text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-80"
            placeholder="Search articles, projects, topics, tags..."
            aria-label="Search"
            autocomplete="off"
            spellcheck="false"
          />
          {#if query}
            <button
              class="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full bg-border text-muted-foreground transition-[background,color] duration-150 ease-[ease] hover:bg-muted-foreground hover:text-background"
              aria-label="Clear search"
              type="button"
              onclick={() => (query = "")}
            >
              <XIcon class="size-[14px]" aria-hidden="true" />
            </button>
          {/if}
        </div>
        <Dialog.Close
          class="cursor-pointer"
          aria-label="Close search (Esc)"
          title="Close (Esc)"
        >
          <Kbd
            class="h-auto rounded-[4px] border border-border bg-background px-[0.4rem] py-[0.15rem] font-mono text-[0.6875rem] font-semibold text-muted-foreground"
            >ESC</Kbd
          >
        </Dialog.Close>
      </div>

      <!-- Results -->
      <Command.List
        id="search-modal-results"
        class="max-h-[55vh] scroll-py-[0.85rem] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] p-[0.85rem]"
      >
        {#if !trimmed}
          <div class="px-3 py-5 text-center">
            <div
              class="mb-4 font-mono text-[0.72rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase"
            >
              Quick Access &amp; Navigation
            </div>
            <div class="mb-5 flex flex-wrap justify-center gap-2">
              <a href="/blog" class={pill}
                ><FileTextIcon aria-hidden="true" /> All Articles</a
              >
              <a href="/projects" class={pill}
                ><PackageIcon aria-hidden="true" /> All Projects</a
              >
              <a href="/tags" class={pill}
                ><TagIcon aria-hidden="true" /> All Tags</a
              >
              <a href="/about" class={pill}
                ><UserIcon aria-hidden="true" /> About</a
              >
            </div>
            <div
              class="text-[0.82rem] leading-[1.5] text-muted-foreground [&_code]:rounded-[4px] [&_code]:border [&_code]:border-border [&_code]:bg-card [&_code]:px-[0.35rem] [&_code]:py-[0.1rem] [&_code]:font-mono [&_code]:text-[0.75rem] [&_code]:text-link"
            >
              Type any keyword (e.g., <code>ownership</code>,
              <code>traits</code>,
              <code>cargo</code>, <code>async</code>) to filter in real-time.
            </div>
          </div>
        {:else if !data}
          <div class="px-4 py-12 text-center text-muted-foreground">
            <div
              class="mb-[0.35rem] text-[0.95rem] font-semibold text-foreground"
            >
              Loading search index...
            </div>
          </div>
        {:else if total === 0}
          <div
            class="px-4 py-12 text-center text-muted-foreground"
            aria-live="polite"
          >
            <SearchIcon
              class="mx-auto mb-[0.65rem] size-8 opacity-50"
              aria-hidden="true"
            />
            <div
              class="mb-[0.35rem] text-[0.95rem] font-semibold text-foreground"
            >
              No results found for "{trimmed}"
            </div>
            <div class="text-[0.82rem] text-muted-foreground">
              Try searching for keywords like <code>ownership</code>,
              <code>traits</code>, <code>cargo</code> or <code>async</code>.
            </div>
          </div>
        {:else}
          {#if results.posts.length}
            <Command.Group class="mb-[1.15rem] p-0 last:mb-1">
              <div class={sectionHeading}>
                <span class="inline-flex items-center gap-[0.4rem]"
                  ><FileTextIcon class="size-[13px]" aria-hidden="true" /> Blog Articles</span
                >
                <span class="opacity-75">{results.posts.length}</span>
              </div>
              {#each results.posts as post (post.url)}
                {@render card(post, post.date)}
              {/each}
            </Command.Group>
          {/if}
          {#if results.projects.length}
            <Command.Group class="mb-[1.15rem] p-0 last:mb-1">
              <div class={sectionHeading}>
                <span class="inline-flex items-center gap-[0.4rem]"
                  ><PackageIcon class="size-[13px]" aria-hidden="true" /> Projects</span
                >
                <span class="opacity-75">{results.projects.length}</span>
              </div>
              {#each results.projects as project (project.url)}
                {@render card(project, project.date)}
              {/each}
            </Command.Group>
          {/if}
          {#if results.tags.length}
            <Command.Group class="mb-[1.15rem] p-0 last:mb-1">
              <div class={sectionHeading}>
                <span class="inline-flex items-center gap-[0.4rem]"
                  ><TagIcon class="size-[13px]" aria-hidden="true" /> Tags &amp; Topics</span
                >
                <span class="opacity-75">{results.tags.length}</span>
              </div>
              <div class="flex flex-wrap gap-[0.45rem] px-[0.65rem] py-1">
                {#each results.tags as tag (tag.url)}
                  <Command.LinkItem
                    href={tag.url}
                    value={tag.url}
                    class="inline-flex w-auto items-center gap-[0.4rem] rounded-[6px]! border border-border bg-card px-[0.65rem] py-[0.35rem] font-mono text-[0.78rem] text-foreground no-underline transition-[border-color,transform,color] duration-[120ms] ease-[ease] data-selected:[transform:translateY(-1px)] data-selected:border-link data-selected:bg-muted data-selected:text-link"
                  >
                    <span>{@render highlighted(tag.name, "#")}</span>
                    <span class="text-[0.7rem] opacity-60">({tag.count})</span>
                  </Command.LinkItem>
                {/each}
              </div>
            </Command.Group>
          {/if}
        {/if}
      </Command.List>

      <!-- Footer -->
      <div
        class="flex items-center justify-between border-t border-border bg-card px-[1.15rem] py-[0.6rem] text-[0.72rem] text-muted-foreground"
      >
        <div class="flex items-center gap-[0.85rem]">
          <span class="inline-flex items-center gap-1"
            ><Kbd class={kbd}>↑</Kbd> <Kbd class={kbd}>↓</Kbd> Navigate</span
          >
          <span class="inline-flex items-center gap-1"
            ><Kbd class={kbd}>↵</Kbd> Select</span
          >
          <span class="inline-flex items-center gap-1"
            ><Kbd class={kbd}>ESC</Kbd> Close</span
          >
        </div>
        <div class="font-mono text-[0.6875rem] opacity-80 max-sm:hidden">
          {siteConfig.title} Search
        </div>
      </div>
    </Command.Root>
  </Dialog.Content>
</Dialog.Root>
