import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { SearchIcon } from "../../../components/Icon";
import { MIME_TYPES } from "../../../devtools/transforms/dev";

/** Looks a MIME type up from an extension, or the other way round. */
export default function MimeLookup({ toolId }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^\./, "");
    if (!term) return MIME_TYPES;
    return MIME_TYPES.filter(
      (entry) =>
        entry.type.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.extensions.some((extension) => extension.includes(term)),
    );
  }, [query]);

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
            <SearchIcon style="w-4 h-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by extension or type — pdf, .webp, application/json…"
            aria-label="Search MIME types"
            className={`${INPUT} pl-11`}
          />
        </div>
        <div className="mt-3">
          <ToolNote>
            Send the right <code>Content-Type</code> and browsers stop guessing.
            Pair it with <code>X-Content-Type-Options: nosniff</code> so they
            cannot guess even when it is wrong.
          </ToolNote>
        </div>
      </Panel>

      <Panel className="!p-0">
        <div className="border-b border-white/[0.08] px-4 py-3">
          <PaneLabel>
            {results.length} type{results.length === 1 ? "" : "s"}
          </PaneLabel>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-white/40">
            Nothing matches “{query}”.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {results.map((entry) => (
              <li key={entry.type} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <code className="font-mono text-sm break-all text-[#ff4d1c]">{entry.type}</code>
                  <p className="mt-0.5 text-sm text-white/50">{entry.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {entry.extensions.length > 0 ? (
                    entry.extensions.map((extension) => (
                      <span
                        key={extension}
                        className="border border-white/10 px-2 py-0.5 font-mono text-[0.625rem] text-white/60"
                      >
                        .{extension}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-[0.625rem] text-white/25">no extension</span>
                  )}
                </div>
                <CopyButton value={entry.type} label="Copy" />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RelatedTools ids={["http-status-lookup", "headers-inspector", "api-client"]} />
    </DevToolPage>
  );
}
