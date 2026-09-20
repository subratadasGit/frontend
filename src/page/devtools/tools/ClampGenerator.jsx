import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DataRow,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  RelatedTools,
  TextField,
  ToolNote,
} from "../../../components/devtools/DevToolUI";

const ROOT_FONT_SIZE = 16;

/** Fluid `clamp()` values derived from two breakpoints. */
export default function ClampGenerator({ toolId }) {
  const [minSize, setMinSize] = useState(16);
  const [maxSize, setMaxSize] = useState(32);
  const [minWidth, setMinWidth] = useState(320);
  const [maxWidth, setMaxWidth] = useState(1280);
  const [unit, setUnit] = useState("rem");
  const [property, setProperty] = useState("font-size");

  const result = useMemo(() => {
    const span = maxWidth - minWidth;
    if (span === 0) return null;

    // Slope form: value = slope * viewport + intercept, expressed as
    // `calc(<intercept>rem + <slope*100>vw)` — the standard fluid formula.
    const slope = (maxSize - minSize) / span;
    const intercept = minSize - slope * minWidth;

    const toUnit = (pixels) => (unit === "rem" ? pixels / ROOT_FONT_SIZE : pixels);
    const round = (value) => Number(value.toFixed(4));

    const minOut = `${round(toUnit(minSize))}${unit}`;
    const maxOut = `${round(toUnit(maxSize))}${unit}`;
    const interceptOut = `${round(toUnit(intercept))}${unit}`;
    const slopeOut = `${round(slope * 100)}vw`;

    const preferred =
      round(toUnit(intercept)) === 0 ? slopeOut : `${interceptOut} + ${slopeOut}`;

    return {
      value: `clamp(${minOut}, ${preferred}, ${maxOut})`,
      slope,
      intercept,
      minOut,
      maxOut,
    };
  }, [minSize, maxSize, minWidth, maxWidth, unit]);

  const declaration = result ? `${property}: ${result.value};` : "";

  // Sample the curve so the table shows what the value actually resolves to.
  const samples = useMemo(() => {
    if (!result) return [];
    return [minWidth, Math.round((minWidth + maxWidth) / 2), maxWidth].map((width) => {
      const raw = result.slope * width + result.intercept;
      const clamped = Math.min(Math.max(raw, Math.min(minSize, maxSize)), Math.max(minSize, maxSize));
      return { width, size: Number(clamped.toFixed(2)) };
    });
  }, [result, minWidth, maxWidth, minSize, maxSize]);

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Inputs</PaneLabel>
          <div className="space-y-4">
            <OptionGroup
              label="Property"
              value={property}
              onChange={setProperty}
              options={[
                { id: "font-size", label: "font-size" },
                { id: "padding", label: "padding" },
                { id: "gap", label: "gap" },
                { id: "margin-block", label: "margin" },
              ]}
            />
            <OptionGroup
              label="Output unit"
              value={unit}
              onChange={setUnit}
              options={[
                { id: "rem", label: "rem" },
                { id: "px", label: "px" },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Min size (px)"
                type="number"
                value={minSize}
                onChange={(value) => setMinSize(Number(value))}
              />
              <TextField
                label="Max size (px)"
                type="number"
                value={maxSize}
                onChange={(value) => setMaxSize(Number(value))}
              />
              <TextField
                label="Min viewport"
                type="number"
                value={minWidth}
                onChange={(value) => setMinWidth(Number(value))}
              />
              <TextField
                label="Max viewport"
                type="number"
                value={maxWidth}
                onChange={(value) => setMaxWidth(Number(value))}
              />
            </div>

            <ToolNote>
              Sizes are entered in pixels because that is how designs are
              specified; the output converts to {unit} for you. rem output
              assumes a 16px root and respects the reader's browser font size,
              which px does not.
            </ToolNote>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={declaration} label="Copy CSS" />}>CSS</PaneLabel>
            {result ? (
              <CodeField value={declaration} readOnly ariaLabel="Generated CSS" rows={3} />
            ) : (
              <ToolNote>
                The minimum and maximum viewport widths must differ.
              </ToolNote>
            )}
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Live preview</PaneLabel>
            <div className="border border-white/[0.08] bg-[#0f0f0f] p-6">
              <p
                className="leading-snug font-semibold tracking-[-0.02em] text-white"
                style={result ? { [property]: result.value } : undefined}
              >
                Resize the window to watch this scale.
              </p>
            </div>
            <p className="mt-2 text-xs text-white/35">
              This paragraph has the generated declaration applied, so the
              preview is the real thing rather than a simulation.
            </p>
          </Panel>

          {samples.length > 0 ? (
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Resolved values</PaneLabel>
              <dl>
                {samples.map((sample) => (
                  <DataRow
                    key={sample.width}
                    label={`${sample.width}px viewport`}
                    value={`${sample.size}px`}
                  />
                ))}
              </dl>
            </Panel>
          ) : null}
        </div>
      </div>

      <RelatedTools ids={["color-converter", "gradient-generator", "border-radius-generator"]} />
    </DevToolPage>
  );
}
