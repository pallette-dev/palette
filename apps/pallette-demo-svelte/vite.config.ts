import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Package root ( `package.json` is not an export, so derive from the main entry ). */
function palletteCatalogRoot(): string {
  const main = require.resolve("@pallette/catalog", { paths: [configDir] });
  return path.resolve(path.dirname(main), "..");
}

/**
 * Point `@pallette/catalog/ce` at the prebuilt bundle so Vite never resolves catalog `.tsx`
 * (Svelte apps do not ship React / `@vitejs/plugin-react`).
 */
export default defineConfig({
  plugins: [svelte()],
  server: { port: 3003 },
  resolve: {
    alias: {
      "@pallette/catalog/ce": path.join(palletteCatalogRoot(), "dist/ce.js"),
      "@pallette/catalog/ce.css": path.join(palletteCatalogRoot(), "dist/ce.css"),
    },
  },
});
