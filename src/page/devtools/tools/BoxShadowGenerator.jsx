import { useMemo, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  RangeField,
  RelatedTools,
} from "../../../components/devtools/DevToolUI";
import { CrossIcon } from "../../../components/Icon";

const newLayer = (overrides = {}) => ({
  id: crypto.randomUUID(),
  x: 0,
  y: 12,
  blur: 30,
  spread: -8,
  color: "#ff4d1c",
  opacity: 0.45,
  inset: false,
  ...overrides,
});

const toRgba = (hex, opacity) => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Stacked box-shadow layers with a live preview. */
export default function BoxShadowGenerator({ toolId }) {
  const [layers, setLayers] = useState([newLayer()]);
  const [active, setActive] = useState(0);

  const css = useMemo(
    () =>
      layers
        .map(
          (layer) =>
            `${layer.inset ? "inset " : ""}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${toRgba(layer.color, layer.opacity)}`,
        )
        .join(", "),
    [layers],
  );

  const layer = layers[Math.min(active, layers.length - 1)];
  const update = (patch) =>
    setLayers((current) =>
      current.map((entry, index) => (index === active ? { ...entry, ...patch } : entry)),
    );

  const declaration = `box-shadow: ${css};`;

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Layers</PaneLabel>

          <div className="mb-4 space-y-1.5">
            {layers.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={index === active}
                  className={`min-w-0 flex-1 border px-3 py-2 text-left font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors ${
                    index === active
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  Layer {index + 1}
                  {entry.inset ? " · inset" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayers((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
                    setActive(0);
                  }}
                  disabled={layers.length <= 1}
                  aria-label={`Remove layer ${index + 1}`}
                  className="shrink-0 p-1.5 text-white/30 transition-colors hover:text-red-400 disabled:opacity-20"
                >
                  <CrossIcon style="w-4 h-4" />
                </button>
              </div>
            ))}
            <Btn
              variant="ghost"
              className="w-full !px-3 !py-2"
              onClick={() => {
                setLayers((current) => [...current, newLayer({ y: 4, blur: 12, spread: 0, opacity: 0.3 })]);
                setActive(layers.length);
              }}
            >
              Add layer
            </Btn>
          </div>

          {layer ? (
            <div className="space-y-4 border-t border-white/[0.08] pt-4">
              <RangeField label="Offset X" value={layer.x} onChange={(v) => update({ x: v })} min={-60} max={60} suffix="px" />
              <RangeField label="Offset Y" value={layer.y} onChange={(v) => update({ y: v })} min={-60} max={60} suffix="px" />
              <RangeField label="Blur" value={layer.blur} onChange={(v) => update({ blur: v })} min={0} max={120} suffix="px" />
              <RangeField label="Spread" value={layer.spread} onChange={(v) => update({ spread: v })} min={-60} max={60} suffix="px" />
              <RangeField
                label="Opacity"
                value={layer.opacity}
                onChange={(v) => update({ opacity: v })}
                min={0}
                max={1}
                step={0.01}
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={layer.color}
                  onChange={(event) => update({ color: event.target.value })}
                  aria-label="Shadow colour"
                  className="h-9 w-10 shrink-0 cursor-pointer border border-white/10 bg-transparent"
                />
                <input
                  value={layer.color}
                  onChange={(event) => update({ color: event.target.value })}
                  aria-label="Shadow colour value"
                  spellCheck={false}
                  className={`${INPUT} min-w-0 flex-1 font-mono !py-2 !text-xs`}
                />
              </div>
              <CheckField label="Inset" checked={layer.inset} onChange={(v) => update({ inset: v })} />
            </div>
          ) : null}

          <Btn
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => {
              setLayers([newLayer()]);
              setActive(0);
            }}
          >
            Reset
          </Btn>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Preview</PaneLabel>
            <div className="flex min-h-[18rem] items-center justify-center border border-white/[0.08] bg-[#0f0f0f] p-10">
              <div
                className="h-36 w-56 border border-white/[0.08] bg-[#1a1a1a]"
                style={{ boxShadow: css }}
                aria-label="Box shadow preview"
              />
            </div>
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={declaration} label="Copy CSS" />}>CSS</PaneLabel>
            <CodeField value={declaration} readOnly ariaLabel="Generated CSS" rows={3} />
          </Panel>
        </div>
      </div>

      <RelatedTools ids={["gradient-generator", "border-radius-generator", "color-converter"]} />
    </DevToolPage>
  );
}
