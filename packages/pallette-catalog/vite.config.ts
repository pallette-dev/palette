import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function isCeExternal(id: string): boolean {
  return (
    id === "@pallette/core" ||
    id.startsWith("@pallette/core/") ||
    id === "@json-render/core" ||
    id.startsWith("@json-render/core/") ||
    id === "zod" ||
    id.startsWith("zod/")
  );
}

/**
 * ESM bundle for {@link registerPalletteCatalog}: inlines react + react-dom so non-React hosts
 * (e.g. Vite + Svelte) do not need @vitejs/plugin-react or React as app dependencies.
 * Keep @pallette/core, @json-render/core, zod external — the host already provides them.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(rootDir, "src/ce-bundle-entry.ts"),
      formats: ["es"],
      fileName: "ce",
    },
    rollupOptions: {
      external: isCeExternal,
      output: {
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
    emptyOutDir: true,
    outDir: "dist",
  },
});
