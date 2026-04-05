"use client";

import {
  buildPreviewSpec,
  introspectPropsSchema,
  type PalletteCatalogComponents,
  type PallettePreview,
} from "@pallette/core";
import type { Spec } from "@json-render/core";
import type { z, ZodError } from "zod";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ControlsPanel } from "./ControlsPanel";
import { PreviewMountHost } from "./PreviewMountHost";
import css from "./PalletteCatalog.module.css";

export type PalletteCatalogProps = {
  /** json-render component definitions (Zod props + optional `example`). */
  components: PalletteCatalogComponents;
  /** Framework-specific registry from `defineRegistry` (paired with `preview`). */
  registry: unknown;
  /** Preview runtime from `@pallette/plugin-react` / `@pallette/plugin-svelte` / … */
  preview: PallettePreview;
  initialComponent?: string;
  onComponentChange?: (name: string) => void;
  className?: string;
};

function getComponentNameFromHash(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.location.hash.replace(/^#/, "").trim();
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function setHashFromComponentName(name: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = `#${encodeURIComponent(name)}`;
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}

function defaultPropsFromFields(
  fields: ReturnType<typeof introspectPropsSchema>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    out[f.key] = f.defaultValue;
  }
  return out;
}

function overlayCatalogExample(
  base: Record<string, unknown>,
  example: Record<string, unknown> | undefined,
  fieldKeys: ReadonlySet<string>,
): Record<string, unknown> {
  if (!example || typeof example !== "object") {
    return base;
  }
  const out = { ...base };
  for (const key of fieldKeys) {
    if (Object.prototype.hasOwnProperty.call(example, key)) {
      out[key] = example[key];
    }
  }
  return out;
}

function initialPropValuesForSchema(
  propsSchema: z.ZodType,
  fields: ReturnType<typeof introspectPropsSchema>,
  example: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const fromIntrospection = defaultPropsFromFields(fields);
  const fieldKeys = new Set(fields.map((f) => f.key));
  const merged = overlayCatalogExample(fromIntrospection, example, fieldKeys);
  const parsed = propsSchema.safeParse(merged);
  if (parsed.success) {
    return parsed.data as Record<string, unknown>;
  }
  return merged;
}

function formatZodIssues(err: ZodError): string {
  return err.issues
    .map(
      (i) =>
        `${i.path.length ? i.path.map(String).join(".") + ": " : ""}${i.message}`,
    )
    .join("; ");
}

type FieldIssue = { path: string; message: string };
type BottomTab = "controls" | "schema" | "content";

function toPrettyJson(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_key, input) => {
        if (typeof input === "bigint") {
          return `${input}n`;
        }
        if (typeof input === "function") {
          return "[Function]";
        }
        if (typeof input === "symbol") {
          return String(input);
        }
        if (!input || typeof input !== "object") {
          return input;
        }
        if (seen.has(input)) {
          return "[Circular]";
        }
        seen.add(input);
        const maybeZod = input as { def?: { type?: unknown } };
        if (
          maybeZod.def &&
          typeof maybeZod.def === "object" &&
          "type" in maybeZod.def
        ) {
          return { $zodType: String(maybeZod.def.type), ...maybeZod.def };
        }
        return input;
      },
      2,
    );
  } catch {
    return String(value);
  }
}

function validateCatalogSpec(
  value: unknown,
  expectedPreviewType: string,
): { ok: true; spec: Spec } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "JSON must be an object." };
  }
  const maybe = value as Record<string, unknown>;
  if (!("root" in maybe) || !("elements" in maybe)) {
    return {
      ok: false,
      error: "JSON must match Spec shape (needs `root` and `elements`).",
    };
  }
  if (maybe.root !== "preview") {
    return { ok: false, error: "Spec.root must be `preview`." };
  }
  if (
    !maybe.elements ||
    typeof maybe.elements !== "object" ||
    Array.isArray(maybe.elements)
  ) {
    return { ok: false, error: "Spec.elements must be an object map." };
  }
  const elements = maybe.elements as Record<string, unknown>;
  if (!("preview" in elements)) {
    return { ok: false, error: "Spec.elements must include a `preview` element." };
  }
  const preview = elements.preview;
  if (!preview || typeof preview !== "object" || Array.isArray(preview)) {
    return { ok: false, error: "Spec.elements.preview must be an object." };
  }
  const previewType = (preview as Record<string, unknown>).type;
  if (typeof previewType !== "string" || previewType.trim() === "") {
    return {
      ok: false,
      error: "Spec.elements.preview.type must be a non-empty string.",
    };
  }
  if (previewType !== expectedPreviewType) {
    return {
      ok: false,
      error: `Spec.elements.preview.type must match selected component \`${expectedPreviewType}\`.`,
    };
  }
  return { ok: true, spec: value as Spec };
}

