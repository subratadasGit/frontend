import { useEffect, useMemo, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { CrossIcon } from "../../../components/Icon";

/**
 * A curated list rather than the full IANA database.
 *
 * `Intl.supportedValuesOf("timeZone")` returns several hundred zones, which is
 * a poor picker; these cover the ones teams actually coordinate across, and
 * any other zone can be typed in.
 */
const COMMON_ZONES = [
  "UTC", "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Sao_Paulo", "Europe/London", "Europe/Dublin", "Europe/Lisbon", "Europe/Paris",
  "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Athens", "Europe/Moscow",
  "Africa/Lagos", "Africa/Cairo", "Africa/Nairobi", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Perth", "Australia/Sydney", "Pacific/Auckland",
];

const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const formatIn = (date, zone) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      dateStyle: "medium",
      timeStyle: "long",
    }).format(date);
  } catch {
    return null;
  }
};

/** The UTC offset for a zone at a given instant, in ±HH:MM. */
const offsetOf = (date, zone) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value?.replace("GMT", "UTC") || "";
  } catch {
    return "";
  }
};

/** One instant, shown across several timezones at once. */
export default function TimezoneConverter({ toolId }) {
  const [zones, setZones] = useState(() => {
    const local = localZone();
    return [...new Set([local, "UTC", "America/New_York", "Europe/London", "Asia/Kolkata"])];
  });
  const [custom, setCustom] = useState("");
  const [useNow, setUseNow] = useState(true);
  const [instantInput, setInstantInput] = useState("");
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!useNow) return undefined;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [useNow]);

  const instant = useMemo(() => {
    if (useNow) return new Date(tick);
    const parsed = new Date(instantInput);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [useNow, tick, instantInput]);

  const addZone = (zone) => {
    const value = zone.trim();
    if (!value) return;
    if (!formatIn(new Date(), value)) return;
    setZones((current) => (current.includes(value) ? current : [...current, value]));
    setCustom("");
  };

  const summary = instant
    ? zones.map((zone) => `${zone}: ${formatIn(instant, zone)}`).join("\n")
    : "";

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="tz-instant" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
              Moment
            </label>
            <input
              id="tz-instant"
              type="datetime-local"
              step="1"
              value={instantInput}
              disabled={useNow}
              onChange={(event) => setInstantInput(event.target.value)}
              className={`${INPUT} font-mono disabled:opacity-40`}
            />
          </div>
          <Btn
            variant={useNow ? "primary" : "ghost"}
            onClick={() => {
              setUseNow((current) => !current);
              if (useNow && !instantInput) {
                const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
                setInstantInput(local.toISOString().slice(0, 19));
              }
            }}
          >
            {useNow ? "Following now" : "Use now"}
          </Btn>
          <CopyButton value={summary} label="Copy all" />
        </div>
      </Panel>

      <Panel className="mb-4">
        <PaneLabel>Add a timezone</PaneLabel>
        <div className="flex gap-2">
          <label htmlFor="tz-custom" className="sr-only">
            Timezone name
          </label>
          <input
            id="tz-custom"
            list="tz-options"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addZone(custom);
            }}
            placeholder="Europe/Warsaw"
            className={`${INPUT} min-w-0 flex-1 font-mono`}
          />
          <datalist id="tz-options">
            {COMMON_ZONES.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          <Btn onClick={() => addZone(custom)}>Add</Btn>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_ZONES.filter((zone) => !zones.includes(zone))
            .slice(0, 12)
            .map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => addZone(zone)}
                className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
              >
                {zone}
              </button>
            ))}
        </div>
      </Panel>

      {instant ? (
        <Panel className="!p-0">
          <ul className="divide-y divide-white/[0.06]">
            {zones.map((zone) => (
              <li key={zone} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 sm:w-64">
                  <p className="truncate font-mono text-sm text-white/85">{zone}</p>
                  <p className="font-mono text-[0.625rem] text-white/35">
                    {offsetOf(instant, zone)}
                    {zone === localZone() ? " · your timezone" : ""}
                  </p>
                </div>
                <p className="min-w-0 flex-1 text-sm text-white/70">{formatIn(instant, zone)}</p>
                <button
                  type="button"
                  onClick={() => setZones((current) => current.filter((entry) => entry !== zone))}
                  aria-label={`Remove ${zone}`}
                  className="shrink-0 self-start p-1.5 text-white/25 transition-colors hover:text-red-400 sm:self-center"
                >
                  <CrossIcon style="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <ToolNote>Enter a valid date and time, or switch back to following the current moment.</ToolNote>
      )}

      <div className="mt-4">
        <ToolNote>
          Conversions use the browser's own IANA timezone database via{" "}
          <code>Intl.DateTimeFormat</code>, so daylight saving transitions are
          handled correctly for the date you pick — not just the current offset.
        </ToolNote>
      </div>

      <RelatedTools ids={["timestamp-converter", "cron-tester", "url-parser"]} />
    </DevToolPage>
  );
}
