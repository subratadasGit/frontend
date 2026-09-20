import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  RelatedTools,
} from "../../../components/devtools/DevToolUI";
import { SearchIcon } from "../../../components/Icon";
import { HTTP_STATUSES } from "../../../devtools/transforms/dev";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "Informational", label: "1xx" },
  { id: "Success", label: "2xx" },
  { id: "Redirection", label: "3xx" },
  { id: "Client error", label: "4xx" },
  { id: "Server error", label: "5xx" },
];

const TONES = {
  Informational: "border-sky-500/40 text-sky-300",
  Success: "border-emerald-500/40 text-emerald-300",
  Redirection: "border-violet-500/40 text-violet-300",
  "Client error": "border-amber-500/40 text-amber-300",
  "Server error": "border-red-500/40 text-red-300",
};

/** Searchable reference for HTTP status codes. */
export default function HttpStatusLookup({ toolId }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return HTTP_STATUSES.filter((status) => {
      if (category !== "all" && status.category !== category) return false;
      if (!term) return true;
      return (
        String(status.code).includes(term) ||
        status.name.toLowerCase().includes(term) ||
        status.description.toLowerCase().includes(term)
      );
    });
  }, [query, category]);

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
            placeholder="Search by code, name or meaning — 404, teapot, rate limit…"
            aria-label="Search status codes"
            className={`${INPUT} pl-11`}
          />
        </div>
        <div className="mt-4">
          <OptionGroup label="Class" options={CATEGORIES} value={category} onChange={setCategory} />
        </div>
      </Panel>

      <Panel className="!p-0">
        <div className="border-b border-white/[0.08] px-4 py-3">
          <PaneLabel>
            {results.length} status code{results.length === 1 ? "" : "s"}
          </PaneLabel>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-white/40">
            No status code matches “{query}”.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {results.map((status) => (
              <li key={status.code} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-baseline sm:gap-4">
                <span
                  className={`shrink-0 self-start border px-2.5 py-1 font-mono text-sm ${TONES[status.category]}`}
                >
                  {status.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90">{status.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/50">{status.description}</p>
                </div>
                <CopyButton value={`${status.code} ${status.name}`} label="Copy" />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RelatedTools ids={["api-client", "headers-inspector", "mime-lookup"]} />
    </DevToolPage>
  );
}
