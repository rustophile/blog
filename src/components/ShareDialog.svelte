<!--
  The share bar's Share button and its dialog, on shadcn-svelte's Dialog (bits-ui handles
  Escape, outside clicks, focus trapping and scroll locking): a preview of the post, its link
  with a copy button, and links to share it on other sites.
-->
<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import GlobeIcon from "@lucide/svelte/icons/globe";
  import LinkIcon from "@lucide/svelte/icons/link";
  import MailIcon from "@lucide/svelte/icons/mail";
  import ShareIcon from "@lucide/svelte/icons/share";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Kbd } from "$lib/components/ui/kbd";
  import { brandIcons, type BrandIcon } from "$lib/brand-icons";
  import { siteConfig } from "@/config/site";

  interface Props {
    title: string;
    url: string;
    description?: string;
  }
  let { title, url, description = "" }: Props = $props();

  let open = $state(false);
  let copied = $state(false);
  let input = $state<HTMLInputElement | null>(null);

  const targets = $derived.by(() => {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    return [
      {
        name: "LinkedIn",
        icon: "linkedin",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      },
      {
        name: "X",
        icon: "x",
        href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      },
      {
        name: "WhatsApp",
        icon: "whatsapp",
        href: `https://api.whatsapp.com/send?text=${t}%20${u}`,
      },
      {
        name: "Telegram",
        icon: "telegram",
        href: `https://t.me/share/url?url=${u}&text=${t}`,
      },
      {
        name: "Facebook",
        icon: "facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      },
      {
        name: "Email",
        icon: "email",
        href: `mailto:?subject=${t}&body=${t}%0A%0A${u}`,
      },
    ] satisfies { name: string; icon: BrandIcon | "email"; href: string }[];
  });

  let resetCopied: ReturnType<typeof setTimeout> | undefined;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no clipboard access: leave the link selected so it can be copied by hand
      input?.select();
      return;
    }
    copied = true;
    clearTimeout(resetCopied);
    resetCopied = setTimeout(() => (copied = false), 2000);
  }

  const barButton =
    "inline-flex cursor-pointer items-center gap-[0.35rem] rounded-[6px] border border-border bg-card px-[0.65rem] py-[0.4rem] text-[0.82rem] font-medium text-foreground no-underline [transition:background-color_0.15s_ease,border-color_0.15s_ease,color_0.15s_ease,transform_0.1s_ease] hover:border-link hover:bg-muted hover:text-link hover:[transform:translateY(-1px)]";
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    id="open-share-modal"
    class={barButton}
    aria-label="Share article"
  >
    <ShareIcon class="size-[15px]" aria-hidden="true" />
    <span>Share</span>
  </Dialog.Trigger>
  <Dialog.Content
    id="share-modal-dialog"
    showCloseButton={false}
    onOpenAutoFocus={(e) => {
      // select the link, ready to copy
      e.preventDefault();
      input?.focus();
      input?.select();
    }}
    class="w-[calc(100%-2rem)] max-w-[480px] gap-0 overflow-hidden rounded-[12px] border border-border bg-background p-0 text-foreground shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] ring-0 sm:max-w-[480px]"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-border bg-card px-[1.15rem] py-[0.85rem]"
    >
      <div class="flex items-center gap-2">
        <ShareIcon class="size-4 text-link" aria-hidden="true" />
        <Dialog.Title class="m-0 text-[0.95rem] font-semibold text-foreground"
          >Share article</Dialog.Title
        >
      </div>
      <Dialog.Close
        class="cursor-pointer"
        aria-label="Close share dialog (Esc)"
        title="Close (Esc)"
      >
        <Kbd
          class="h-auto rounded-[4px] border border-border bg-background px-[0.4rem] py-[0.15rem] font-mono text-[0.6875rem] font-semibold text-muted-foreground"
          >ESC</Kbd
        >
      </Dialog.Close>
    </div>

    <!-- Body -->
    <div class="flex flex-col gap-[1.15rem] p-[1.15rem]">
      <!-- Preview -->
      <div
        class="flex flex-col gap-[0.6rem] rounded-[8px] border border-border bg-card px-4 py-[0.9rem]"
      >
        <div
          class="flex items-center justify-between border-b border-border pb-[0.45rem]"
        >
          <span
            class="text-[0.8rem] font-semibold tracking-[-0.01em] text-foreground"
            >{siteConfig.title}</span
          >
          <span
            class="rounded-[4px] border border-border bg-muted px-[0.4rem] py-[0.1rem] font-mono text-[0.68rem] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            >Preview</span
          >
        </div>
        <div class="flex flex-col gap-[0.3rem]">
          <div class="flex items-start gap-[0.45rem]">
            <FileTextIcon
              class="mt-[0.2rem] size-4 shrink-0 text-link"
              aria-hidden="true"
            />
            <span
              class="text-[0.98rem] leading-[1.35] font-semibold text-foreground"
              >{title}</span
            >
          </div>
          {#if description}
            <Dialog.Description
              class="m-0 line-clamp-2 text-[0.8rem] leading-[1.5] text-muted-foreground"
              >{description}</Dialog.Description
            >
          {/if}
        </div>
      </div>

      <!-- Link and copy -->
      <div class="flex items-stretch gap-2">
        <div class="relative flex min-w-0 flex-1 items-center">
          <GlobeIcon
            class="pointer-events-none absolute left-3 size-[14px] text-muted-foreground"
            aria-hidden="true"
          />
          <input
            bind:this={input}
            id="share-url-input"
            type="text"
            value={url}
            readonly
            aria-label="Link to this post"
            spellcheck="false"
            class="w-full overflow-hidden rounded-[6px] border border-border bg-muted py-2 pr-3 pl-[2.15rem] font-mono text-[0.78rem] text-ellipsis whitespace-nowrap text-muted-foreground outline-none focus:border-link focus:text-foreground"
          />
        </div>
        <button
          type="button"
          id="share-copy-btn"
          onclick={copy}
          aria-label="Copy link to clipboard"
          class={[
            "inline-flex shrink-0 cursor-pointer items-center gap-[0.4rem] rounded-[6px] border px-[0.85rem] py-2 text-[0.82rem] font-semibold whitespace-nowrap text-primary-foreground [transition:background-color_0.15s_ease,border-color_0.15s_ease,transform_0.1s_ease] active:[transform:scale(0.98)]",
            copied
              ? "border-success bg-success"
              : "border-link bg-primary hover:border-link-hover hover:bg-link-hover",
          ]}
        >
          {#if copied}
            <CheckIcon class="size-[14px]" aria-hidden="true" /> Copied!
          {:else}
            <LinkIcon class="size-[14px]" aria-hidden="true" /> Copy URL
          {/if}
        </button>
      </div>

      <!-- Share targets -->
      <div class="flex flex-col gap-[0.65rem]">
        <div
          class="font-mono text-[0.72rem] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
        >
          Share directly to:
        </div>
        <div
          class="grid grid-cols-[repeat(6,1fr)] gap-2 max-[480px]:grid-cols-[repeat(3,1fr)]"
        >
          {#each targets as target (target.name)}
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${target.name}`}
              aria-label={`Share on ${target.name}`}
              class="flex h-[42px] items-center justify-center rounded-[6px] border border-border bg-card text-foreground no-underline transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-link hover:bg-muted hover:text-link"
            >
              {#if target.icon === "email"}
                <MailIcon class="size-[17px]" aria-hidden="true" />
              {:else}
                {@const brand = brandIcons[target.icon]}
                <svg
                  width={brand.size}
                  height={brand.size}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"><path d={brand.path} /></svg
                >
              {/if}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
