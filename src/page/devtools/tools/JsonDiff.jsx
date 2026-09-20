import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { diffJson } from "../../../devtools/transforms/json";

const EXAMPLE_LEFT = JSON.stringify({ name: "Ada", version: 1 }, null, 2);
const EXAMPLE_RIGHT = JSON.stringify({ name: "Ada", version: 2 }, null, 2);

const TYPE_STYLES = {
  added: { border: "border-emerald-500/40", text: "text-emerald-300", label: "Added" },
  removed: { border: "border-red-500/40", text: "text-red-300", label: "Removed" },
  changed: { border: "border-amber-500/40", text: "text-amber-300", label: "Changed" },
};

const preview = (value) => {
  if (value === undefined) return "—";
  const text = JSON.stringify(value);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
};

/** Structural JSON comparison — by key path, not by line. */
export default function JsonDiff({ toolId }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [filter, setFilter] = useState("all");

  const { changes, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { changes: null, error: null };
    try {
      return { changes: diffJson(left, right), error: null };
    } catch (caught) {
      return {
        changes: null,
        error: {
          message: caught.message,
          line: caught.line,
          column: caught.column,
          hint: caught.hint,
        },
      };
    }
  }, [left, right]);

  const visible = useMemo(
    () => (changes || []).filter((change) => filter === "all" || change.type === filter),
    [changes, filter],
  );

  const counts = useMemo(() => {
    const base = { added: 0, removed: 0, changed: 0 };
    (changes || []).forEach((change) => {
      base[change.type] += 1;
    });
    return base;
  }, [changes]);

  const asText = visible
    .map((change) =>
      change.type === "changed"
        ? `~ ${change.path}: ${preview(change.from)} → ${preview(change.to)}`
        : change.type === "added"
          ? `+ ${change.path}: ${preview(change.to)}`
          : `- ${change.path}: ${preview(change.from)}`,
    )
    .join("\n");

  const clear = () => {
    setLeft("");
    setRight("");
  };

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setLeft} />}>Original</PaneLabel>
          <CodeField
            value={left}
            onChange={setLeft}
            placeholder={EXAMPLE_LEFT}
            ariaLabel="Original JSON"
            rows={12}
          />
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<PasteButton onPaste={setRight} />}>Changed</PaneLabel>
          <CodeField
            value={right}
            onChange={setRight}
            placeholder={EXAMPLE_RIGHT}
            ariaLabel="Changed JSON"
            rows={12}
          />
        </Panel>
      </div>

      <div className="mt-4">
        <ToolErrorPanel error={error} />
      </div>

      {changes ? (
        <Panel className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PaneLabel>
              {changes.length === 0
                ? "No differences"
                : `${changes.length} difference${changes.length === 1 ? "" : "s"}`}
            </PaneLabel>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={asText} label="Copy diff" />
              <ClearButton onClick={clear} />
            </div>
          </div>

          {changes.length === 0 ? (
            <ToolNote tone="good">
              The two documents are structurally identical. Key order and
              formatting are ignored, so only real value changes are reported.
            </ToolNote>
          ) : (
            <>
              <div className="mb-4">
                <OptionGroup
                  label="Show"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { id: "all", label: `All (${changes.length})` },
                    { id: "added", label: `Added (${counts.added})` },
                    { id: "removed", label: `Removed (${counts.removed})` },
                    { id: "changed", label: `Changed (${counts.changed})` },
                  ]}
                />
              </div>

              <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
                {visible.map((change, index) => {
                  const style = TYPE_STYLES[change.type];
                  return (
                    <li key={`${change.path}-${index}`} className="p-3 sm:p-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className={`border px-2 py-0.5 font-mono text-[0.5625rem] tracking-[0.14em] uppercase ${style.border} ${style.text}`}
                        >
                          {style.label}
                        </span>
                        <code className="font-mono text-xs break-all text-white/70">
                          {change.path}
                        </code>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {change.type !== "added" ? (
                          <div className="min-w-0">
                            <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-white/30 uppercase">
                              Before
                            </span>
                            <pre className="mt-1 overflow-x-auto border border-red-500/20 bg-red-500/[0.05] p-2 font-mono text-xs break-words whitespace-pre-wrap text-red-200/80">
                              {preview(change.from)}
                            </pre>
                          </div>
                        ) : null}
                        {change.type !== "removed" ? (
                          <div className="min-w-0">
                            <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-white/30 uppercase">
                              After
                            </span>
                            <pre className="mt-1 overflow-x-auto border border-emerald-500/20 bg-emerald-500/[0.05] p-2 font-mono text-xs break-words whitespace-pre-wrap text-emerald-200/80">
                              {preview(change.to)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>
      ) : null}

      <RelatedTools ids={["json-formatter", "diff-checker", "jsonpath-tester"]} />
    </DevToolPage>
  );
}
