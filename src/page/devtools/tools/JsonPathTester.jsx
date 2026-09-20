import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
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
import { evaluateJsonPath, parseJson } from "../../../devtools/transforms/json";

const SAMPLE = JSON.stringify(
  {
    store: {
      books: [
        { title: "Dune", author: "Herbert", price: 9.99 },
        { title: "Neuromancer", author: "Gibson", price: 12.5 },
      ],
      bicycle: { color: "red", price: 199 },
    },
  },
  null,
  2,
);

const EXAMPLES = [
  { path: "$.store.books[*].title", label: "Every title" },
  { path: "$.store.books[0]", label: "First book" },
  { path: "$.store.books[-1].price", label: "Last price" },
  { path: "$..price", label: "Every price, any depth" },
  { path: "$.store.books[0:2]", label: "A slice" },
  { path: "$.store.*", label: "Direct children" },
];

/** Runs a JSONPath expression and lists each match with its resolved path. */
export default function JsonPathTester({ toolId }) {
  const [document_, setDocument] = useState(SAMPLE);
  const [path, setPath] = useState("$.store.books[*].title");

  const { matches, error } = useMemo(() => {
    if (!document_.trim()) return { matches: null, error: null };
    try {
      const parsed = parseJson(document_);
      return { matches: evaluateJsonPath(parsed, path), error: null };
    } catch (caught) {
      return {
        matches: null,
        error: {
          message: caught.message,
          line: caught.line,
          column: caught.column,
          hint: caught.hint,
        },
      };
    }
  }, [document_, path]);

  const asJson = matches ? JSON.stringify(matches.map((match) => match.value), null, 2) : "";

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <label htmlFor="jsonpath-expression" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
          JSONPath expression
        </label>
        <input
          id="jsonpath-expression"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="$.store.books[*].title"
          spellCheck={false}
          className={`${INPUT} font-mono`}
        />

        <div className="mt-4 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example.path}
              type="button"
              onClick={() => setPath(example.path)}
              title={example.label}
              className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
            >
              {example.path}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setDocument} />}>Document</PaneLabel>
          <CodeField
            value={document_}
            onChange={setDocument}
            ariaLabel="JSON document"
            errorLine={error?.line}
            rows={16}
          />
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={matches ? <CopyButton value={asJson} label="Copy values" /> : null}
          >
            {matches ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : "Matches"}
          </PaneLabel>

          {error ? <ToolErrorPanel error={error} /> : null}

          {matches && matches.length === 0 && !error ? (
            <ToolNote>
              The expression is valid but nothing in this document matches it.
            </ToolNote>
          ) : null}

          {matches && matches.length > 0 ? (
            <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
              {matches.map((match, index) => (
                <li key={`${match.path}-${index}`} className="p-3">
                  <code className="block font-mono text-[0.6875rem] break-all text-[#ff4d1c]">
                    {match.path}
                  </code>
                  <pre className="mt-1.5 overflow-x-auto font-mono text-xs break-words whitespace-pre-wrap text-white/75">
                    {JSON.stringify(match.value, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3">
            <ToolNote>
              Supports <code>$</code>, child access, <code>*</code> wildcards,
              array indices (including negative), <code>[start:end]</code> slices
              and <code>..</code> recursive descent. Filter expressions{" "}
              <code>?(…)</code> are not supported.
            </ToolNote>
          </div>
        </Panel>
      </div>

      <RelatedTools ids={["json-formatter", "json-diff", "json-schema-validator"]} />
    </DevToolPage>
  );
}
