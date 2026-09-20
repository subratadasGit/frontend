import { useEffect, useRef, useState } from "react";
import {
  Btn,
  INPUT,
  LABEL,
  Page,
  PageHeader,
  Panel,
} from "../../components/ui/AppUI";
import { PrivacyNote, ToolError } from "../../components/tools/FileTools";
import { Download } from "../../components/Icon";
import { downloadBlob } from "../../utils/global";
import { BARCODE_FORMATS, renderBarcodeToCanvas } from "../../utils/barcodeTools";

/** Linear barcodes across nine formats, rendered live as you type. */
export default function BarcodeGenerator() {
  const canvasRef = useRef(null);
  const [format, setFormat] = useState("CODE128");
  const [value, setValue] = useState("CREATES-000001");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  const activeFormat = BARCODE_FORMATS.find((entry) => entry.id === format);

  // The render itself is synchronous (JsBarcode draws immediately), but it is
  // still deferred into a microtask so every state update happens inside a
  // `.then()`/`.catch()` callback rather than directly in the effect body.
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;

    Promise.resolve()
      .then(() => {
        if (!value.trim()) throw new Error("Enter a value to encode.");
        renderBarcodeToCanvas(canvas, value, {
          format,
          width,
          height,
          displayValue,
          lineColor: "#050505",
          background: "#ffffff",
        });
      })
      .then(() => {
        if (cancelled) return;
        setError(null);
        setRendered(true);
      })
      .catch((caught) => {
        if (cancelled) return;
        setRendered(false);
        setError(caught.message || "This value could not be encoded.");
        const ctx = canvas?.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      });

    return () => {
      cancelled = true;
    };
  }, [format, value, width, height, displayValue]);

  const exportPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, `barcode-${format.toLowerCase()}.png`);
    }, "image/png");
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Barcode Generator"
        description="Nine linear formats — Code 128 for general use, plus the retail and logistics standards."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Panel>
            <label htmlFor="barcode-value" className={LABEL}>
              Value
            </label>
            <input
              id="barcode-value"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={INPUT}
            />
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              {activeFormat?.hint}
            </p>
          </Panel>

          <ToolError>{error}</ToolError>

          <Panel className="flex items-center justify-center overflow-x-auto bg-white p-6">
            <canvas ref={canvasRef} className={rendered ? "" : "hidden"} />
            {!rendered && !error ? (
              <p className="text-sm text-black/40">Rendering…</p>
            ) : null}
          </Panel>
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Format
          </h2>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {BARCODE_FORMATS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFormat(entry.id)}
                aria-pressed={format === entry.id}
                className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors ${
                  format === entry.id
                    ? "border-[#ff4d1c] text-[#ff4d1c]"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="bar-width" className={LABEL}>
                Bar width — {width}px
              </label>
              <input
                id="bar-width"
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="editor-range w-full"
              />
            </div>

            <div>
              <label htmlFor="bar-height" className={LABEL}>
                Height — {height}px
              </label>
              <input
                id="bar-height"
                type="range"
                min="40"
                max="220"
                step="10"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="editor-range w-full"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={displayValue}
                onChange={(event) => setDisplayValue(event.target.checked)}
                className="h-3.5 w-3.5 accent-[#ff4d1c]"
              />
              Show the value under the bars
            </label>
          </div>

          <Btn onClick={exportPng} disabled={!rendered} className="mt-6 w-full !py-3.5">
            <Download style="w-4 h-4" />
            Export PNG
          </Btn>

          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <PrivacyNote />
          </div>
        </Panel>
      </div>
    </Page>
  );
}
