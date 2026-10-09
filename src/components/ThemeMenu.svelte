<!--
  Theme picker: Light, std Dark, or System (follow the OS). The button's icon follows
  <html data-theme-mode>, which Base's inline script sets before first paint, so it
  shows the right icon before this island hydrates.
-->
<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import MonitorIcon from "@lucide/svelte/icons/monitor";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import SunIcon from "@lucide/svelte/icons/sun";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { chooseMode, followOs, storedMode, type ThemeMode } from "$lib/theme";

  const themes = [
    { value: "paper", label: "Light", Icon: SunIcon },
    { value: "dark", label: "std Dark", Icon: MoonIcon },
    { value: "auto", label: "System", Icon: MonitorIcon },
  ] as const;

  let mode = $state<ThemeMode>("auto");

  $effect(() => {
    mode = storedMode();
    return followOs();
  });

  function onValueChange(value: string) {
    mode = value as ThemeMode;
    chooseMode(mode);
  }

  // the button shows the icon for <html data-theme-mode>
  const iconFor: Record<ThemeMode, string> = {
    paper: "hidden [:root[data-theme-mode=paper]_&]:block",
    dark: "hidden [:root[data-theme-mode=dark]_&]:block",
    auto: "block [:root[data-theme-mode=paper]_&]:hidden [:root[data-theme-mode=dark]_&]:hidden",
  };
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    id="theme-toggle-btn"
    class="group inline-flex h-[34px] cursor-pointer items-center justify-center gap-[5px] rounded-[6px] border border-border bg-card px-[0.55rem] text-muted-foreground transition-[color,background-color,border-color] duration-150 ease-[ease] hover:border-link hover:bg-muted hover:text-foreground data-open:border-link data-open:text-foreground"
    aria-label="Select color theme"
    title="Color theme"
  >
    {#each themes as { value, Icon } (value)}
      <Icon class={["size-[15px]", iconFor[value]]} aria-hidden="true" />
    {/each}
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
      THEME
    </DropdownMenu.Label>
    <DropdownMenu.RadioGroup value={mode} {onValueChange}>
      {#each themes as { value, label, Icon } (value)}
        {#if value === "auto"}
          <DropdownMenu.Separator class="mx-0 my-[0.3rem]" />
        {/if}
        <DropdownMenu.RadioItem
          {value}
          class="cursor-pointer gap-[0.55rem] rounded-[5px] py-[0.45rem] pr-8 pl-[0.65rem] text-[0.84rem] leading-normal font-medium text-foreground focus:bg-muted focus:text-link focus:**:text-link data-checked:bg-muted data-checked:font-semibold data-checked:text-link [&_[data-slot=dropdown-menu-radio-item-indicator]]:text-link"
        >
          <Icon class="size-[15px]" aria-hidden="true" />
          {label}
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
