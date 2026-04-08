---
title: Packages
description: Workspace packages that make up Pallette.
---

**Publishable on npm:** `@pallette/core`, `@pallette/catalog`, `@pallette/plugin-react`, `@pallette/plugin-svelte`, and `@pallette/plugin-vue` (scoped public). **`@pallette/eslint-config`** and **`@pallette/typescript-config`** stay **workspace-only** (not intended for npm). Demo and docs apps under `apps/*` are also private.

## `@pallette/core`

Shared utilities: **Zod introspection** for the inspector, helpers like **`extendCatalogComponents`** and **`buildPreviewSpec`**, control-field types, and preview-related helpers used by the catalog UI.

**Peers:** `@json-render/core`, `zod`.

## `@pallette/catalog`

The **catalog shell**: React UI (sidebar, canvas, inspector tabs, CSS modules), **`PalletteCatalog`** component, and the **`pallette-catalog`** custom element via **`registerPalletteCatalog`**. Framework plugins wrap this so you do not have to touch the custom element directly.

**Depends on:** `@pallette/core`.

## `@pallette/plugin-react`

**`PalletteCatalogReact`** — registers the custom element on the client and forwards **`components`**, **`registry`**, and optional **`preview`** / layout props.

Use this in React apps (or documentation sites that hydrate React islands).

## `@pallette/plugin-svelte`

**`PalletteCatalog`** (Svelte component) — same wiring for Svelte apps.

## `@pallette/plugin-vue`

**Stub / placeholder** for a future Vue integration; API will mirror the other plugins when implemented.

## Demo apps (not published packages)

| App | Role |
| --- | --- |
| **`apps/pallette-demo-react`** | Vite + React catalog demo |
| **`apps/pallette-demo-svelte`** | Vite + Svelte catalog demo |
| **`apps/docs`** | This **Starlight** documentation site (static build) |

## json-render

Pallette sits on top of **json-render**-style catalogs: your **`defineCatalog`** definitions and **`defineRegistry`** renderer are required inputs. Pallette does not replace json-render—it **visualizes** and **edits examples** against the schemas you already declared.
