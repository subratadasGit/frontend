import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { validateSql } from "../../../devtools/transforms/sql";

const LEVELS = {
  error: { border: "border-red-500/40", text: "text-red-300", label: "Error" },
  warning: { border: "border-amber-500/40", text: "text-amber-300", label: "Warning" },
};

const SAMPLE = `SELECT u.id, u.name,
FROM users u
WHERE (u.active = 1;

DELETE FROM sessions;`;

/** Structural SQL checks — the errors that actually stop a statement running. */
export default function SqlValidator({ toolId }) {
  const [sql, setSql] = useState(SAMPLE);

  const result = useMemo(() => {
    if (!sql.trim()) return null;
    try {
      return validateSql(sql);
    } catch (caught) {
      return { issues: [{ level: "error", message: caught.message }], statements: 0 };
    }
  }, [sql]);

  const errors = (result?.issues || []).filter((issue) => issue.level === "error");
  const warnings = (result?.issues || []).filter((issue) => issue.level === "warning");
  const asText = (result?.issues || []).map((issue) => `[${issue.level}] ${issue.message}`).join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setSql} />
                <ClearButton onClick={() => setSql("")} disabled={!sql} />
              </div>
            }
          >
            SQL
          </PaneLabel>
          <CodeField value={sql} onChange={setSql} ariaLabel="SQL to validate" rows={16} />
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={result?.issues.length ? <CopyButton value={asText} label="Copy" /> : null}>
            Report
          </PaneLabel>

          {result ? (
            <div className="mb-4 flex flex-wrap gap-2" aria-live="polite">
              <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60">
                {result.statements} statement{result.statements === 1 ? "" : "s"}
              </span>
              <span
                className={`border px-2.5 py-1 font-mono text-[0.625rem] ${
                  errors.length ? "border-red-500/40 text-red-300" : "border-white/10 text-white/50"
                }`}
              >
                {errors.length} error{errors.length === 1 ? "" : "s"}
              </span>
              <span
                className={`border px-2.5 py-1 font-mono text-[0.625rem] ${
                  warnings.length ? "border-amber-500/40 text-amber-300" : "border-white/10 text-white/50"
                }`}
              >
                {warnings.length} warning{warnings.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}

          {result && result.issues.length === 0 ? (
            <div className="border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
              No structural problems found.
            </div>
          ) : null}

          {result && result.issues.length > 0 ? (
            <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
              {result.issues.map((issue, index) => {
                const level = LEVELS[issue.level] || LEVELS.warning;
                return (
                  <li key={index} className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-baseline sm:gap-3">
                    <span
                      className={`shrink-0 self-start border px-2 py-0.5 font-mono text-[0.5625rem] tracking-[0.14em] uppercase ${level.border} ${level.text}`}
                    >
                      {level.label}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-white/75">{issue.message}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-4">
            <ToolNote>
              These are structural checks — bracket and quote balance, statement
              keywords, missing clauses and the unbounded UPDATE/DELETE that
              catches everyone out. It is not a full SQL parser, so it cannot
              tell you that a column does not exist. Use the SQL Formatter to
              spot-check shape, and your database to confirm.
            </ToolNote>
          </div>
        </Panel>
      </div>

      <RelatedTools ids={["sql-formatter", "sql-to-prisma", "erd-generator"]} />
    </DevToolPage>
  );
}
