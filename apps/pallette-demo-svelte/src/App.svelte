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
