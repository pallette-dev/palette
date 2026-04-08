# Changesets

- **`pnpm changeset`** — add a changeset (select packages + bump type + summary).
- **`pnpm version-packages`** — apply versions and update changelogs from changesets.
- **`pnpm release`** — build, then publish to npm (skips **`private: true`** packages: `eslint-config`, `typescript-config`).

Apps under `apps/*` are **ignored** by Changesets. Every **`@pallette/*`** workspace package is **versioned independently** (no linked release group).

## Publishing to npm (avoid `E404` on first publish)

Scoped packages like `@pallette/core` only publish if the **`@pallette` scope exists on npm** and the account tied to **`NPM_TOKEN`** may publish to it.

1. Sign in at [npmjs.com](https://www.npmjs.com/).
2. Create an **organization** named **`pallette`** (**Organizations** → **Add organization**) if you do not already own that scope — or rename packages to a scope you control (e.g. your npm username).
3. Ensure the npm user that created the **automation / granular** token is a **member** of that org with **publish** access to the relevant packages (first publish creates each package under the org).
4. Granular tokens must include **read and write** for those packages (or the org). Classic automation tokens need **`publish`** for the account that owns the org.

If `pallette` is taken on npm, either negotiate access or change the `name` fields in each package to another scope (e.g. `@your-username/...`) and update dependents.

### Still seeing `E404` on publish with a valid token?

- **GitHub Actions:** `actions/setup-node` with `registry-url` expects **`NODE_AUTH_TOKEN`** (the release workflow sets it from `NPM_TOKEN`). Without it, publish can be unauthenticated and npm may return a misleading **404**.
- **Granular access tokens:** include **all packages in the org** (or each unpublished name), not only existing versions — first publish must be allowed for new package names.
- **Sanity-check locally** with the same token:  
  `NPM_TOKEN=… npm whoami --registry=https://registry.npmjs.org`  
  then try publishing one package manually or `pnpm publish --dry-run` from `packages/pallette/` with auth in `.npmrc`.
