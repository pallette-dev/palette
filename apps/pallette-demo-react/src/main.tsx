import { defineCatalog } from "@json-render/core";
import { defineRegistry, schema } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { PalletteCatalogReact } from "@pallette/plugin-react";
import { createRoot } from "react-dom/client";
import "./globals.css";

const catalog = defineCatalog(schema, {
  components: shadcnComponentDefinitions,
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  actions: {},
  components: shadcnComponents,
});

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <PalletteCatalogReact
    components={shadcnComponentDefinitions}
    registry={registry}
    style={{ display: "block", height: "100vh" }}
  />,
);
