<!-- The projects page before there are any projects, on shadcn-svelte's Empty. Rendered from
     .astro without a client directive, so it ships as plain HTML. -->
<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";
  import * as Empty from "$lib/components/ui/empty";
</script>

<Empty.Root
  class="rounded-[8px] border border-dashed border-border bg-card py-12"
>
  <Empty.Header>
    <Empty.Media variant="icon" class="bg-muted text-link">
      <PackageIcon aria-hidden="true" />
    </Empty.Media>
    <Empty.Title class="text-[1.05rem] font-semibold text-foreground">
      Nothing built yet
    </Empty.Title>
    <Empty.Description class="text-muted-foreground">
      Projects built while learning Rust will show up here.
    </Empty.Description>
  </Empty.Header>
</Empty.Root>
