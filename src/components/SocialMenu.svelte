<!-- Social and contact links, in a menu under an @ button. -->
<script lang="ts">
  import AtSignIcon from "@lucide/svelte/icons/at-sign";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import MailIcon from "@lucide/svelte/icons/mail";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { siteConfig } from "@/config/site";

  const { github, linkedin, email } = siteConfig.socialLinks;
  const links = [
    linkedin && {
      href: linkedin,
      label: "LinkedIn",
      detail: "↗ Profile",
      icon: "linkedin",
    },
    github && {
      href: github,
      label: "GitHub",
      detail: "↗ Repository",
      icon: "github",
    },
    email && {
      href: email.startsWith("http") ? email : `mailto:${email}`,
      label: "Email",
      detail: "↗ Contact",
      icon: "mail",
    },
  ].filter((link) => !!link);

  const itemClass =
    "group/social cursor-pointer gap-[0.65rem] rounded-[5px] px-[0.65rem] py-[0.45rem] text-foreground no-underline focus:bg-muted focus:text-link";
  const badgeClass =
    "inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] border border-border bg-card text-muted-foreground transition-[color,border-color] duration-[120ms] ease-[ease] group-focus/social:border-link group-focus/social:text-link";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    id="social-menu-btn"
    class="group inline-flex h-[34px] cursor-pointer items-center justify-center gap-[5px] rounded-[6px] border border-border bg-card px-[0.55rem] text-muted-foreground transition-[color,background-color,border-color] duration-150 ease-[ease] hover:border-link hover:bg-muted hover:text-foreground data-open:border-link data-open:text-foreground"
    aria-label="Connect and social links"
    title="Connect"
  >
    <AtSignIcon class="size-[15px]" aria-hidden="true" />
    <ChevronDownIcon
      class="size-[10px] opacity-60 transition-transform duration-150 ease-[ease] group-data-open:rotate-180"
      strokeWidth={2.5}
      aria-hidden="true"
    />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content
    align="end"
    sideOffset={6}
    class="w-auto min-w-[175px] rounded-[8px] border border-border bg-background p-[0.35rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] ring-0"
  >
    <DropdownMenu.Label
      class="px-[0.65rem] pt-[0.25rem] pb-[0.35rem] font-mono text-[0.68rem] font-bold tracking-[0.06em] text-muted-foreground opacity-80"
    >
      CONNECT
    </DropdownMenu.Label>
    {#each links as link (link.href)}
      <DropdownMenu.Item class={itemClass}>
        {#snippet child({ props })}
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            <span class={badgeClass}>
              {#if link.icon === "mail"}
                <MailIcon class="size-[15px]" aria-hidden="true" />
              {:else if link.icon === "github"}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              {:else}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"
                  />
                </svg>
              {/if}
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-px">
              <span
                class="text-[0.84rem] leading-[1.2] font-semibold text-foreground group-focus/social:text-link"
                >{link.label}</span
              >
              <span
                class="font-mono text-[0.72rem] leading-[1.1] text-muted-foreground"
                >{link.detail}</span
              >
            </span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
