import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { diffLines } from "../../../devtools/transforms/text";

const MAX_LINES = 4000;

/** Line-by-line diff for text or code, unified or side by side. */
export default function DiffChecker({ toolId }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [view, setView] = useState("unified");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);

  const tooLarge =
    left.split("\n").length > MAX_LINES || right.split("\n").length > MAX_LINES;

  const diff = useMemo(() => {
    if (!left && !right) return null;
    if (tooLarge) return null;
    return diffLines(left, right, { ignoreWhitespace, ignoreCase });
  }, [left, right, ignoreWhitespace, ignoreCase, tooLarge]);

  const rows = useMemo(() => {
    if (!diff) return [];
    return onlyChanges ? diff.rows.filter((row) => row.type !== "equal") : diff.rows;
  }, [diff, onlyChanges]);

  const asPatch = useMemo(
    () =>
      (diff?.rows || [])
        .map((row) =>
          row.type === "added" ? `+ ${row.value}` : row.type === "removed" ? `- ${row.value}` : `  ${row.value}`,
        )
        .join("\n"),
    [diff],
  );

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setLeft} />}>Original</PaneLabel>
          <CodeField value={left} onChange={setLeft} ariaLabel="Original text" rows={12} />
        </Panel>
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setRight} />}>Changed</PaneLabel>
          <CodeField value={right} onChange={setRight} ariaLabel="Changed text" rows={12} />
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <OptionGroup
            label="View"
            value={view}
            onChange={setView}
            options={[
              { id: "unified", label: "Unified" },
              { id: "split", label: "Side by side" },
            ]}
          />
          <div className="space-y-2 pt-5">
            <CheckField label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
            <CheckField label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
            <CheckField label="Only show changes" checked={onlyChanges} onChange={setOnlyChanges} />
          </div>
          {diff ? (
            <div className="flex flex-wrap items-center gap-2 pt-5" aria-live="polite">
              <span className="border border-emerald-500/40 px-2.5 py-1 font-mono text-[0.625rem] text-emerald-300">
                +{diff.added}
              </span>
              <span className="border border-red-500/40 px-2.5 py-1 font-mono text-[0.625rem] text-red-300">
                −{diff.removed}
              </span>
              <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/50">
                {diff.unchanged} unchanged
              </span>
              <CopyButton value={asPatch} label="Copy diff" />
            </div>
          ) : null}
        </div>
      </Panel>

      {tooLarge ? (
        <div className="mt-4">
          <ToolNote>
            These inputs are over {MAX_LINES.toLocaleString()} lines each. The
            comparison builds a table proportional to both lengths, so it is
            held back here rather than freezing the page — diff a smaller
            section, or use a local tool for files this size.
          </ToolNote>
        </div>
      ) : null}

      {diff && diff.added === 0 && diff.removed === 0 ? (
        <div className="mt-4 border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
          The two inputs are identical
          {ignoreWhitespace || ignoreCase ? " under the options selected" : ""}.
        </div>
      ) : null}

      {diff && rows.length > 0 ? (
        <Panel className="mt-4 !p-0">
          {view === "unified" ? (
            <div className="overflow-x-auto">
              {rows.map((row, index) => (
                <div key={index} className="diff-row" data-type={row.type}>
                  <span className="diff-row__line">{row.leftLine ?? ""}</span>
                  <span className="diff-row__line">{row.rightLine ?? ""}</span>
                  <span className="diff-row__text">
                    <span aria-hidden="true" className="select-none text-white/30">
                      {row.type === "added" ? "+ " : row.type === "removed" ? "− " : "  "}
                    </span>
                    {row.value || " "}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="overflow-x-auto border-b border-white/[0.08] md:border-r md:border-b-0">
                <p className="border-b border-white/[0.08] px-3 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase">
                  Original
                </p>
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="diff-row"
                    data-type={row.type === "added" ? "equal" : row.type}
                    style={{ gridTemplateColumns: "3.5rem 1fr" }}
                  >
                    <span className="diff-row__line">{row.leftLine ?? ""}</span>
                    <span className="diff-row__text">
                      {row.type === "added" ? " " : row.value || " "}
                    </span>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <p className="border-b border-white/[0.08] px-3 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase">
                  Changed
                </p>
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="diff-row"
                    data-type={row.type === "removed" ? "equal" : row.type}
                    style={{ gridTemplateColumns: "3.5rem 1fr" }}
                  >
                    <span className="diff-row__line">{row.rightLine ?? ""}</span>
                    <span className="diff-row__text">
                      {row.type === "removed" ? " " : row.value || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      ) : null}

      <RelatedTools ids={["json-diff", "regex-tester", "text-counter"]} />
    </DevToolPage>
  );
}
