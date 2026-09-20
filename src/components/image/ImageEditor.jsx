import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Btn, LABEL } from "../ui/AppUI";
import { Download, ErrorIcon } from "../Icon";
import { downloadBlob } from "../../utils/global";
import {
  ADJUSTMENT_CONTROLS,
  DEFAULT_ADJUSTMENTS,
  EXPORT_FORMATS,
  PRESETS,
  cropCanvas,
  exportCanvas,
  flipCanvas,
  isNeutral,
  loadImageToCanvas,
  paintWithAdjustments,
  resizeCanvas,
  rotateCanvas,
} from "../../utils/imageEditing";

/**
 * Non-destructive editor for a generated image.
 *
 * Everything runs in the browser on a canvas — the CDN original is never
 * re-uploaded or replaced, so editing is free and instant, and the export is
 * whatever the preview is showing.
 *
 * Geometry (rotate, flip, crop) is baked into a working canvas as you apply it,
 * with an undo stack; the adjustment sliders stay live on top of that canvas so
 * they can be dragged back to neutral without any loss.
 */

const CROP_RATIOS = [
  { id: "free", label: "Free", value: null },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "3:4", label: "3:4", value: 3 / 4 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "9:16", label: "9:16", value: 9 / 16 },
];

const SCALES = [1, 0.75, 0.5, 0.25];

