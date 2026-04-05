import type { PallettePreview } from "@pallette/core";

/**
 * Placeholder until `@json-render/vue` + a shadcn package are available for previews.
 */
export function createVuePreview(): PallettePreview {
  return {
    mount(container) {
      container.replaceChildren();
      const p = document.createElement("p");
      p.style.cssText = "padding:12px;font:13px system-ui;color:#666";
      p.textContent =
        "@pallette/plugin-vue is not implemented yet. Use @pallette/plugin-react or @pallette/plugin-svelte.";
      container.appendChild(p);
    },
    unmount() {},
  };
}
