---
title: Getting started
description: Wire up the Pallette catalog with json-render in React or Svelte.
---

## Prerequisites

- A **json-render** setup: catalog schema (`defineCatalog`), renderer registry (`defineRegistry`), and component implementations (e.g. shadcn presets).
- **pnpm** (this monorepo uses workspaces).

## Install (monorepo consumers)

From another package in this repo, depend on the workspace packages you need:

```json
{
  "dependencies": {
    "@pallette/core": "workspace:*",
    "@pallette/catalog": "workspace:*",
    "@pallette/plugin-react": "workspace:*"
  }
}
```

For Svelte, use `@pallette/plugin-svelte` instead of (or in addition to) `@pallette/plugin-react`. You still need `@json-render/core`, your renderer package (`@json-render/react` or `@json-render/svelte`), and your component kit (e.g. `@json-render/shadcn` or `@json-render/shadcn-svelte`).

## React

Use the shadcn json-render preset (or your own definitions) with **`PalletteCatalogReact`**. Registration of the **`pallette-catalog`** custom element runs inside the plugin on the client.

```tsx
// e.g. src/main.tsx
import { defineCatalog } from "@json-render/core";
import { defineRegistry, schema } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { PalletteCatalogReact } from "@pallette/plugin-react";
import { createRoot } from "react-dom/client";

const catalog = defineCatalog(schema, {
  components: shadcnComponentDefinitions,
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  actions: {},
  components: shadcnComponents,
});

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <PalletteCatalogReact
    components={shadcnComponentDefinitions}
    registry={registry}
    style={{ display: "block", height: "100vh" }}
  />,
);
```

The catalog reads **`components`** (definitions + Zod props) and **`registry`** (your renderer). Optionally pass a custom **`preview`** from `createReactPreview()` if you share preview state outside this tree.

Reference implementation: **`apps/pallette-demo-react`** (`pnpm --filter pallette-demo-react dev`, default port **3002**).

## Svelte

1. Define catalog and registry with **`@json-render/svelte`** and your Svelte component kit:

```ts
// e.g. src/lib/catalog.ts
import { defineCatalog } from "@json-render/core";
import { defineRegistry, schema } from "@json-render/svelte";
import { shadcnComponents } from "@json-render/shadcn-svelte";
import { shadcnComponentDefinitions } from "@json-render/shadcn-svelte/catalog";

export const catalog = defineCatalog(schema, {
  components: shadcnComponentDefinitions,
  actions: {},
});

export const { registry } = defineRegistry(catalog, {
  actions: {},
  components: shadcnComponents,
});
```

2. Use **`PalletteCatalog`** from `@pallette/plugin-svelte`:

```svelte
<!-- e.g. src/App.svelte -->
<script lang="ts">
  import { defineCatalog } from "@json-render/core";
  import { defineRegistry, schema } from "@json-render/svelte";
  import { shadcnComponents } from "@json-render/shadcn-svelte";
  import { shadcnComponentDefinitions } from "@json-render/shadcn-svelte/catalog";
  import { PalletteCatalog } from "@pallette/plugin-svelte";

  const catalog = defineCatalog(schema, {
    components: shadcnComponentDefinitions,
    actions: {},
  });

  const { registry } = defineRegistry(catalog, {
    actions: {},
    components: shadcnComponents,
  });
</script>

<PalletteCatalog
  components={shadcnComponentDefinitions}
  {registry}
  style="display: block; height: 100vh; margin: 0;"
/>
```

Reference implementation: **`apps/pallette-demo-svelte`** (`pnpm --filter pallette-demo-svelte dev`, default port **3003**).

## Customizing examples

Use **`extendCatalogComponents`** from `@pallette/core` (or maintain richer `example` fields on definitions) so the catalog’s generated preview and inspector reflect your design system—without separate Storybook files.

## See also

- **[Packages](/packages/)** — `@pallette/core`, `@pallette/catalog`, framework plugins.
- **[Live demos](/demos/)** — run the full catalog locally.
