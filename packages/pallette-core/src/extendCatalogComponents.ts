import type { PalletteCatalogComponent, PalletteCatalogComponents } from "./types";

export type CatalogExampleExtension =
  | Record<string, unknown>
  | ((baseExample: Record<string, unknown> | undefined) => Record<string, unknown>);

export type CatalogComponentPatch = Partial<
  Omit<PalletteCatalogComponent, "example">
> & {
  example?: CatalogExampleExtension;
};

function mergeExample(
  base: Record<string, unknown> | undefined,
  ext: CatalogExampleExtension | undefined,
): Record<string, unknown> | undefined {
  if (ext === undefined) {
    return base;
  }
  if (typeof ext === "function") {
    return ext(base);
  }
  return { ...(base ?? {}), ...ext };
}

/**
 * Shallow-merge selected catalog entries on top of `base`, with **`example` merged
 * intelligently**: object patches are merged `{ ...baseExample, ...patch }`; functions
 * receive the base example and return the final `example` value.
 */
export function extendCatalogComponents<T extends PalletteCatalogComponents>(
  base: T,
  patches: Partial<{ [K in keyof T]: CatalogComponentPatch }>,
): T {
  const out = { ...base } as T;
  for (const key of Object.keys(patches) as (keyof T)[]) {
    const patch = patches[key];
    if (!patch) {
      continue;
    }
    const prev = out[key];
    if (!prev) {
      continue;
    }

    const mergedExample = mergeExample(prev.example, patch.example);

    out[key] = {
      ...prev,
      ...patch,
      ...(mergedExample !== undefined ? { example: mergedExample } : {}),
    } as T[keyof T];
  }
  return out;
}
