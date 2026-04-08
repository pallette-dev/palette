# Changesets

- **`pnpm changeset`** — add a changeset (select packages + bump type + summary).
- **`pnpm version-packages`** — apply versions and update changelogs from changesets.
- **`pnpm release`** — build, then publish to npm (skips **`private: true`** packages: `eslint-config`, `typescript-config`).

Apps under `apps/*` are **ignored** by Changesets. Every **`@pallette/*`** workspace package is **versioned independently** (no linked release group).
