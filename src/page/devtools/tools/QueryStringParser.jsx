import { useMemo, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
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
import { CrossIcon } from "../../../components/Icon";
import { buildQueryString, parseQueryString } from "../../../devtools/transforms/dev";

/** Expands a query string into editable pairs and rebuilds it. */
export default function QueryStringParser({ toolId }) {
  const [input, setInput] = useState("?q=hello+world&page=2&tags=a&tags=b&empty=");
  const [rows, setRows] = useState(null);

  const parsed = useMemo(() => {
    if (!input.trim()) return { entries: [], error: null };
    try {
      return { entries: parseQueryString(input), error: null };
    } catch (caught) {
      return { entries: [], error: { message: caught.message } };
    }
  }, [input]);

  // The editable rows start from the parse, then become independent once
  // touched, so typing in the table does not fight the source field.
  const entries = rows ?? parsed.entries;

  const rebuilt = buildQueryString(entries);
  const asJson = JSON.stringify(
    entries.reduce((accumulator, entry) => {
      // Repeated keys become arrays, which is what they mean on the wire.
      if (entry.key in accumulator) {
        accumulator[entry.key] = [].concat(accumulator[entry.key], entry.value);
      } else {
        accumulator[entry.key] = entry.value;
      }
      return accumulator;
    }, {}),
    null,
    2,
  );

  const update = (index, patch) =>
    setRows(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <PaneLabel
          right={
            <div className="flex gap-2">
              <PasteButton
                onPaste={(text) => {
                  setInput(text);
                  setRows(null);
                }}
              />
              <Btn variant="ghost" className="!px-3 !py-2" onClick={() => setRows(null)}>
                Re-parse
              </Btn>
            </div>
          }
        >
          Query string or URL
        </PaneLabel>
        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setRows(null);
          }}
          placeholder="?a=1&b=2 or a full URL"
          aria-label="Query string"
          spellCheck={false}
          className={`${INPUT} font-mono`}
        />
        <ToolErrorPanel error={parsed.error} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Parameters {entries.length > 0 ? `(${entries.length})` : ""}</PaneLabel>

          {entries.length === 0 ? (
            <ToolNote>No parameters found.</ToolNote>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={entry.key}
                    onChange={(event) => update(index, { key: event.target.value })}
                    aria-label={`Parameter ${index + 1} name`}
                    spellCheck={false}
                    className={`${INPUT} min-w-0 flex-1 font-mono !py-2 !text-xs`}
                  />
                  <input
                    value={entry.value}
                    onChange={(event) => update(index, { value: event.target.value })}
                    aria-label={`Parameter ${index + 1} value`}
                    spellCheck={false}
                    className={`${INPUT} min-w-0 flex-1 font-mono !py-2 !text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setRows(entries.filter((_, i) => i !== index))}
                    aria-label="Remove parameter"
                    className="shrink-0 p-1.5 text-white/30 transition-colors hover:text-red-400"
                  >
                    <CrossIcon style="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Btn
            variant="ghost"
            className="mt-3 !px-3 !py-2"
            onClick={() => setRows([...entries, { key: "", value: "" }])}
          >
            Add parameter
          </Btn>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={rebuilt} label="Copy" />}>Rebuilt</PaneLabel>
            <CodeField value={rebuilt ? `?${rebuilt}` : ""} readOnly ariaLabel="Rebuilt query string" rows={3} />
            <div className="mt-3">
              <ToolNote>
                Rebuilt with <code>URLSearchParams</code>, so values are
                percent-encoded correctly — note that <code>+</code> in the
                input is read as a space, which is how form encoding works.
              </ToolNote>
            </div>
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={asJson} label="Copy JSON" />}>As JSON</PaneLabel>
            <CodeField value={asJson} readOnly ariaLabel="Parameters as JSON" rows={8} />
          </Panel>
        </div>
      </div>

      <RelatedTools ids={["url-parser", "url-encoder", "api-client"]} />
    </DevToolPage>
  );
}
