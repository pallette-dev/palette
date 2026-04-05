import { useEffect, useMemo, useState } from "react";
import {
  buildValidExampleSample,
  unwrapZodSchema,
  type ControlField,
} from "@pallette/core";
import type { z } from "zod";
import css from "./PalletteCatalog.module.css";

export type ControlsPanelProps = {
  fields: ControlField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  parseError: string | null;
  parseIssues?: Array<{ path: string; message: string }>;
  formKey: string;
};

function formatJson(value: unknown): string {
  if (value === undefined) {
    return "";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function JsonPropInput({
  fieldKey,
  formKey,
  value,
  required,
  onCommit,
}: {
  fieldKey: string;
  formKey: string;
  value: unknown;
  required: boolean;
  onCommit: (v: unknown) => void;
}) {
  const [text, setText] = useState(() => formatJson(value));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setText(formatJson(value));
    setErr(null);
  }, [formKey, fieldKey, value]);

  return (
    <div className={css.jsonField}>
      <textarea
        id={`jrc-${fieldKey}`}
        className={css.textarea}
        rows={4}
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setErr(null);
        }}
        onBlur={(e) => {
          const raw = e.currentTarget.value;
          const t = raw.trim();
          if (t === "" && !required) {
            onCommit(undefined);
            setText("");
            setErr(null);
            return;
          }
          try {
            const parsed = JSON.parse(t) as unknown;
            onCommit(parsed);
            setText(formatJson(parsed));
            setErr(null);
          } catch {
            setErr("Invalid JSON");
          }
        }}
      />
      {err ? (
        <span className={css.jsonFieldError} role="alert">
          {err}
        </span>
      ) : null}
    </div>
  );
}

function classifySchema(schema: z.ZodType): {
  kind: "string" | "number" | "boolean" | "enum" | "object" | "array" | "unknown";
  enumValues?: string[];
  inner: z.ZodType;
  allowsNull: boolean;
} {
  const { inner, nullable } = unwrapZodSchema(schema);
  const t = inner.def.type;
  if (t === "string") return { kind: "string", inner, allowsNull: nullable };
  if (t === "number" || t === "int") return { kind: "number", inner, allowsNull: nullable };
  if (t === "boolean") return { kind: "boolean", inner, allowsNull: nullable };
  if (t === "enum") {
    const opts = (inner as z.ZodEnum<Record<string, string>>).options;
    return { kind: "enum", inner, allowsNull: nullable, enumValues: [...opts] };
  }
  if (t === "literal") {
    const lit = inner as z.ZodLiteral;
    const value = [...lit.values][0];
    if (typeof value === "string") {
      return { kind: "enum", inner, allowsNull: nullable, enumValues: [value] };
    }
  }
  if (t === "object") return { kind: "object", inner, allowsNull: nullable };
  if (t === "array") return { kind: "array", inner, allowsNull: nullable };
  return { kind: "unknown", inner, allowsNull: nullable };
}

function issueForPath(issues: Map<string, string>, path: string): string | null {
  return issues.get(path) ?? null;
}

function setObjectKey(
  source: unknown,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const base =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as Record<string, unknown>)
      : {};
  return { ...base, [key]: value };
}

