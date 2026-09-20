import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DataRow,
  DevToolPage,
  RangeField,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { contrastRatio, formatColor, hslToRgb, parseColor } from "../../../devtools/transforms/web";

const PRESETS = ["#ff4d1c", "#7c3aed", "#050505", "#ffffff", "rgb(16 185 129)", "hsl(200 90% 55%)"];

/** Grade thresholds from WCAG 2.1 §1.4.3 and §1.4.6. */
const wcag = (ratio) => [
  { label: "AA normal text", pass: ratio >= 4.5, needs: "4.5:1" },
  { label: "AA large text", pass: ratio >= 3, needs: "3:1" },
  { label: "AAA normal text", pass: ratio >= 7, needs: "7:1" },
  { label: "AAA large text", pass: ratio >= 4.5, needs: "4.5:1" },
];

/** HEX / RGB / HSL in every direction, plus a contrast check. */
export default function ColorConverter({ toolId }) {
  const [input, setInput] = useState("#ff4d1c");
  const [against, setAgainst] = useState("#050505");

  const { color, error } = useMemo(() => {
    try {
      return { color: formatColor(parseColor(input)), error: null };
    } catch (caught) {
      return { color: null, error: { message: caught.message } };
    }
  }, [input]);

  const backdrop = useMemo(() => {
    try {
      return formatColor(parseColor(against));
    } catch {
      return null;
    }
  }, [against]);

  const ratio = color && backdrop ? contrastRatio(color.channels, backdrop.channels) : null;

  // Editing an HSL channel rewrites the input, so the sliders stay the source
  // of truth without a second piece of state to keep in sync.
  const setHsl = (patch) => {
    if (!color) return;
    const next = { ...color.hslChannels, ...patch };
    const rgb = hslToRgb(next.h, next.s, next.l, color.channels.a);
    setInput(formatColor(rgb).hex);
  };

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <label htmlFor="color-input" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
              Colour
            </label>
            <div className="flex gap-2">
              <input
                id="color-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="#ff4d1c, rgb(255 77 28), hsl(13 100% 55%) or a name"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                className={`${INPUT} min-w-0 flex-1 font-mono ${error ? "border-red-500/60" : ""}`}
              />
              <input
                type="color"
                value={color?.hexShort || "#000000"}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Pick a colour"
                className="h-[46px] w-14 shrink-0 cursor-pointer border border-white/10 bg-transparent"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInput(preset)}
                  className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
                >
                  {preset}
                </button>
              ))}
            </div>

            <ToolErrorPanel error={error} />
          </Panel>

          {color ? (
            <>
              <Panel className="!p-4 sm:!p-5">
                <div
                  className="alpha-checker flex h-32 items-end border border-white/10"
                  aria-label={`Preview of ${color.hex}`}
                >
                  <div className="h-full w-full" style={{ backgroundColor: color.rgb }} />
                </div>

                <dl className="mt-4">
                  {[
                    { label: "HEX", value: color.hex },
                    { label: "HEX (no alpha)", value: color.hexShort },
                    { label: "RGB", value: color.rgb },
                    { label: "HSL", value: color.hsl },
                  ].map((entry) => (
                    <DataRow key={entry.label} label={entry.label}>
                      <span className="flex items-center justify-between gap-3">
                        <code className="font-mono text-sm text-white/85">{entry.value}</code>
                        <CopyButton value={entry.value} label="Copy" />
                      </span>
                    </DataRow>
                  ))}
                </dl>
              </Panel>

              <Panel className="!p-4 sm:!p-5">
                <p className="mb-4 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
                  Adjust (HSL)
                </p>
                <div className="space-y-4">
                  <RangeField
                    label="Hue"
                    value={color.hslChannels.h}
                    onChange={(value) => setHsl({ h: value })}
                    min={0}
                    max={360}
                    suffix="°"
                  />
                  <RangeField
                    label="Saturation"
                    value={color.hslChannels.s}
                    onChange={(value) => setHsl({ s: value })}
                    min={0}
                    max={100}
                    suffix="%"
                  />
                  <RangeField
                    label="Lightness"
                    value={color.hslChannels.l}
                    onChange={(value) => setHsl({ l: value })}
                    min={0}
                    max={100}
                    suffix="%"
                  />
                </div>
              </Panel>
            </>
          ) : null}
        </div>

        <Panel className="!p-4 sm:!p-5">
          <p className="mb-3 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Contrast
          </p>

          <label htmlFor="color-against" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
            Against
          </label>
          <input
            id="color-against"
            value={against}
            onChange={(event) => setAgainst(event.target.value)}
            spellCheck={false}
            className={`${INPUT} font-mono`}
          />

          {color && backdrop ? (
            <>
              <div
                className="mt-4 flex h-24 items-center justify-center border border-white/10"
                style={{ backgroundColor: backdrop.rgb }}
              >
                <span className="text-lg font-semibold" style={{ color: color.rgb }}>
                  Sample text
                </span>
              </div>

              <p className="mt-3 text-center">
                <span className="font-mono text-2xl text-white">{ratio}</span>
                <span className="ml-1 font-mono text-xs text-white/40">: 1</span>
              </p>

              <ul className="mt-3 space-y-1.5">
                {wcag(ratio).map((entry) => (
                  <li key={entry.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/55">{entry.label}</span>
                    <span
                      className={`font-mono tracking-[0.1em] uppercase ${
                        entry.pass ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {entry.pass ? "Pass" : `Fail (${entry.needs})`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <ToolNote>
                  Large text means 18.66px bold or 24px regular and above.
                </ToolNote>
              </div>
            </>
          ) : null}
        </Panel>
      </div>

      <RelatedTools ids={["gradient-generator", "box-shadow-generator", "css-clamp-generator"]} />
    </DevToolPage>
  );
}
