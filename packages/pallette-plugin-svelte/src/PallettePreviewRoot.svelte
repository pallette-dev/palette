<script lang="ts">
  import type { Spec } from "@json-render/core";
  import {
    JsonUIProvider,
    Renderer,
    type ComponentRegistry,
  } from "@json-render/svelte";

  let {
    spec = null,
    registry,
  }: {
    spec: Spec | null;
    registry: ComponentRegistry;
  } = $props();
</script>

<JsonUIProvider initialState={{}} handlers={{}}>
  {#snippet children()}
    <Renderer {spec} {registry} />
  {/snippet}
</JsonUIProvider>