function getPreviewPropsFromSpec(spec: Spec): Record<string, unknown> {
  const preview = (spec.elements as Record<string, unknown>)?.preview;
  if (!preview || typeof preview !== "object" || Array.isArray(preview)) {
    return {};
  }
  const props = (preview as Record<string, unknown>).props;
  if (!props || typeof props !== "object" || Array.isArray(props)) {
    return {};
  }
  return { ...(props as Record<string, unknown>) };
}

export function PalletteCatalog({
  components,
  registry,
  preview,
  initialComponent,
  onComponentChange,
  className,
}: PalletteCatalogProps) {
  const names = useMemo(
    () => Object.keys(components).sort((a, b) => a.localeCompare(b)),
    [components],
  );

  const [selected, setSelected] = useState(() => {
    const hashName = getComponentNameFromHash();
    if (hashName && components[hashName]) {
      return hashName;
    }
    if (initialComponent && components[initialComponent]) {
      return initialComponent;
    }
    return names[0] ?? "";
  });

  useEffect(() => {
    if (names.length === 0) {
      return;
    }
    if (!components[selected]) {
      const next = names[0];
      if (next) {
        setSelected(next);
      }
    }
  }, [names, selected, components]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    setHashFromComponentName(selected);
  }, [selected]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onHashChange = () => {
      const hashName = getComponentNameFromHash();
      if (!hashName || hashName === selected || !components[hashName]) {
        return;
      }
      setSelected(hashName);
      onComponentChange?.(hashName);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [selected, components, onComponentChange]);

  const componentDef = selected ? components[selected] : undefined;
  const propsSchema = componentDef?.props;
  const catalogExample = componentDef?.example;

  const fields = useMemo(
    () => (propsSchema ? introspectPropsSchema(propsSchema) : []),
    [propsSchema],
  );

  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => {
    if (!propsSchema) {
      return {};
    }
    return initialPropValuesForSchema(propsSchema, fields, catalogExample);
  });

  useLayoutEffect(() => {
    if (!propsSchema) {
      setPropValues({});
      return;
    }
    setPropValues(
      initialPropValuesForSchema(propsSchema, fields, catalogExample),
    );
  }, [selected, fields, propsSchema, catalogExample]);

  const parseResult = useMemo(() => {
    if (!propsSchema) {
      return { success: true as const, data: {} as Record<string, unknown> };
    }
    return propsSchema.safeParse(propValues);
  }, [propsSchema, propValues]);

  const parseError = useMemo(() => {
    if (parseResult.success) {
      return null;
    }
    return formatZodIssues(parseResult.error);
  }, [parseResult]);

  const parseIssues = useMemo<FieldIssue[]>(() => {
    if (parseResult.success) {
      return [];
    }
    return parseResult.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
  }, [parseResult]);

  const baseSpec = useMemo(
    () =>
      selected ? buildPreviewSpec(selected, propValues, catalogExample) : null,
    [selected, propValues, catalogExample],
  );

  const [contentSpecOverride, setContentSpecOverride] = useState<Spec | null>(null);
  const [contentText, setContentText] = useState("");
  const [contentDirty, setContentDirty] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const spec = contentSpecOverride ?? baseSpec;

  const [query, setQuery] = useState("");
  const filteredNames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return names;
    }
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [names, query]);

  const [bottomTab, setBottomTab] = useState<BottomTab>("controls");
  const [panelHeight, setPanelHeight] = useState(280);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const schemaJson = useMemo(() => {
    if (!propsSchema) {
      return "{\n  \"message\": \"No schema available\"\n}";
    }
    return toPrettyJson(propsSchema);
  }, [propsSchema]);

  useEffect(() => {
    setContentSpecOverride(null);
    setContentText(toPrettyJson(baseSpec));
    setContentDirty(false);
    setContentError(null);
  }, [selected, baseSpec]);

  useEffect(() => {
    if (contentSpecOverride !== null) {
      return;
    }
    if (contentDirty) {
      return;
    }
    setContentText(toPrettyJson(baseSpec));
  }, [baseSpec, contentDirty, contentSpecOverride]);

  const onResizeMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d) {
      return;
    }
    const delta = d.startY - e.clientY;
    const next = Math.min(
      Math.max(d.startH + delta, 120),
      Math.floor(window.innerHeight * 0.65),
    );
    setPanelHeight(next);
  }, []);

  const onResizeEnd = useCallback(() => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEnd);
  }, [onResizeMove]);

  const onResizeStart = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: panelHeight };
      document.addEventListener("mousemove", onResizeMove);
      document.addEventListener("mouseup", onResizeEnd);
    },
    [panelHeight, onResizeMove, onResizeEnd],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onResizeMove);
      document.removeEventListener("mouseup", onResizeEnd);
    };
  }, [onResizeMove, onResizeEnd]);

  const selectComponent = useCallback(
    (name: string) => {
      setSelected(name);
      onComponentChange?.(name);
    },
    [onComponentChange],
  );

  return (
    <div className={[css.root, className].filter(Boolean).join(" ")}>
      <div className={css.body}>
        <aside className={css.sidebar}>
          <div className={css.sidebarHeader}>Components</div>
          <input
            type="search"
            className={css.search}
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter components"
          />
          <nav className={css.nav} aria-label="Component list">
            {filteredNames.map((name) => (
              <button
                key={name}
                type="button"
                className={
                  name === selected
                    ? `${css.navItem} ${css.navItemActive}`
                    : css.navItem
                }
                onClick={() => selectComponent(name)}
              >
                {name}
              </button>
            ))}
          </nav>
        </aside>

        <div className={css.main}>
          <div className={css.toolbar}>
            <span className={css.toolbarTitle}>{selected || "—"}</span>
          </div>

          <div
            className={css.canvas}
            style={{ flex: 1, minHeight: 0 }}
          >
            <div className={css.artboard}>
              {selected ? (
                <PreviewMountHost
                  key={selected}
                  preview={preview}
                  spec={spec}
                  registry={registry}
                />
              ) : (
                <div className={css.emptyCanvas}>No components in catalog.</div>
              )}
            </div>
          </div>

          <div className={css.bottom} style={{ height: panelHeight }}>
            <button
              type="button"
              className={css.resizeHandle}
              aria-label="Resize controls panel"
              onMouseDown={onResizeStart}
            />
            <div className={css.bottomHeaderRow}>
              <div className={css.bottomHeader}>Inspector</div>
              <div className={css.segmented}>
                <button
                  type="button"
                  className={
                    bottomTab === "controls"
                      ? `${css.segmentedBtn} ${css.segmentedBtnActive}`
                      : css.segmentedBtn
                  }
                  onClick={() => setBottomTab("controls")}
                >
                  Controls
                </button>
                <button
                  type="button"
                  className={
                    bottomTab === "schema"
                      ? `${css.segmentedBtn} ${css.segmentedBtnActive}`
                      : css.segmentedBtn
                  }
                  onClick={() => setBottomTab("schema")}
                >
                  Schema
                </button>
                <button
                  type="button"
                  className={
                    bottomTab === "content"
                      ? `${css.segmentedBtn} ${css.segmentedBtnActive}`
                      : css.segmentedBtn
                  }
                  onClick={() => setBottomTab("content")}
                >
                  Content JSON
                </button>
              </div>
            </div>
            {bottomTab === "controls" ? (
              <ControlsPanel
                formKey={selected}
                fields={fields}
                values={propValues}
                parseError={parseError}
                parseIssues={parseIssues}
                onChange={(key, value) => {
                  setPropValues((prev) => ({ ...prev, [key]: value }));
                }}
              />
            ) : null}
            {bottomTab === "schema" ? (
              <div className={css.codePanelWrap}>
                <pre className={css.codePanel}>{schemaJson}</pre>
              </div>
            ) : null}
            {bottomTab === "content" ? (
              <div className={css.codePanelWrap}>
                <div className={css.codePanelActions}>
                  <button
                    type="button"
                    className={css.btnSecondary}
                    onClick={() => {
                      const trimmed = contentText.trim();
                      if (!trimmed) {
                        setContentSpecOverride(null);
                        setContentText(toPrettyJson(baseSpec));
                        setContentDirty(false);
                        setContentError(null);
                        return;
                      }
                      try {
                        const parsed = JSON.parse(trimmed) as unknown;
                        const validation = validateCatalogSpec(parsed, selected);
                        if (!validation.ok) {
                          setContentError(validation.error);
                          return;
                        }
                        setContentSpecOverride(validation.spec);
                        setPropValues(getPreviewPropsFromSpec(validation.spec));
                        setContentText(toPrettyJson(validation.spec));
                        setContentDirty(false);
                        setContentError(null);
                      } catch {
                        setContentError("Invalid JSON");
                      }
                    }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className={css.btnSecondary}
                    onClick={() => {
                      setContentSpecOverride(null);
                      setContentText(toPrettyJson(baseSpec));
                      setContentDirty(false);
                      setContentError(null);
                    }}
                  >
                    Reset
                  </button>
                  <span className={css.codePanelMeta}>
                    {contentSpecOverride !== null
                      ? "Using manual JSON override"
                      : "Using generated content JSON"}
                  </span>
                </div>
                <textarea
                  className={`${css.textarea} ${css.codePanelTextarea}`}
                  value={contentText}
                  spellCheck={false}
                  onChange={(e) => {
                    setContentText(e.target.value);
                    setContentDirty(true);
                    setContentError(null);
                  }}
                />
                {contentError ? (
                  <div className={css.jsonFieldError} role="alert">
                    {contentError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use `PalletteCatalog` */
export const JsonRenderCatalog = PalletteCatalog;
/** @deprecated Use `PalletteCatalogProps` */
export type JsonRenderCatalogProps = PalletteCatalogProps;
