import type { Spec } from "@json-render/core";

/** Passed from the catalog shell into a framework preview plugin. */
export type PallettePreviewContext = {
  spec: Spec | null;
  /** Framework-specific registry — plugins cast to their type. */
  registry: unknown;
};

/**
 * One preview runtime per catalog instance (e.g. from `@pallette/plugin-react`).
 */
export type PallettePreview = {
  mount: (container: HTMLElement, context: PallettePreviewContext) => void;
  unmount: () => void;
};
