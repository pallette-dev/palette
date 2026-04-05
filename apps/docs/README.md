# Pallette docs (Starlight)

Built with [Starlight](https://starlight.astro.build/) on [Astro](https://astro.build/). The default `astro build` output is a **static** site under `dist/`, ready for hosts such as [GitHub Pages](https://pages.github.com/).

Content covers **why Pallette exists**, **how to integrate** it with json-render, **package layout**, and **how to run the local Vite demos** (React and Svelte)—the interactive catalog is not embedded in this site.

## Scripts

- `pnpm dev` — local dev server (port 3001)
- `pnpm build` — production build → `dist/`
- `pnpm preview` — preview the production build locally

## GitHub Pages (project site)

For a repository served at `https://<org>.github.io/<repo>/`, set the site origin and base path when building so routes and assets resolve correctly:

```bash
SITE_URL=https://<org>.github.io BASE_PATH=/<repo>/ pnpm build
```

Then publish the contents of `dist/` to GitHub Pages (for example the `gh-pages` branch or the **GitHub Actions** “upload-pages-artifact” flow).

For a **user or organization** site (`https://<user>.github.io` with no repository path), you can omit `BASE_PATH` (it defaults to `/`) and set `SITE_URL` to that origin.

## Interactive catalog

Run **`apps/pallette-demo-react`** or **`apps/pallette-demo-svelte`** locally; see the **Live demos** page in the docs sidebar for commands and ports.
