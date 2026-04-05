import type { z } from "zod";
import type { ControlField, ControlKind } from "../types";

type SomeZod = z.ZodType;

function resolveDefault(def: unknown): unknown {
  if (typeof def === "function") {
    return (def as () => unknown)();
  }
  return def;
}

/** Strip wrappers and return inner schema + flags. */
export function unwrapZodSchema(schema: SomeZod): {
  inner: SomeZod;
  optional: boolean;
  nullable: boolean;
  defaultValue: unknown | undefined;
} {
  let current: SomeZod = schema;
  let optional = false;
  let nullable = false;
  let defaultValue: unknown | undefined;

  while (true) {
    const t = current.def.type;
    if (t === "optional") {
      optional = true;
      current = (current as z.ZodOptional<SomeZod>).unwrap();
      continue;
    }
    if (t === "nullable") {
      nullable = true;
      current = (current as z.ZodNullable<SomeZod>).unwrap();
      continue;
    }
    if (t === "default") {
      const d = current.def as unknown as { defaultValue: unknown };
      defaultValue = resolveDefault(d.defaultValue);
      current = (current as z.ZodDefault<SomeZod>).unwrap();
      continue;
    }
    if (t === "prefault") {
      const d = current.def as unknown as { defaultValue: unknown };
      defaultValue = resolveDefault(d.defaultValue);
      current = (current as z.ZodPrefault<SomeZod>).unwrap();
      continue;
    }
    if (t === "catch") {
      current = (current as z.ZodCatch<SomeZod>).unwrap();
      continue;
    }
    if (t === "readonly") {
      current = (current as z.ZodReadonly<SomeZod>).unwrap();
      continue;
    }
    if (t === "pipe") {
      const pipe = current as z.ZodPipe<SomeZod, SomeZod>;
      current = pipe.def.out;
      continue;
    }
    if (t === "lazy") {
      current = (current as z.ZodLazy<SomeZod>).unwrap();
      continue;
    }
    break;
  }

  return { inner: current, optional, nullable, defaultValue };
}

