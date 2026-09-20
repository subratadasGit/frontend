import { useMemo, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  RangeField,
  RelatedTools,
} from "../../../components/devtools/DevToolUI";
import { CrossIcon } from "../../../components/Icon";

const TYPES = [
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "conic", label: "Conic" },
];

const newStop = (color, position) => ({ id: crypto.randomUUID(), color, position });

/** Builds a CSS gradient with a live preview and copyable output. */
export default function GradientGenerator({ toolId }) {
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState([newStop("#ff4d1c", 0), newStop("#7c3aed", 100)]);

  const css = useMemo(() => {
    const ordered = [...stops].sort((a, b) => a.position - b.position);
    const list = ordered.map((stop) => `${stop.color} ${stop.position}%`).join(", ");
    if (type === "radial") return `radial-gradient(circle at center, ${list})`;
    if (type === "conic") return `conic-gradient(from ${angle}deg at center, ${list})`;
    return `linear-gradient(${angle}deg, ${list})`;
  }, [type, angle, stops]);

  const update = (id, patch) =>
    setStops((current) => current.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));

  const remove = (id) =>
    setStops((current) => (current.length > 2 ? current.filter((stop) => stop.id !== id) : current));

  const reset = () => {
    setType("linear");
    setAngle(135);
    setStops([newStop("#ff4d1c", 0), newStop("#7c3aed", 100)]);
  };

  const declaration = `background: ${css};`;

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Gradient</PaneLabel>
          <div className="space-y-5">
            <OptionGroup label="Type" options={TYPES} value={type} onChange={setType} />

            {type !== "radial" ? (
              <RangeField
                label={type === "conic" ? "Start angle" : "Angle"}
                value={angle}
                onChange={setAngle}
                min={0}
                max={360}
                suffix="°"
              />
            ) : null}

            <div>
              <span className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
                Colour stops
              </span>
              <div className="space-y-2">
                {stops.map((stop) => (
                  <div key={stop.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(event) => update(stop.id, { color: event.target.value })}
                      aria-label="Stop colour"
                      className="h-9 w-10 shrink-0 cursor-pointer border border-white/10 bg-transparent"
                    />
                    <input
                      value={stop.color}
                      onChange={(event) => update(stop.id, { color: event.target.value })}
                      aria-label="Stop colour value"
                      spellCheck={false}
                      className={`${INPUT} min-w-0 flex-1 font-mono !py-2 !text-xs`}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(event) => update(stop.id, { position: Number(event.target.value) })}
                      aria-label="Stop position"
                      className={`${INPUT} w-16 shrink-0 font-mono !py-2 !text-xs`}
                    />
                    <button
                      type="button"
                      onClick={() => remove(stop.id)}
                      disabled={stops.length <= 2}
                      aria-label="Remove stop"
                      className="shrink-0 p-1.5 text-white/30 transition-colors hover:text-red-400 disabled:opacity-20"
                    >
                      <CrossIcon style="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Btn
                variant="ghost"
                className="mt-2 !px-3 !py-2"
                onClick={() => setStops((current) => [...current, newStop("#ffffff", 50)])}
              >
                Add stop
              </Btn>
            </div>

            <Btn variant="ghost" onClick={reset} className="w-full">
              Reset
            </Btn>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Preview</PaneLabel>
            <div
              className="h-64 border border-white/10 sm:h-80"
              style={{ background: css }}
              aria-label="Gradient preview"
            />
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={declaration} label="Copy CSS" />}>CSS</PaneLabel>
            <CodeField value={declaration} readOnly ariaLabel="Generated CSS" rows={3} />
          </Panel>
        </div>
      </div>

      <RelatedTools ids={["color-converter", "box-shadow-generator", "border-radius-generator"]} />
    </DevToolPage>
  );
}
