import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DataRow,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { describeCron, nextCronRuns, parseCron } from "../../../devtools/transforms/dev";

const PRESETS = [
  { expression: "* * * * *", label: "Every minute" },
  { expression: "*/15 * * * *", label: "Every 15 minutes" },
  { expression: "0 * * * *", label: "Hourly" },
  { expression: "0 9 * * 1-5", label: "Weekdays at 09:00" },
  { expression: "0 0 1 * *", label: "Monthly" },
  { expression: "@daily", label: "Daily macro" },
];

const FIELD_HINTS = ["minute", "hour", "day of month", "month", "day of week"];

/** Explains a cron expression and lists when it will next fire. */
export default function CronTester({ toolId }) {
  const [expression, setExpression] = useState("0 9 * * 1-5");

  const result = useMemo(() => {
    if (!expression.trim()) return { error: null };
    try {
      return {
        parsed: parseCron(expression),
        description: describeCron(expression),
        runs: nextCronRuns(expression, 8),
        error: null,
      };
    } catch (caught) {
      return { error: { message: caught.message } };
    }
  }, [expression]);

  const runsText = (result.runs || [])
    .map((date) => date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }))
    .join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <label htmlFor="cron-expression" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
          Expression
        </label>
        <input
          id="cron-expression"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="0 9 * * 1-5"
          spellCheck={false}
          aria-invalid={Boolean(result.error)}
          className={`${INPUT} font-mono text-base ${result.error ? "border-red-500/60" : ""}`}
        />

        <div className="mt-2 grid grid-cols-5 gap-2">
          {FIELD_HINTS.map((hint, index) => (
            <span
              key={hint}
              className="text-center font-mono text-[0.5625rem] tracking-[0.1em] text-white/25 uppercase"
            >
              {index + 1}. {hint}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              type="button"
              onClick={() => setExpression(preset.expression)}
              title={preset.label}
              className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
            >
              {preset.expression}
            </button>
          ))}
        </div>
      </Panel>

      <ToolErrorPanel error={result.error} />

      {result.description ? (
        <div className="mb-4 border border-[#ff4d1c]/30 bg-[#ff4d1c]/[0.05] px-4 py-3">
          <p className="font-mono text-[0.625rem] tracking-[0.16em] text-[#ff4d1c] uppercase">
            In plain English
          </p>
          <p className="mt-1 text-sm text-white/85">{result.description}</p>
        </div>
      ) : null}

      {result.parsed ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Fields</PaneLabel>
            <dl>
              {result.parsed.fields.map((entry) => (
                <DataRow key={entry.field.name} label={entry.field.name}>
                  <span className="block font-mono text-sm text-white/85">{entry.raw}</span>
                  <span className="mt-0.5 block text-xs break-words text-white/40">
                    {entry.values.length > 20
                      ? `${entry.values.length} values (${entry.values[0]}–${entry.values[entry.values.length - 1]})`
                      : entry.values.join(", ")}
                  </span>
                </DataRow>
              ))}
            </dl>
            {result.parsed.macro ? (
              <div className="mt-3">
                <ToolNote>
                  <code>{result.parsed.macro}</code> expands to{" "}
                  <code>{result.parsed.normalised}</code>.
                </ToolNote>
              </div>
            ) : null}
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={runsText} label="Copy" />}>Next runs</PaneLabel>
            {result.runs.length === 0 ? (
              <ToolNote>
                This expression does not fire within the next four years — check
                for an impossible date such as 30 February.
              </ToolNote>
            ) : (
              <ol className="divide-y divide-white/[0.06] border border-white/[0.08]">
                {result.runs.map((date, index) => (
                  <li key={index} className="flex items-baseline justify-between gap-3 p-2.5">
                    <span className="font-mono text-[0.625rem] text-white/25">{index + 1}</span>
                    <span className="flex-1 text-sm text-white/80">
                      {date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-3">
              <ToolNote>
                Times are in this browser's timezone. A server running the job
                will use its own — usually UTC.
              </ToolNote>
            </div>
          </Panel>
        </div>
      ) : null}

      <RelatedTools ids={["timestamp-converter", "timezone-converter", "regex-tester"]} />
    </DevToolPage>
  );
}
