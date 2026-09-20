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
import { validateEnv } from "../../../devtools/transforms/security";

const LEVELS = {
  error: { border: "border-red-500/40", text: "text-red-300", label: "Error" },
  warning: { border: "border-amber-500/40", text: "text-amber-300", label: "Warning" },
  info: { border: "border-sky-500/40", text: "text-sky-300", label: "Note" },
};

const SAMPLE = `# Database
DATABASE_URL="postgres://user:pass@localhost:5432/app"
database_url=postgres://duplicate

API_KEY=your_api_key_here
EMPTY=
BAD KEY=1
QUOTED="unbalanced
JWT_SECRET=s3cr3t-value-that-looks-real`;

/** Lints a `.env` file for the mistakes that actually cause outages. */
export default function EnvValidator({ toolId }) {
  const [text, setText] = useState(SAMPLE);

  const { issues, count } = useMemo(() => {
    if (!text.trim()) return { issues: [], count: 0 };
    return validateEnv(text);
  }, [text]);

  const byLevel = (level) => issues.filter((issue) => issue.level === level).length;
  const asText = issues.map((issue) => `line ${issue.line} [${issue.level}] ${issue.message}`).join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setText} />
                <ClearButton onClick={() => setText("")} disabled={!text} />
              </div>
            }
          >
            .env file
          </PaneLabel>
          <CodeField value={text} onChange={setText} ariaLabel="env file contents" rows={16} />
          <div className="mt-3">
            <ToolNote>
              Checked entirely in this browser — nothing you paste leaves the
              page. Values are read only to spot placeholders and quoting
              errors; they are never transmitted or stored.
            </ToolNote>
          </div>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={issues.length ? <CopyButton value={asText} label="Copy report" /> : null}>
            Report
          </PaneLabel>

          <div className="mb-4 flex flex-wrap gap-2" aria-live="polite">
            <Stat label="Variables" value={count} />
            <Stat label="Errors" value={byLevel("error")} tone={byLevel("error") ? "text-red-300" : undefined} />
            <Stat label="Warnings" value={byLevel("warning")} tone={byLevel("warning") ? "text-amber-300" : undefined} />
          </div>

          {text.trim() && issues.length === 0 ? (
            <div className="border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
              No problems found in {count} variable{count === 1 ? "" : "s"}.
            </div>
          ) : null}

          {issues.length > 0 ? (
            <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
              {issues.map((issue, index) => {
                const level = LEVELS[issue.level];
                return (
                  <li key={index} className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-baseline sm:gap-3">
                    <span
                      className={`shrink-0 self-start border px-2 py-0.5 font-mono text-[0.5625rem] tracking-[0.14em] uppercase ${level.border} ${level.text}`}
                    >
                      {level.label}
                    </span>
                    <span className="shrink-0 font-mono text-[0.625rem] text-white/35">
                      line {issue.line}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-white/75">{issue.message}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Panel>
      </div>

      <RelatedTools ids={["password-generator", "jwt-inspector", "hash-generator"]} />
    </DevToolPage>
  );
}

function Stat({ label, value, tone = "text-white/80" }) {
  return (
    <div className="border border-white/[0.08] px-3 py-2">
      <span className="block font-mono text-[0.5625rem] tracking-[0.16em] text-white/30 uppercase">
        {label}
      </span>
      <span className={`font-mono text-lg ${tone}`}>{value}</span>
    </div>
  );
}
