<script lang="ts">
  import { registerPalletteCatalog } from "@pallette/catalog";
  import type { PalletteCatalogComponents, PallettePreview } from "@pallette/core";
  import { createSveltePreview } from "./createSveltePreview";
  import { onMount } from "svelte";

  type PalletteCatalogElement = HTMLElement & {
    components: PalletteCatalogComponents;
    registry: unknown;
    preview: PallettePreview;
  };

  export let components: PalletteCatalogComponents;
  export let registry: unknown;
  export let preview: PallettePreview = createSveltePreview();
  export let className: string | undefined = undefined;
  export let style: string | undefined = undefined;

  let el: PalletteCatalogElement | undefined;

  onMount(() => {
    registerPalletteCatalog();
  });

  $: if (el) {
    el.components = components;
    el.registry = registry;
    el.preview = preview;
  }
</script>

<pallette-catalog bind:this={el} class={className} {style}></pallette-catalog>
