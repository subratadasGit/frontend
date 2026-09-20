import { useCallback, useEffect, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  OptionGroup,
  PaneLabel,
  RangeField,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { RANDOM_FIELDS, generateRandomData } from "../../../devtools/transforms/text";
import { jsonToCsv } from "../../../devtools/transforms/data";

const FORMATS = [
  { id: "json", label: "JSON" },
  { id: "csv", label: "CSV" },
  { id: "sql", label: "SQL" },
];

const DEFAULT_FIELDS = ["id", "fullName", "email", "city", "age"];

/** Plausible fake rows for seeding a UI, a fixture or a demo. */
export default function RandomDataGenerator({ toolId }) {
  const [count, setCount] = useState(10);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [format, setFormat] = useState("json");
  const [output, setOutput] = useState("");

  const generate = useCallback(() => {
    const rows = generateRandomData({ count, fields });
    if (format === "csv") {
      setOutput(jsonToCsv(JSON.stringify(rows)));
      return;
    }
    if (format === "sql") {
      const columns = fields.join(", ");
      const values = rows
        .map(
          (row) =>
            `INSERT INTO records (${columns}) VALUES (${fields
              .map((field) => {
                const value = row[field];
                if (typeof value === "number") return value;
                if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
                return `'${String(value).replace(/'/g, "''")}'`;
              })
              .join(", ")});`,
        )
        .join("\n");
      setOutput(values);
      return;
    }
    setOutput(JSON.stringify(rows, null, 2));
  }, [count, fields, format]);

  useEffect(() => {
    generate();
  }, [generate]);

  const toggleField = (field) =>
    setFields((current) =>
      current.includes(field) ? current.filter((entry) => entry !== field) : [...current, field],
    );

  const extension = format === "csv" ? "csv" : format === "sql" ? "sql" : "json";

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Options</PaneLabel>
          <div className="space-y-5">
            <RangeField label="Rows" value={count} onChange={setCount} min={1} max={200} />
            <OptionGroup label="Format" options={FORMATS} value={format} onChange={setFormat} />

            <div>
              <span className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
                Fields ({fields.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RANDOM_FIELDS.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    aria-pressed={fields.includes(field)}
                    className={`border px-2.5 py-1.5 font-mono text-[0.625rem] transition-colors ${
                      fields.includes(field)
                        ? "border-[#ff4d1c] text-[#ff4d1c]"
                        : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            <Btn onClick={generate} disabled={fields.length === 0} className="w-full">
              Regenerate
            </Btn>

            <ToolNote>
              Names, emails and domains come from a fixed sample list using
              reserved example domains, so nothing generated here collides with
              a real address.
            </ToolNote>
          </div>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <CopyButton value={output} label="Copy" />
                <DownloadButton value={output} filename={`sample-data.${extension}`} />
              </div>
            }
          >
            Output
          </PaneLabel>
          {fields.length === 0 ? (
            <ToolNote>Select at least one field.</ToolNote>
          ) : (
            <CodeField value={output} readOnly ariaLabel="Generated data" rows={20} />
          )}
        </Panel>
      </div>

      <RelatedTools ids={["lorem-generator", "uuid-generator", "json-to-csv"]} />
    </DevToolPage>
  );
}
