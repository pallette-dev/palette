---
title: Live demos
description: Run the React and Svelte catalog demos locally with pnpm.
---

The interactive catalog runs inside the **Vite demo apps** in this repo. This documentation site stays **static and lightweight**—open the demos in another tab after starting a dev server.

## React demo

From the repository root:

```bash
pnpm --filter pallette-demo-react dev
```

Then open **http://localhost:3002** (see `apps/pallette-demo-react/vite.config.ts` if the port changes).

## Svelte demo

```bash
pnpm --filter pallette-demo-svelte dev
```

Then open **http://localhost:3003** (see `apps/pallette-demo-svelte/vite.config.ts` if the port changes).

## Deployed builds

To share a demo without cloning the repo, build and host the demo’s `dist/` output (same as any Vite static site), or add CI that publishes **`pallette-demo-react`** / **`pallette-demo-svelte`** to GitHub Pages or another static host. Point your docs here to those URLs when they exist.

## Source

- React: `apps/pallette-demo-react/src/main.tsx`
- Svelte: `apps/pallette-demo-svelte/src/App.svelte`

More detail: **[Getting started](/getting-started/)**.
