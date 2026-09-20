import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { parseJson } from "../../../devtools/transforms/json";
import { SUPPORTED_KEYWORDS, validateAgainstSchema } from "../../../devtools/transforms/schema";

const SAMPLE_SCHEMA = JSON.stringify(
  {
    type: "object",
    required: ["id", "email"],
    properties: {
      id: { type: "integer", minimum: 1 },
      email: { type: "string", format: "email" },
      age: { type: "integer", minimum: 0, maximum: 130 },
      tags: { type: "array", items: { type: "string" }, uniqueItems: true },
    },
    additionalProperties: false,
  },
  null,
  2,
);

const SAMPLE_DATA = JSON.stringify(
  { id: 0, email: "not-an-email", age: 200, tags: ["a", "a"], extra: true },
  null,
  2,
);

/** Validates a document against a JSON Schema, listing every failing rule. */
export default function JsonSchemaValidator({ toolId }) {
  const [schemaText, setSchemaText] = useState(SAMPLE_SCHEMA);
  const [dataText, setDataText] = useState(SAMPLE_DATA);

  const result = useMemo(() => {
    if (!schemaText.trim() || !dataText.trim()) return null;

    let schema;
    try {
      schema = parseJson(schemaText);
    } catch (caught) {
      return { schemaError: { message: `Schema: ${caught.message}`, line: caught.line, column: caught.column, hint: caught.hint } };
    }

    let data;
    try {
      data = parseJson(dataText);
    } catch (caught) {
      return { dataError: { message: `Document: ${caught.message}`, line: caught.line, column: caught.column, hint: caught.hint } };
    }

    try {
      return { errors: validateAgainstSchema(data, schema) };
    } catch (caught) {
      return { schemaError: { message: caught.message } };
    }
  }, [schemaText, dataText]);

  const errors = result?.errors;
  const asText = (errors || []).map((entry) => `${entry.path} — ${entry.message}`).join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setSchemaText} />}>Schema</PaneLabel>
          <CodeField
            value={schemaText}
            onChange={setSchemaText}
            ariaLabel="JSON Schema"
            errorLine={result?.schemaError?.line}
            rows={16}
          />
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setDataText} />}>Document</PaneLabel>
          <CodeField
            value={dataText}
            onChange={setDataText}
            ariaLabel="Document to validate"
            errorLine={result?.dataError?.line}
            rows={16}
          />
        </Panel>
      </div>

      <Panel className="mt-4">
        <PaneLabel
          right={errors?.length ? <CopyButton value={asText} label="Copy errors" /> : null}
        >
          Result
        </PaneLabel>

        <ToolErrorPanel error={result?.schemaError || result?.dataError} />

        {errors && errors.length === 0 ? (
          <div className="border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
            The document is valid against this schema.
          </div>
        ) : null}

        {errors && errors.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-white/60" aria-live="polite">
              {errors.length} validation error{errors.length === 1 ? "" : "s"}.
            </p>
            <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
              {errors.map((entry, index) => (
                <li key={`${entry.path}-${index}`} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <code className="shrink-0 font-mono text-xs break-all text-[#ff4d1c] sm:w-56">
                    {entry.path}
                  </code>
                  <span className="min-w-0 flex-1 text-sm text-white/75">{entry.message}</span>
                  <span className="shrink-0 font-mono text-[0.5625rem] tracking-[0.14em] text-white/30 uppercase">
                    {entry.keyword}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-4">
          <ToolNote>
            Supported keywords: {SUPPORTED_KEYWORDS.join(", ")}. External{" "}
            <code>$ref</code>, <code>if</code>/<code>then</code>/<code>else</code>{" "}
            and <code>dependentSchemas</code> are not evaluated.
          </ToolNote>
        </div>
      </Panel>

      <RelatedTools ids={["json-formatter", "json-to-zod", "jsonpath-tester"]} />
    </DevToolPage>
  );
}
