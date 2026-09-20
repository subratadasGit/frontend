import { useEffect, useMemo, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DataRow,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";

/** Seconds vs milliseconds is guessed from magnitude when set to auto. */
const toDate = (value, unit) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const milliseconds =
    unit === "ms" ? number : unit === "s" ? number * 1000 : Math.abs(number) > 1e11 ? number : number * 1000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
};

const relative = (date, now) => {
  const delta = date.getTime() - now;
  const absolute = Math.abs(delta);
  const steps = [
    { limit: 60000, divisor: 1000, unit: "second" },
    { limit: 3600000, divisor: 60000, unit: "minute" },
    { limit: 86400000, divisor: 3600000, unit: "hour" },
    { limit: 2592000000, divisor: 86400000, unit: "day" },
    { limit: 31536000000, divisor: 2592000000, unit: "month" },
    { limit: Infinity, divisor: 31536000000, unit: "year" },
  ];
  const { divisor, unit } = steps.find((step) => absolute < step.limit);
  const amount = Math.round(absolute / divisor);
  return delta >= 0 ? `in ${amount} ${unit}${amount === 1 ? "" : "s"}` : `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
};

/** Unix epoch ⇄ human-readable dates, in both directions. */
export default function TimestampConverter({ toolId }) {
  const [timestamp, setTimestamp] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState("auto");
  const [dateInput, setDateInput] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // A live clock is the point of this tool — without it the "current epoch"
  // readout would be stale the moment the page renders.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = useMemo(() => toDate(timestamp, unit), [timestamp, unit]);

  const fromDate = useMemo(() => {
    if (!dateInput) return null;
    const parsed = new Date(dateInput);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [dateInput]);

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
              Current epoch
            </p>
            <p className="mt-1 font-mono text-2xl text-white tabular-nums">
              {Math.floor(now / 1000)}
            </p>
            <p className="mt-0.5 font-mono text-xs text-white/35">{now} ms</p>
          </div>
          <div className="flex gap-2">
            <CopyButton value={String(Math.floor(now / 1000))} label="Copy seconds" />
            <Btn
              variant="ghost"
              className="!px-3 !py-2"
              onClick={() => setTimestamp(String(Math.floor(Date.now() / 1000)))}
            >
              Use now
            </Btn>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Timestamp → date</PaneLabel>
          <label htmlFor="ts-value" className="sr-only">
            Timestamp
          </label>
          <input
            id="ts-value"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
            placeholder="1789881767"
            spellCheck={false}
            className={`${INPUT} font-mono`}
          />
          <div className="mt-3">
            <OptionGroup
              label="Unit"
              value={unit}
              onChange={setUnit}
              options={[
                { id: "auto", label: "Auto" },
                { id: "s", label: "Seconds" },
                { id: "ms", label: "Milliseconds" },
              ]}
            />
          </div>

          {timestamp && !date ? (
            <div className="mt-4">
              <ToolErrorPanel error={{ message: "That is not a timestamp this can read." }} />
            </div>
          ) : null}

          {date ? (
            <dl className="mt-4">
              <DataRow label="Local" value={date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })} />
              <DataRow label="ISO 8601 (UTC)" value={date.toISOString()} />
              <DataRow label="UTC" value={date.toUTCString()} />
              <DataRow label="Relative" value={relative(date, now)} />
              <DataRow label="Seconds" value={String(Math.floor(date.getTime() / 1000))} />
              <DataRow label="Milliseconds" value={String(date.getTime())} />
            </dl>
          ) : null}
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Date → timestamp</PaneLabel>
          <label htmlFor="ts-date" className="sr-only">
            Date and time
          </label>
          <input
            id="ts-date"
            type="datetime-local"
            step="1"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            className={`${INPUT} font-mono`}
          />

          {fromDate ? (
            <dl className="mt-4">
              <DataRow label="Seconds">
                <span className="flex items-center justify-between gap-3">
                  <code className="font-mono text-sm text-white/85">
                    {Math.floor(fromDate.getTime() / 1000)}
                  </code>
                  <CopyButton value={String(Math.floor(fromDate.getTime() / 1000))} label="Copy" />
                </span>
              </DataRow>
              <DataRow label="Milliseconds">
                <span className="flex items-center justify-between gap-3">
                  <code className="font-mono text-sm text-white/85">{fromDate.getTime()}</code>
                  <CopyButton value={String(fromDate.getTime())} label="Copy" />
                </span>
              </DataRow>
              <DataRow label="ISO 8601" value={fromDate.toISOString()} />
            </dl>
          ) : (
            <div className="mt-4">
              <ToolNote>
                Pick a date and time to convert it. The value is read in this
                browser's timezone, then shown as UTC alongside.
              </ToolNote>
            </div>
          )}
        </Panel>
      </div>

      <RelatedTools ids={["timezone-converter", "cron-tester", "text-counter"]} />
    </DevToolPage>
  );
}