const FULL_CROP = { x: 0, y: 0, width: 1, height: 1 };
const MIN_CROP = 0.06;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ImageEditor({ src, onClose }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const [working, setWorking] = useState(null);
  const [history, setHistory] = useState([]);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
  const [preset, setPreset] = useState("none");

  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState(FULL_CROP);
  const [ratio, setRatio] = useState("free");

  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(1);
  const [filename, setFilename] = useState("creates-image");

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const originalRef = useRef(null);

  /* ------------------------------ Source load ----------------------------- */

  useEffect(() => {
    let cancelled = false;

    loadImageToCanvas(src)
      .then((canvas) => {
        if (cancelled) return;
        originalRef.current = canvas;
        setWorking(canvas);
        setHistory([]);
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setPreset("none");
        setCrop(FULL_CROP);
        setCropping(false);
        setStatus("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught.message || "The image could not be loaded for editing.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  /* -------------------------------- Preview ------------------------------- */

  useEffect(() => {
    if (!working || !canvasRef.current) return;
    paintWithAdjustments(canvasRef.current, working, adjustments);
  }, [working, adjustments]);

  /* ------------------------------- Geometry ------------------------------- */

  const bake = useCallback(
    (produce) => {
      if (!working) return;
      const next = produce(working);
      if (next === working) return;
      setHistory((stack) => [...stack, working]);
      setWorking(next);
    },
    [working],
  );

  const undo = () => {
    if (history.length === 0) return;
    setWorking(history[history.length - 1]);
    setHistory((stack) => stack.slice(0, -1));
    setCrop(FULL_CROP);
  };

  const resetAll = () => {
    if (!originalRef.current) return;
    setWorking(originalRef.current);
    setHistory([]);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setPreset("none");
    setCrop(FULL_CROP);
    setCropping(false);
    setScale(1);
  };

  const applyCrop = () => {
    bake((current) => cropCanvas(current, crop));
    setCrop(FULL_CROP);
    setCropping(false);
  };

  /* --------------------------- Crop rect dragging ------------------------- */

  const aspect = CROP_RATIOS.find((entry) => entry.id === ratio)?.value ?? null;

  /**
   * Converts a pixel aspect ratio into the normalised height that matches a
   * given normalised width on the current canvas.
   */
  const heightForWidth = useCallback(
    (width) => {
      if (!aspect || !working) return null;
      return (width * working.width) / (aspect * working.height);
    },
    [aspect, working],
  );

  /** Locks the crop rectangle to a ratio, re-fitting it inside the canvas. */
  const chooseRatio = (id) => {
    setRatio(id);
    const value = CROP_RATIOS.find((entry) => entry.id === id)?.value ?? null;
    if (!value || !working) return;

    setCrop((current) => {
      let width = current.width;
      let height = (width * working.width) / (value * working.height);
      if (height > 1) {
        height = 1;
        width = (height * value * working.height) / working.width;
      }
      return {
        width,
        height,
        x: clamp(current.x, 0, 1 - width),
        y: clamp(current.y, 0, 1 - height),
      };
    });
  };

  const beginDrag = (event, mode) => {
    if (!frameRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const bounds = frameRef.current.getBoundingClientRect();
    dragRef.current = {
      mode,
      bounds,
      startX: event.clientX,
      startY: event.clientY,
      start: crop,
    };
  };

  const onDragMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = (event.clientX - drag.startX) / drag.bounds.width;
    const dy = (event.clientY - drag.startY) / drag.bounds.height;
    const start = drag.start;

    if (drag.mode === "move") {
      setCrop({
        ...start,
        x: clamp(start.x + dx, 0, 1 - start.width),
        y: clamp(start.y + dy, 0, 1 - start.height),
      });
      return;
    }

    const west = drag.mode.includes("w");
    const north = drag.mode.includes("n");

    // Corner drags move one edge; the opposite edge is the fixed anchor.
    const anchorX = west ? start.x + start.width : start.x;
    const anchorY = north ? start.y + start.height : start.y;

    let width = clamp(
      west ? start.width - dx : start.width + dx,
      MIN_CROP,
      west ? anchorX : 1 - anchorX,
    );
    let height = clamp(
      north ? start.height - dy : start.height + dy,
      MIN_CROP,
      north ? anchorY : 1 - anchorY,
    );

    if (aspect) {
      // Drive height from width, then walk width back if height hit a wall.
      height = heightForWidth(width);
      const maxHeight = north ? anchorY : 1 - anchorY;
      if (height > maxHeight) {
        height = maxHeight;
        width = (height * aspect * working.height) / working.width;
      }
      if (height < MIN_CROP) return;
    }

    setCrop({
      x: west ? anchorX - width : anchorX,
      y: north ? anchorY - height : anchorY,
      width,
      height,
    });
  };

  const endDrag = (event) => {
    if (!dragRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  /* -------------------------------- Export -------------------------------- */

  const activeFormat =
    EXPORT_FORMATS.find((entry) => entry.id === format) || EXPORT_FORMATS[0];

  const outputSize = useMemo(() => {
    if (!working) return null;
    return {
      width: Math.max(1, Math.round(working.width * scale)),
      height: Math.max(1, Math.round(working.height * scale)),
    };
  }, [working, scale]);

  const handleExport = async () => {
    if (!working) return;
    setExporting(true);
    setError(null);
    try {
      const sized =
        scale === 1
          ? working
          : resizeCanvas(working, outputSize.width, outputSize.height);
      const { blob, extension } = await exportCanvas(sized, {
        format,
        quality,
        adjustments,
      });
      const safeName =
        (filename || "creates-image").trim().replace(/[\\/:*?"<>|]+/g, "-") ||
        "creates-image";
      downloadBlob(blob, `${safeName}.${extension}`);
    } catch (caught) {
      setError(caught.message || "Export failed. Try a different format.");
    } finally {
      setExporting(false);
    }
  };

  /* -------------------------------- Render -------------------------------- */

  if (status === "loading") {
    return (
      <div className="border border-white/[0.08] bg-black px-6 py-16 text-center">
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/40 uppercase">
          Preparing editor…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <p
          role="alert"
          className="flex items-start gap-2 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
        >
          <ErrorIcon style="w-5 h-5 shrink-0" />
          {error}
        </p>
        {onClose ? (
          <Btn variant="ghost" onClick={onClose}>
            Close editor
          </Btn>
        ) : null}
      </div>
    );
  }

  const dirty =
    history.length > 0 || !isNeutral(adjustments) || scale !== 1;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Canvas */}
        <div>
          <div
            ref={frameRef}
            className="relative overflow-hidden border border-white/[0.08] bg-black select-none"
          >
            <canvas ref={canvasRef} className="block h-auto w-full" />

            {cropping ? (
              <>
                <div
                  className="absolute cursor-move"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
                    outline: "1px solid rgba(255,255,255,0.9)",
                  }}
                  onPointerDown={(event) => beginDrag(event, "move")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  {/* Thirds guides */}
                  <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/25" />
                  <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/25" />
                  <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/25" />
                  <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/25" />
                </div>

                {["nw", "ne", "sw", "se"].map((corner) => {
                  const north = corner[0] === "n";
                  const west = corner[1] === "w";
                  return (
                    <span
                      key={corner}
                      role="presentation"
                      onPointerDown={(event) => beginDrag(event, corner)}
                      onPointerMove={onDragMove}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="absolute h-5 w-5 border-2 border-[#ff4d1c] bg-black/40"
                      style={{
                        left: `calc(${
                          (west ? crop.x : crop.x + crop.width) * 100
                        }% - 10px)`,
                        top: `calc(${
                          (north ? crop.y : crop.y + crop.height) * 100
                        }% - 10px)`,
                        cursor: `${corner}-resize`,
                        touchAction: "none",
                      }}
                    />
                  );
                })}
              </>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.625rem] tracking-[0.18em] text-white/35 uppercase">
              {working.width} × {working.height}
              {outputSize && scale !== 1
                ? ` → ${outputSize.width} × ${outputSize.height}`
                : ""}
            </p>
            {cropping ? (
              <p className="font-mono text-[0.625rem] tracking-[0.18em] text-[#ff4d1c] uppercase">
                Crop {Math.round(crop.width * working.width)} ×{" "}
                {Math.round(crop.height * working.height)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Transform */}
          <ControlGroup title="Transform">
            <div className="grid grid-cols-2 gap-2">
              <ToolButton onClick={() => bake((c) => rotateCanvas(c, -90))}>
                Rotate ←
              </ToolButton>
              <ToolButton onClick={() => bake((c) => rotateCanvas(c, 90))}>
                Rotate →
              </ToolButton>
              <ToolButton onClick={() => bake((c) => flipCanvas(c, "x"))}>
                Flip H
              </ToolButton>
              <ToolButton onClick={() => bake((c) => flipCanvas(c, "y"))}>
                Flip V
              </ToolButton>
            </div>
          </ControlGroup>

          {/* Crop */}
          <ControlGroup title="Crop">
            {cropping ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {CROP_RATIOS.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => chooseRatio(entry.id)}
                      aria-pressed={ratio === entry.id}
                      className={`border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors ${
                        ratio === entry.id
                          ? "border-[#ff4d1c] text-[#ff4d1c]"
                          : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <ToolButton onClick={applyCrop} accent>
                    Apply crop
                  </ToolButton>
                  <ToolButton
                    onClick={() => {
                      setCropping(false);
                      setCrop(FULL_CROP);
                    }}
                  >
                    Cancel
                  </ToolButton>
                </div>
              </div>
            ) : (
              <ToolButton
                onClick={() => {
                  setCrop({ x: 0.08, y: 0.08, width: 0.84, height: 0.84 });
                  setRatio("free");
                  setCropping(true);
                }}
              >
                Start crop
              </ToolButton>
            )}
          </ControlGroup>

          {/* Looks */}
          <ControlGroup title="Looks">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setPreset(entry.id);
                    setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...entry.values });
                  }}
                  aria-pressed={preset === entry.id}
                  className={`border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors ${
                    preset === entry.id
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </ControlGroup>

          {/* Adjustments */}
          <ControlGroup title="Adjust">
            <div className="space-y-3.5">
              {ADJUSTMENT_CONTROLS.map((control) => (
                <div key={control.key}>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`adjust-${control.key}`}
                      className="font-mono text-[0.625rem] tracking-[0.12em] text-white/50 uppercase"
                    >
                      {control.label}
                    </label>
                    <span className="font-mono text-[0.625rem] text-white/35 tabular-nums">
                      {adjustments[control.key]}
                      {control.unit}
                    </span>
                  </div>
                  <input
                    id={`adjust-${control.key}`}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={adjustments[control.key]}
                    onChange={(event) => {
                      setPreset("custom");
                      setAdjustments((current) => ({
                        ...current,
                        [control.key]: Number(event.target.value),
                      }));
                    }}
                    className="editor-range mt-1.5 w-full"
                  />
                </div>
              ))}
            </div>
          </ControlGroup>

          <div className="flex gap-2">
            <ToolButton onClick={undo} disabled={history.length === 0}>
              Undo
            </ToolButton>
            <ToolButton onClick={resetAll} disabled={!dirty}>
              Reset
            </ToolButton>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="border border-white/[0.08] bg-black p-5 sm:p-6">
        <h3 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          Export
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className={LABEL}>Format</span>
            <div className="flex flex-wrap gap-1.5">
              {EXPORT_FORMATS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFormat(entry.id)}
                  aria-pressed={format === entry.id}
                  className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors ${
                    format === entry.id
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="export-name" className={LABEL}>
              File name
            </label>
            <div className="flex items-center gap-2">
              <input
                id="export-name"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="w-full border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-[#ff4d1c]"
              />
              <span className="font-mono text-xs text-white/35">
                .{activeFormat.extension}
              </span>
            </div>
          </div>

          <div>
            <span className={LABEL}>Size</span>
            <div className="flex flex-wrap gap-1.5">
              {SCALES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScale(value)}
                  aria-pressed={scale === value}
                  className={`border px-3 py-2 font-mono text-[0.625rem] uppercase transition-colors ${
                    scale === value
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {value * 100}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="export-quality" className={LABEL}>
              Quality {activeFormat.lossy ? `— ${Math.round(quality * 100)}%` : "— n/a"}
            </label>
            <input
              id="export-quality"
              type="range"
              min="0.3"
              max="1"
              step="0.01"
              value={quality}
              disabled={!activeFormat.lossy}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="editor-range w-full disabled:opacity-30"
            />
            <p className="mt-2 text-xs text-white/35">
              {activeFormat.lossy
                ? "Lossy format — lower quality means a smaller file."
                : "PNG is lossless, so quality does not apply."}
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
          >
            <ErrorIcon style="w-5 h-5 shrink-0" />
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Btn onClick={handleExport} disabled={exporting}>
            <Download style="w-4 h-4" />
            {exporting ? "Exporting…" : `Export ${activeFormat.label}`}
          </Btn>
          {onClose ? (
            <Btn variant="ghost" onClick={onClose}>
              Close editor
            </Btn>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Sub-parts -------------------------------- */

function ControlGroup({ title, children }) {
  return (
    <section className="border border-white/[0.08] bg-black p-4">
      <h3 className="mb-3 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ToolButton({ children, onClick, disabled, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        accent
          ? "border-[#ff4d1c] bg-[#ff4d1c] font-semibold text-[#0a0000] hover:bg-[#ff6a3d]"
          : "border-white/10 text-white/70 hover:border-white/35 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