function StructuredValueEditor({
  schema,
  value,
  onChange,
  path,
  issueMap,
}: {
  schema: z.ZodType;
  value: unknown;
  onChange: (next: unknown) => void;
  path: string;
  issueMap: Map<string, string>;
}) {
  const classified = classifySchema(schema);
  const error = issueForPath(issueMap, path);

  if (classified.kind === "string") {
    return (
      <>
        <input
          className={css.input}
          type="text"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </>
    );
  }

  if (classified.kind === "number") {
    return (
      <>
        <input
          className={css.input}
          type="number"
          value={value === undefined || value === null ? "" : Number(value)}
          onChange={(e) => {
            if (e.target.value === "") {
              onChange(undefined);
              return;
            }
            const n = Number(e.target.value);
            onChange(Number.isNaN(n) ? 0 : n);
          }}
        />
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </>
    );
  }

  if (classified.kind === "boolean") {
    return (
      <>
        <input
          className={css.checkbox}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </>
    );
  }

  if (classified.kind === "enum" && classified.enumValues) {
    return (
      <>
        <select
          className={css.select}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        >
          <option value="">—</option>
          {classified.enumValues.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </>
    );
  }

  if (classified.kind === "object") {
    const shape = (classified.inner as z.ZodObject).shape as Record<string, z.ZodType>;
    const keys = Object.keys(shape).sort((a, b) => a.localeCompare(b));
    const current = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return (
      <div className={css.objectEditor}>
        {keys.map((key) => {
          const childSchema = shape[key];
          if (!childSchema) {
            return null;
          }
          const childPath = path ? `${path}.${key}` : key;
          return (
            <div key={childPath} className={css.objectRow}>
              <label className={css.objectRowLabel}>{key}</label>
              <div className={css.objectRowValue}>
                <StructuredValueEditor
                  schema={childSchema}
                  value={(current as Record<string, unknown>)[key]}
                  path={childPath}
                  issueMap={issueMap}
                  onChange={(next) => onChange(setObjectKey(current, key, next))}
                />
              </div>
            </div>
          );
        })}
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </div>
    );
  }

  if (classified.kind === "array") {
    const elementSchema = (classified.inner as z.ZodArray<z.ZodType>).element as z.ZodType;
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className={css.arrayEditor}>
        {arr.map((item, index) => (
          <div key={`${path}.${index}`} className={css.arrayItem}>
            <div className={css.arrayItemHeader}>
              <span className={css.arrayItemTitle}>Item {index + 1}</span>
              <button
                type="button"
                className={css.btnSecondary}
                onClick={() => {
                  const nextArr = arr.slice();
                  nextArr.splice(index, 1);
                  onChange(nextArr);
                }}
              >
                Remove
              </button>
            </div>
            <div className={css.arrayItemBody}>
              <StructuredValueEditor
                schema={elementSchema}
                value={item}
                path={`${path}.${index}`}
                issueMap={issueMap}
                onChange={(next) => {
                  const nextArr = arr.slice();
                  nextArr[index] = next;
                  onChange(nextArr);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className={css.btnSecondary}
          onClick={() => {
            const sample = buildValidExampleSample(elementSchema, 0);
            onChange([...arr, sample]);
          }}
        >
          Add item
        </button>
        {error ? <div className={css.jsonFieldError}>{error}</div> : null}
      </div>
    );
  }

  return (
    <>
      <JsonPropInput
        fieldKey={path}
        formKey={path}
        value={value}
        required={false}
        onCommit={onChange}
      />
      {error ? <div className={css.jsonFieldError}>{error}</div> : null}
    </>
  );
}

function JsonObjectInput({
  field,
  value,
  formKey,
  issues,
  onCommit,
}: {
  field: ControlField;
  value: unknown;
  formKey: string;
  issues: Map<string, string>;
  onCommit: (value: unknown) => void;
}) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const schema = field.schema;
  const classified = schema ? classifySchema(schema) : null;
  const supportsForm = classified?.kind === "object" || classified?.kind === "array";

  useEffect(() => {
    setMode("form");
  }, [formKey, field.key]);

  if (!schema || !supportsForm) {
    return (
      <JsonPropInput
        fieldKey={field.key}
        formKey={formKey}
        value={value}
        required={field.required}
        onCommit={onCommit}
      />
    );
  }

  return (
    <div className={css.jsonField}>
      <div className={css.segmented}>
        <button
          type="button"
          className={
            mode === "form"
              ? `${css.segmentedBtn} ${css.segmentedBtnActive}`
              : css.segmentedBtn
          }
          onClick={() => setMode("form")}
        >
          Form
        </button>
        <button
          type="button"
          className={
            mode === "json"
              ? `${css.segmentedBtn} ${css.segmentedBtnActive}`
              : css.segmentedBtn
          }
          onClick={() => setMode("json")}
        >
          JSON
        </button>
      </div>
      {mode === "form" ? (
        <StructuredValueEditor
          schema={schema}
          value={value}
          onChange={onCommit}
          path={field.key}
          issueMap={issues}
        />
      ) : (
        <JsonPropInput
          fieldKey={field.key}
          formKey={formKey}
          value={value}
          required={field.required}
          onCommit={onCommit}
        />
      )}
    </div>
  );
}

export function ControlsPanel({
  fields,
  values,
  onChange,
  parseError,
  parseIssues = [],
  formKey,
}: ControlsPanelProps) {
  const issueMap = useMemo(() => {
    const out = new Map<string, string>();
    for (const issue of parseIssues) {
      if (!issue.path) continue;
      if (!out.has(issue.path)) out.set(issue.path, issue.message);
    }
    return out;
  }, [parseIssues]);

  if (fields.length === 0) {
    return (
      <div className={css.controlsEmpty}>
        No props defined for this component.
      </div>
    );
  }

  return (
    <div className={css.controlsScroll}>
      {parseError ? (
        <div className={css.controlsError} role="alert">
          {parseError}
        </div>
      ) : null}
      <div className={css.controlsGrid}>
        {fields.map((field) => (
          <div key={field.key} className={css.controlRow}>
            <div className={css.controlLabelCell}>
              <label className={css.controlLabel} htmlFor={`jrc-${field.key}`}>
                {field.key}
                {field.required ? (
                  <span className={css.required} title="Required">
                    *
                  </span>
                ) : null}
              </label>
              <div className={css.controlHint} title="Zod schema type for this prop">
                type{" "}
                <code className={`${css.controlHintCode} ${css.controlHintTypeCode}`}>
                  {field.zodTypeHint}
                </code>
              </div>
            </div>
            <div className={css.controlInput}>
              {field.kind === "string" ? (
                <input
                  id={`jrc-${field.key}`}
                  className={css.input}
                  type="text"
                  value={
                    values[field.key] === undefined || values[field.key] === null
                      ? ""
                      : String(values[field.key])
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" && (!field.required || field.allowsNull)) {
                      onChange(field.key, field.allowsNull ? null : undefined);
                    } else {
                      onChange(field.key, v);
                    }
                  }}
                />
              ) : null}
              {field.kind === "number" ? (
                <input
                  id={`jrc-${field.key}`}
                  className={css.input}
                  type="number"
                  value={
                    values[field.key] === undefined || values[field.key] === null
                      ? ""
                      : Number(values[field.key])
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "" && !field.required) {
                      onChange(field.key, undefined);
                      return;
                    }
                    const n = Number(raw);
                    onChange(field.key, Number.isNaN(n) ? 0 : n);
                  }}
                />
              ) : null}
              {field.kind === "boolean" ? (
                <input
                  id={`jrc-${field.key}`}
                  className={css.checkbox}
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
              ) : null}
              {field.kind === "enum" && field.enumValues ? (
                <select
                  id={`jrc-${field.key}`}
                  className={css.select}
                  value={
                    values[field.key] === undefined || values[field.key] === null
                      ? ""
                      : String(values[field.key])
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" && (!field.required || field.allowsNull)) {
                      onChange(field.key, field.allowsNull ? null : undefined);
                    } else {
                      onChange(field.key, v);
                    }
                  }}
                >
                  {!field.required || field.allowsNull ? (
                    <option value="">—</option>
                  ) : null}
                  {field.enumValues.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : null}
              {field.kind === "json" ? (
                <JsonObjectInput
                  field={field}
                  formKey={formKey}
                  value={values[field.key]}
                  issues={issueMap}
                  onCommit={(next) => onChange(field.key, next)}
                />
              ) : null}
              {issueMap.get(field.key) ? (
                <div className={css.jsonFieldError}>{issueMap.get(field.key)}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
