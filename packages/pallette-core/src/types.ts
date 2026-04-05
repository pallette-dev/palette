import type { z } from "zod";

export type PalletteCatalogComponent = {
  props: z.ZodType;
  description?: string;
  slots?: ReadonlyArray<string>;
  /**
   * Optional sample props from the catalog definition (json-render `example`).
   * When present, matching keys override introspected / Zod defaults before validation.
   */
  example?: Record<string, unknown>;
};

export type PalletteCatalogComponents = Record<string, PalletteCatalogComponent>;

/** @deprecated Use PalletteCatalogComponent */
export type JsonRenderCatalogComponent = PalletteCatalogComponent;
/** @deprecated Use PalletteCatalogComponents */
export type JsonRenderCatalogComponents = PalletteCatalogComponents;

export type ControlKind = "string" | "number" | "boolean" | "enum" | "json";

export type ControlField = {
  key: string;
  kind: ControlKind;
  required: boolean;
  allowsNull: boolean;
  enumValues?: string[];
  defaultValue: unknown;
  validExampleHint: string;
  zodTypeHint: string;
  schema?: z.ZodType;
};
