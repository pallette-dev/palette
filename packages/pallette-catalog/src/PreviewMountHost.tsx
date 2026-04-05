import type { PallettePreview } from "@pallette/core";
import type { Spec } from "@json-render/core";
import { useEffect, useRef } from "react";
import css from "./PalletteCatalog.module.css";

export type PreviewMountHostProps = {
  preview: PallettePreview | null;
  spec: Spec | null;
  registry: unknown;
};

/**
 * Runs `preview.mount` / `unmount` in a stable DOM node whenever spec, registry, or preview changes.
 */
export function PreviewMountHost({ preview, spec, registry }: PreviewMountHostProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !preview) {
      return;
    }
    el.replaceChildren();
    preview.mount(el, { spec, registry });
    return () => {
      preview.unmount();
    };
  }, [preview, spec, registry]);

  return <div ref={ref} className={css.previewMount} />;
}
