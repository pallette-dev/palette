import type { Spec, UIElement } from "@json-render/core";

/**
 * Nested node in a catalog `example` `children` / `slots` tree.
 * Matches the flat spec after expansion: each node becomes an element with `children` keys.
 */
export type CatalogExampleChildNode = {
  type: string;
  props?: Record<string, unknown>;
  children?: CatalogExampleChildNode[];
  slots?: Record<string, CatalogExampleChildNode[] | undefined>;
};

function orderedSlotNames(names: string[]): string[] {
  if (names.length === 0) {
    return [];
  }
  if (!names.includes("default")) {
    return [...names].sort();
  }
  return ["default", ...names.filter((n) => n !== "default").sort()];
}

export function normalizeExampleChild(
  input: unknown,
): CatalogExampleChildNode | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const o = input as Record<string, unknown>;
  if (typeof o.type !== "string") {
    return null;
  }
  const props =
    o.props !== undefined &&
    o.props !== null &&
    typeof o.props === "object" &&
    !Array.isArray(o.props)
      ? { ...(o.props as Record<string, unknown>) }
      : {};

  let children: CatalogExampleChildNode[] | undefined;
  if (Array.isArray(o.children)) {
    const list = o.children
      .map(normalizeExampleChild)
      .filter((x): x is CatalogExampleChildNode => x !== null);
    if (list.length > 0) {
      children = list;
    }
  }

  let slots: Record<string, CatalogExampleChildNode[]> | undefined;
  const rawSlots = o.slots;
  if (rawSlots && typeof rawSlots === "object" && !Array.isArray(rawSlots)) {
    const s: Record<string, CatalogExampleChildNode[]> = {};
    for (const [k, v] of Object.entries(rawSlots)) {
      if (!Array.isArray(v)) {
        continue;
      }
      const list = v
        .map(normalizeExampleChild)
        .filter((x): x is CatalogExampleChildNode => x !== null);
      if (list.length > 0) {
        s[k] = list;
      }
    }
    if (Object.keys(s).length > 0) {
      slots = s;
    }
  }

  return {
    type: o.type,
    props,
    ...(children ? { children } : {}),
    ...(slots ? { slots } : {}),
  };
}

function flatChildListFromNode(node: CatalogExampleChildNode): CatalogExampleChildNode[] {
  const out: CatalogExampleChildNode[] = [];
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      out.push(c);
    }
  }
  if (node.slots && typeof node.slots === "object") {
    for (const name of orderedSlotNames(Object.keys(node.slots))) {
      const arr = node.slots[name];
      if (!Array.isArray(arr)) {
        continue;
      }
      for (const c of arr) {
        out.push(c);
      }
    }
  }
  return out;
}

function rootExampleChildList(
  example: Record<string, unknown> | undefined,
): CatalogExampleChildNode[] {
  if (!example) {
    return [];
  }
  const out: CatalogExampleChildNode[] = [];

  const ch = example.children;
  if (Array.isArray(ch)) {
    for (const item of ch) {
      const n = normalizeExampleChild(item);
      if (n) {
        out.push(n);
      }
    }
  }

  const sl = example.slots;
  if (sl && typeof sl === "object" && !Array.isArray(sl)) {
    for (const name of orderedSlotNames(Object.keys(sl as object))) {
      const arr = (sl as Record<string, unknown>)[name];
      if (!Array.isArray(arr)) {
        continue;
      }
      for (const item of arr) {
        const n = normalizeExampleChild(item);
        if (n) {
          out.push(n);
        }
      }
    }
  }

  return out;
}

/**
 * Build a one-root preview spec. If `example` includes `children` and/or `slots`, those
 * nodes are flattened into `elements` and wired under the root’s `children` (json-render
 * has a single ordered `children` list; named `slots` are concatenated with `default` first).
 */
export function buildPreviewSpec(
  componentType: string,
  props: Record<string, unknown>,
  example?: Record<string, unknown>,
): Spec {
  const elements: Record<string, UIElement> = {};
  let counter = 0;
  const makeId = () => `p${counter++}`;

  function addSubtree(node: CatalogExampleChildNode): string {
    const id = makeId();
    const childIds = flatChildListFromNode(node).map(addSubtree);
    elements[id] = {
      type: node.type,
      props: node.props ?? {},
      ...(childIds.length > 0 ? { children: childIds } : {}),
    };
    return id;
  }

  const rootId = "preview";
  const rootChildIds = rootExampleChildList(example).map(addSubtree);

  elements[rootId] = {
    type: componentType,
    props,
    children: rootChildIds,
  };

  return { root: rootId, elements };
}
