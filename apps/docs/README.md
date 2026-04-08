# Pallette docs (Starlight)

Built with [Starlight](https://starlight.astro.build/) on [Astro](https://astro.build/). The default `astro build` output is a **static** site under `dist/`, ready for hosts such as [GitHub Pages](https://pages.github.com/).

Content covers **why Pallette exists**, **how to integrate** it with json-render, **package layout**, and **how to run the local Vite demos** (React and Svelte). The **Live demos** page includes **CodeSandbox embeds** that target the public repo **[pallette-dev/pallette](https://github.com/pallette-dev/pallette)** by default.

## CodeSandbox embeds

The **Live demos** page (`demos.mdx`) renders iframe embeds pointing at CodeSandbox’s **GitHub import** for `apps/pallette-demo-react` and `apps/pallette-demo-svelte`, using **`main`** on **`pallette-dev/pallette`** unless you override (e.g. for a fork or feature branch).

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `PUBLIC_DEMO_GITHUB_REPO` | no | `pallette-dev/pallette` | `your-org/pallette` |
| `PUBLIC_DEMO_GITHUB_BRANCH` | no | `main` | `main` or your branch |

Example **fork or custom repo**:

```bash
PUBLIC_DEMO_GITHUB_REPO=your-org/pallette pnpm build
```

Or combined with GitHub Pages:

```bash
SITE_URL=https://your-org.github.io BASE_PATH=/pallette/ pnpm build
```

Demo apps declare **published** `@pallette/*` versions (for example `^0.0.1`) so a GitHub subfolder import can **`pnpm install`** without workspace linking. In this monorepo, **pnpm** still uses local workspace packages when their versions satisfy those ranges.

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

See the **Live demos** page for **embeds** and **local** `pnpm` commands and ports. You can also run **`apps/pallette-demo-react`** and **`apps/pallette-demo-svelte`** from the repo root with `pnpm --filter … dev`.