function unionStringLiterals(inner: SomeZod): string[] | null {
  if (inner.def.type !== "union") {
    return null;
  }
  const u = inner as z.ZodUnion<readonly SomeZod[]>;
  const opts = u.options;
  const out: string[] = [];
  for (const opt of opts) {
    const { inner: leaf } = unwrapZodSchema(opt);
    if (leaf.def.type === "literal") {
      const lit = leaf as z.ZodLiteral;
      const v = [...lit.values][0];
      if (typeof v === "string") {
        out.push(v);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  return out.length > 0 ? out : null;
}

function classifyInner(inner: SomeZod): {
  kind: ControlKind;
  enumValues?: string[];
} {
  const t = inner.def.type;

  if (t === "string") {
    return { kind: "string" };
  }
  if (t === "number" || t === "int") {
    return { kind: "number" };
  }
  if (t === "boolean") {
    return { kind: "boolean" };
  }
  if (t === "enum") {
    const e = inner as z.ZodEnum<Record<string, string>>;
    const opts = e.options.filter((x): x is string => typeof x === "string");
    return { kind: "enum", enumValues: opts };
  }
  if (t === "literal") {
    const lit = inner as z.ZodLiteral;
    const v = [...lit.values][0];
    if (typeof v === "string") {
      return { kind: "enum", enumValues: [v] };
    }
  }
  const unionStrings = unionStringLiterals(inner);
  if (unionStrings) {
    return { kind: "enum", enumValues: unionStrings };
  }

  return { kind: "json" };
}

export function isZodObject(schema: SomeZod): schema is z.ZodObject {
  return schema.def.type === "object";
}

const MAX_EXAMPLE_DEPTH = 10;
const MAX_HINT_LEN = 200;
const MAX_OBJECT_KEYS_FOR_HINT = 14;

function truncateHint(s: string): string {
  if (s.length <= MAX_HINT_LEN) {
    return s;
  }
  return `${s.slice(0, MAX_HINT_LEN - 1)}…`;
}

/** Minimal value that illustrates the schema (defaults win; optional object keys omitted). */
export function buildValidExampleSample(schema: SomeZod, depth: number): unknown {
  if (depth > MAX_EXAMPLE_DEPTH) {
    return null;
  }
  const { inner, defaultValue } = unwrapZodSchema(schema);
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  const t = inner.def.type;
  switch (t) {
    case "string":
      return "text";
    case "number":
      return 0;
    case "int":
      return 0;
    case "bigint":
      return 0;
    case "boolean":
      return true;
    case "null":
      return null;
    case "undefined":
      return null;
    case "void":
      return null;
    case "nan":
      return null;
    case "date":
      return "1970-01-01T00:00:00.000Z";
    case "symbol":
      return "symbol";
    case "any":
    case "unknown":
      return null;
    case "never":
      return null;
    case "enum": {
      const opts = (inner as z.ZodEnum<Record<string, string>>).options;
      const first = opts[0];
      return typeof first === "string" ? first : null;
    }
    case "literal": {
      const lit = inner as z.ZodLiteral;
      const v = [...lit.values][0];
      return v;
    }
    case "array": {
      const el = (inner as z.ZodArray<SomeZod>).element as SomeZod;
      const one = buildValidExampleSample(el, depth + 1);
      return [one];
    }
    case "object": {
      const shape = (inner as z.ZodObject).shape as Record<string, SomeZod | undefined>;
      const out: Record<string, unknown> = {};
      const keys = Object.keys(shape).sort((a, b) => a.localeCompare(b));
      let n = 0;
      for (const key of keys) {
        if (n >= MAX_OBJECT_KEYS_FOR_HINT) {
          break;
        }
        const fs = shape[key];
        if (!fs) {
          continue;
        }
        const u = unwrapZodSchema(fs);
        if (u.optional && u.defaultValue === undefined) {
          continue;
        }
        out[key] = buildValidExampleSample(fs, depth + 1);
        n++;
      }
      return out;
    }
    case "record": {
      const rec = inner as z.ZodRecord;
      const vt = rec.valueType as SomeZod;
      return { key: buildValidExampleSample(vt, depth + 1) };
    }
    case "tuple": {
      const def = inner.def as unknown as { items?: readonly SomeZod[] };
      const items = def.items ?? [];
      return items.map((it) => buildValidExampleSample(it, depth + 1));
    }
    case "union": {
      const opts =
        ((inner as unknown) as { options?: readonly SomeZod[] }).options ?? [];
      for (const opt of opts) {
        const s = buildValidExampleSample(opt, depth + 1);
        if (s !== undefined) {
          return s;
        }
      }
      return null;
    }
    case "intersection": {
      const def = inner.def as unknown as { left: SomeZod; right: SomeZod };
      const a = buildValidExampleSample(def.left, depth + 1);
      const b = buildValidExampleSample(def.right, depth + 1);
      if (
        a !== null &&
        typeof a === "object" &&
        !Array.isArray(a) &&
        b !== null &&
        typeof b === "object" &&
        !Array.isArray(b)
      ) {
        return { ...a, ...b };
      }
      return a ?? b ?? null;
    }
    case "map": {
      const def = inner.def as unknown as {
        keyType: SomeZod;
        valueType: SomeZod;
      };
      return [
        [
          buildValidExampleSample(def.keyType, depth + 1),
          buildValidExampleSample(def.valueType, depth + 1),
        ],
      ];
    }
    case "set": {
      const def = inner.def as unknown as { valueType: SomeZod };
      return [buildValidExampleSample(def.valueType, depth + 1)];
    }
    case "lazy": {
      try {
        const lz = inner as z.ZodLazy<SomeZod>;
        return buildValidExampleSample(lz.unwrap() as SomeZod, depth + 1);
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

function formatValidExampleHint(kind: ControlKind, sample: unknown, enumValues?: string[]): string {
  if (kind === "boolean") {
    return sample === false ? "false" : "true";
  }
  if (kind === "number") {
    return String(typeof sample === "number" && !Number.isNaN(sample) ? sample : 0);
  }
  if (kind === "string") {
    return JSON.stringify(typeof sample === "string" ? sample : "text");
  }
  if (kind === "enum") {
    const v = enumValues?.[0];
    return v !== undefined ? JSON.stringify(v) : "…";
  }
  try {
    return truncateHint(JSON.stringify(sample));
  } catch {
    return truncateHint(String(sample));
  }
}

const MAX_TYPE_HINT_DEPTH = 2;
const MAX_OBJECT_KEYS_FOR_TYPE_HINT = 4;

function stripUndefinedUnion(typeHint: string): string {
  return typeHint
    .replace(/\s*\|\s*undefined\b/g, "")
    .replace(/\bundefined\s*\|\s*/g, "")
    .trim();
}

function describeObjectMemberType(key: string, schema: SomeZod, depth: number): string {
  const { optional } = unwrapZodSchema(schema);
  const childType = stripUndefinedUnion(describeTypeHint(schema, depth + 1));
  return `${key}${optional ? "?" : ""}: ${childType}`;
}

function describeInnerType(schema: SomeZod, depth: number): string {
  if (depth > MAX_TYPE_HINT_DEPTH) {
    return "…";
  }
  const { inner } = unwrapZodSchema(schema);
  const t = inner.def.type;
  switch (t) {
    case "string":
      return "string";
    case "number":
    case "int":
      return "number";
    case "boolean":
      return "boolean";
    case "enum": {
      const opts = (inner as z.ZodEnum<Record<string, string>>).options;
      return opts.map((x) => JSON.stringify(x)).join(" | ");
    }
    case "literal": {
      const lit = inner as z.ZodLiteral;
      const v = [...lit.values][0];
      return JSON.stringify(v);
    }
    case "array": {
      const el = (inner as z.ZodArray<SomeZod>).element as SomeZod;
      return `${describeInnerType(el, depth + 1)}[]`;
    }
    case "object": {
      if (depth >= MAX_TYPE_HINT_DEPTH) {
        return "Record<string, unknown>";
      }
      const shape = (inner as z.ZodObject).shape as Record<string, SomeZod>;
      const keys = Object.keys(shape)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, MAX_OBJECT_KEYS_FOR_TYPE_HINT);
      const members = keys.map((key) => {
        const child = shape[key];
        return child
          ? describeObjectMemberType(key, child, depth)
          : `${key}: unknown`;
      });
      const truncated = Object.keys(shape).length > keys.length ? "; …" : "";
      return `{ ${members.join("; ")}${truncated} }`;
    }
    case "union": {
      const opts =
        ((inner as unknown) as { options?: readonly SomeZod[] }).options ?? [];
      const parts = opts.slice(0, 3).map((opt) => describeTypeHint(opt, depth + 1));
      if (opts.length > 3) {
        parts.push("…");
      }
      return parts.join(" | ");
    }
    case "tuple":
      return "[...]";
    case "record": {
      const rec = inner as z.ZodRecord;
      const valueType = (rec.valueType as SomeZod) ?? null;
      return valueType
        ? `Record<string, ${describeTypeHint(valueType, depth + 1)}>`
        : "Record<string, unknown>";
    }
    case "date":
      return "date";
    case "unknown":
    case "any":
      return "any";
    default:
      return "unknown";
  }
}

function describeTypeHint(schema: SomeZod, depth: number): string {
  const { optional, nullable } = unwrapZodSchema(schema);
  let out = describeInnerType(schema, depth);
  if (nullable) {
    out = `${out} | null`;
  }
  if (optional) {
    out = `${out} | undefined`;
  }
  return truncateHint(out);
}

export function introspectPropsSchema(propsSchema: SomeZod): ControlField[] {
  const { inner } = unwrapZodSchema(propsSchema);
  if (!isZodObject(inner)) {
    const { defaultValue: rootSchemaDefault } = unwrapZodSchema(propsSchema);
    const sample = buildValidExampleSample(propsSchema, 0);
    const defaultValue =
      rootSchemaDefault !== undefined
        ? rootSchemaDefault
        : sample !== null
          ? sample
          : {};
    const hintSample =
      rootSchemaDefault !== undefined ? rootSchemaDefault : sample;
    return [
      {
        key: "props",
        kind: "json",
        required: true,
        allowsNull: false,
        defaultValue,
        validExampleHint: formatValidExampleHint("json", hintSample, undefined),
        zodTypeHint: describeTypeHint(propsSchema, 0),
        schema: propsSchema,
      },
    ];
  }

  const shape = inner.shape as Record<string, SomeZod>;
  const keys = Object.keys(shape).sort((a, b) => a.localeCompare(b));
  const fields: ControlField[] = [];

  for (const key of keys) {
    const fieldSchema = shape[key];
    if (!fieldSchema) {
      continue;
    }
    const { inner: base, optional, nullable, defaultValue: schemaDefault } =
      unwrapZodSchema(fieldSchema);
    const { kind, enumValues } = classifyInner(base);
    const sample = buildValidExampleSample(fieldSchema, 0);
    const defaultValue =
      schemaDefault !== undefined ? schemaDefault : sample;
    const hintSample =
      schemaDefault !== undefined ? schemaDefault : sample;
    const validExampleHint = formatValidExampleHint(kind, hintSample, enumValues);

    fields.push({
      key,
      kind,
      required: !optional && !nullable && schemaDefault === undefined,
      allowsNull: nullable,
      enumValues,
      defaultValue,
      validExampleHint,
      zodTypeHint: describeTypeHint(fieldSchema, 0),
      schema: fieldSchema,
    });
  }

  return fields;
}
