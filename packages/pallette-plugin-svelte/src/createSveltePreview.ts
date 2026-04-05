import type { PallettePreview } from "@pallette/core";
import { mount, unmount } from "svelte";
import type { ComponentRegistry } from "@json-render/svelte";
import PallettePreviewRoot from "./PallettePreviewRoot.svelte";

/**
 * Preview runtime for `@json-render/svelte`. Pair with a registry from `defineRegistry`.
 */
export function createSveltePreview(): PallettePreview {
  let instance: ReturnType<typeof mount> | null = null;

  return {
    mount(container, { spec, registry }) {
      if (instance) {
        unmount(instance);
        instance = null;
      }
      instance = mount(PallettePreviewRoot, {
        target: container,
        props: {
          spec,
          registry: registry as ComponentRegistry,
        },
      });
    },
    unmount() {
      if (instance) {
        unmount(instance);
        instance = null;
      }
    },
  };
}
