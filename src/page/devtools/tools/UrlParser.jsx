import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DataRow,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { parseUrl } from "../../../devtools/transforms/dev";

/** Breaks a URL into every component, with the query expanded. */
export default function UrlParser({ toolId }) {
  const [input, setInput] = useState("https://user@api.example.com:8443/v1/items?q=test&page=2#results");

  const { parsed, error } = useMemo(() => {
    if (!input.trim()) return { parsed: null, error: null };
    try {
      return { parsed: parseUrl(input), error: null };
    } catch (caught) {
      return { parsed: null, error: { message: caught.message } };
    }
  }, [input]);

  const asJson = parsed ? JSON.stringify(parsed, null, 2) : "";

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <div className="flex gap-2">
          <label htmlFor="url-input" className="sr-only">
            URL
          </label>
          <input
            id="url-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/path?a=1#section"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className={`${INPUT} min-w-0 flex-1 font-mono ${error ? "border-red-500/60" : ""}`}
          />
          <PasteButton onPaste={setInput} />
        </div>
      </Panel>

      <ToolErrorPanel error={error} />

      {parsed ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={asJson} label="Copy JSON" />}>Components</PaneLabel>
            <dl>
              <DataRow label="Protocol" value={parsed.protocol} />
              <DataRow label="Hostname" value={parsed.hostname} />
              <DataRow label="Port" value={parsed.port} />
              {parsed.username ? <DataRow label="Username" value={parsed.username} /> : null}
              {parsed.password ? <DataRow label="Password" value={parsed.password} /> : null}
              <DataRow label="Path" value={parsed.pathname} />
              <DataRow label="Query" value={parsed.search || "(none)"} />
              <DataRow label="Fragment" value={parsed.hash || "(none)"} />
            </dl>
            {parsed.password ? (
              <div className="mt-3">
                <ToolNote>
                  The password is masked above. Credentials in a URL are sent in
                  plain sight and end up in logs and history — prefer a header.
                </ToolNote>
              </div>
            ) : null}
          </Panel>

          <div className="space-y-4">
            {parsed.segments.length > 0 ? (
              <Panel className="!p-4 sm:!p-5">
                <PaneLabel>Path segments</PaneLabel>
                <ol className="divide-y divide-white/[0.06] border border-white/[0.08]">
                  {parsed.segments.map((segment, index) => (
                    <li key={index} className="flex items-baseline gap-3 p-2.5">
                      <span className="font-mono text-[0.625rem] text-white/25">{index}</span>
                      <code className="font-mono text-sm break-all text-white/80">{segment}</code>
                    </li>
                  ))}
                </ol>
              </Panel>
            ) : null}

            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>
                Query parameters {parsed.params.length > 0 ? `(${parsed.params.length})` : ""}
              </PaneLabel>
              {parsed.params.length === 0 ? (
                <ToolNote>This URL has no query string.</ToolNote>
              ) : (
                <dl className="border border-white/[0.08] px-3">
                  {parsed.params.map((param, index) => (
                    <div
                      key={`${param.key}-${index}`}
                      className="flex flex-col gap-1 border-b border-white/[0.06] py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4"
                    >
                      <dt className="shrink-0 font-mono text-[0.6875rem] text-[#ff4d1c] sm:w-40">
                        {param.key}
                      </dt>
                      <dd className="min-w-0 flex-1 font-mono text-xs break-all text-white/75">
                        {param.value || "(empty)"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panel>
          </div>
        </div>
      ) : null}

      <RelatedTools ids={["query-string-parser", "url-encoder", "api-client"]} />
    </DevToolPage>
  );
}
