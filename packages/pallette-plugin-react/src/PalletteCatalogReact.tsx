import type {
  PalletteCatalogComponents,
  PallettePreview,
} from "@pallette/core";
import { registerPalletteCatalog } from "@pallette/catalog";
import { createReactPreview } from "./createReactPreview";
import type { CSSProperties } from "react";
import { createElement, useEffect, useMemo, useRef } from "react";

type PalletteCatalogElement = HTMLElement & {
  components: PalletteCatalogComponents;
  registry: unknown;
  preview: PallettePreview;
};

export type PalletteCatalogReactProps = {
  components: PalletteCatalogComponents;
  registry: unknown;
  preview?: PallettePreview;
  className?: string;
  style?: CSSProperties;
};

/**
 * React host for `<pallette-catalog>`.
 * Automatically registers the custom element and forwards props as element properties.
 */
export function PalletteCatalogReact({
  components,
  registry,
  preview,
  className,
  style,
}: PalletteCatalogReactProps) {
  const ref = useRef<PalletteCatalogElement | null>(null);
  const defaultPreview = useMemo(() => createReactPreview(), []);
  const effectivePreview = preview ?? defaultPreview;

  useEffect(() => {
    registerPalletteCatalog();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.components = components;
    el.registry = registry;
    el.preview = effectivePreview;
  }, [components, registry, effectivePreview]);

  return createElement("pallette-catalog", {
    ref,
    className,
    style,
  });
}
