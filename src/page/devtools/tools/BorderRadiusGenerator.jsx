import { useMemo, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  OptionGroup,
  PaneLabel,
  RangeField,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";

const CORNERS = [
  { id: "tl", label: "Top left" },
  { id: "tr", label: "Top right" },
  { id: "br", label: "Bottom right" },
  { id: "bl", label: "Bottom left" },
];

const DEFAULTS = { tl: 16, tr: 16, br: 16, bl: 16 };

/** Per-corner and elliptical border radii with a live preview. */
export default function BorderRadiusGenerator({ toolId }) {
  const [unit, setUnit] = useState("px");
  const [linked, setLinked] = useState(true);
  const [radii, setRadii] = useState(DEFAULTS);
  const [elliptical, setElliptical] = useState(false);
  const [vertical, setVertical] = useState(DEFAULTS);

  const max = unit === "%" ? 50 : 120;

  const setCorner = (corner, value) => {
    if (linked) {
      setRadii({ tl: value, tr: value, br: value, bl: value });
      setVertical({ tl: value, tr: value, br: value, bl: value });
    } else {
      setRadii((current) => ({ ...current, [corner]: value }));
    }
  };

  const css = useMemo(() => {
    const h = `${radii.tl}${unit} ${radii.tr}${unit} ${radii.br}${unit} ${radii.bl}${unit}`;
    if (!elliptical) return h;
    const v = `${vertical.tl}${unit} ${vertical.tr}${unit} ${vertical.br}${unit} ${vertical.bl}${unit}`;
    return `${h} / ${v}`;
  }, [radii, vertical, unit, elliptical]);

  const declaration = `border-radius: ${css};`;

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Radius</PaneLabel>
          <div className="space-y-5">
            <OptionGroup
              label="Unit"
              value={unit}
              onChange={setUnit}
              options={[
                { id: "px", label: "px" },
                { id: "%", label: "%" },
                { id: "rem", label: "rem" },
              ]}
            />

            <CheckField label="Link all corners" checked={linked} onChange={setLinked} />

            {CORNERS.map((corner) => (
              <RangeField
                key={corner.id}
                label={corner.label}
                value={radii[corner.id]}
                onChange={(value) => setCorner(corner.id, value)}
                min={0}
                max={unit === "rem" ? 8 : max}
                step={unit === "rem" ? 0.1 : 1}
                suffix={unit}
              />
            ))}

            <div className="border-t border-white/[0.08] pt-4">
              <CheckField
                label="Elliptical (separate vertical radii)"
                checked={elliptical}
                onChange={setElliptical}
              />
            </div>

            {elliptical ? (
              <div className="space-y-4">
                {CORNERS.map((corner) => (
                  <RangeField
                    key={`v-${corner.id}`}
                    label={`${corner.label} — vertical`}
                    value={vertical[corner.id]}
                    onChange={(value) => setVertical((current) => ({ ...current, [corner.id]: value }))}
                    min={0}
                    max={unit === "rem" ? 8 : max}
                    step={unit === "rem" ? 0.1 : 1}
                    suffix={unit}
                  />
                ))}
              </div>
            ) : null}

            <Btn
              variant="ghost"
              className="w-full"
              onClick={() => {
                setRadii(DEFAULTS);
                setVertical(DEFAULTS);
                setElliptical(false);
                setLinked(true);
                setUnit("px");
              }}
            >
              Reset
            </Btn>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Preview</PaneLabel>
            <div className="flex min-h-[18rem] items-center justify-center border border-white/[0.08] bg-[#0f0f0f] p-10">
              <div
                className="h-48 w-64 border border-[#ff4d1c]/40 bg-gradient-to-br from-[#ff4d1c]/30 to-[#7c3aed]/30"
                style={{ borderRadius: css }}
                aria-label="Border radius preview"
              />
            </div>
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={declaration} label="Copy CSS" />}>CSS</PaneLabel>
            <CodeField value={declaration} readOnly ariaLabel="Generated CSS" rows={3} />
            {elliptical ? (
              <div className="mt-3">
                <ToolNote>
                  The values before the slash are horizontal radii and the ones
                  after are vertical, which is what makes the corners elliptical
                  rather than circular.
                </ToolNote>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>

      <RelatedTools ids={["box-shadow-generator", "gradient-generator", "css-clamp-generator"]} />
    </DevToolPage>
  );
}
