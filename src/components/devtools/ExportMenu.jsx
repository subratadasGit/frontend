import { useEffect, useRef, useState } from "react";
import { Btn, Panel } from "../ui/AppUI";
import { Download } from "../Icon";
import { OptionGroup, ToolNote } from "./DevToolUI";
import { downloadBlob } from "../../utils/global";
import { BACKGROUNDS, PDF_PAGE_SIZES, exportPdf, exportPng, exportSvg } from "../../devtools/diagramExport";

/**
 * One export surface rather than download buttons scattered through the page.
 *
 * Formats that cannot work for the current state are shown disabled with the
 * reason, instead of being hidden — a missing option is more confusing than a
 * greyed-out one that explains itself.
 */
export default function ExportMenu({ svg, stats, sources = [], filename = "schema-diagram" }) {
  const [open, setOpen] = useState(false);
  const [background, setBackground] = useState("theme");
  const [scale, setScale] = useState(2);
  const [pageSize, setPageSize] = useState("a4landscape");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  // Close on outside click and on Escape, like any menu in the product.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (format) => {
    if (!svg) return;
    setBusy(format);
    setError(null);
    try {
      if (format === "svg") {
        downloadBlob(exportSvg(svg, { background }), `${filename}.svg`);
      } else if (format === "png") {
        downloadBlob(await exportPng(svg, { scale, background }), `${filename}.png`);
      } else if (format === "pdf") {
        downloadBlob(
          await exportPdf(svg, {
            stats,
            pageSize,
            background: background === "transparent" ? "white" : background,
            scale: Math.max(2, scale),
          }),
          `${filename}.pdf`,
        );
      }
    } catch (caught) {
      setError(caught.message || "The export failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Btn onClick={() => setOpen((current) => !current)} aria-expanded={open} disabled={!svg}>
        <Download style="w-4 h-4" />
        Export
        <span aria-hidden="true" className="ml-0.5 text-[0.625rem]">
          ▾
        </span>
      </Btn>

      {open ? (
        <Panel className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] !p-4 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9)]">
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Diagram
          </p>

          <div className="mt-3 space-y-4">
            <OptionGroup
              label="Background"
              value={background}
              onChange={setBackground}
              options={BACKGROUNDS.map((entry) => ({ id: entry.id, label: entry.label }))}
            />

            <OptionGroup
              label="Resolution"
              value={String(scale)}
              onChange={(value) => setScale(Number(value))}
              options={[
                { id: "1", label: "1×" },
                { id: "2", label: "2×" },
                { id: "3", label: "3×" },
                { id: "4", label: "4×" },
              ]}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormatButton onClick={() => run("png")} busy={busy === "png"} label="PNG" hint="Raster" />
              <FormatButton onClick={() => run("svg")} busy={busy === "svg"} label="SVG" hint="Vector" />
              <FormatButton onClick={() => run("pdf")} busy={busy === "pdf"} label="PDF" hint="Document" />
            </div>

            {background === "transparent" ? (
              <ToolNote>
                PDF has no transparent background, so a PDF export uses white.
                PNG and SVG honour the choice.
              </ToolNote>
            ) : null}

            <div>
              <OptionGroup
                label="PDF page size"
                value={pageSize}
                onChange={setPageSize}
                options={PDF_PAGE_SIZES}
              />
              <p className="mt-2 text-[0.6875rem] text-white/35">
                A diagram taller than one page is split across sheets rather
                than shrunk until it is unreadable.
              </p>
            </div>
          </div>

          {sources.length > 0 ? (
            <>
              <p className="mt-5 border-t border-white/[0.08] pt-4 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
                Source
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map((source) => (
                  <button
                    key={source.label}
                    type="button"
                    disabled={!source.value}
                    title={source.value ? undefined : source.unavailable}
                    onClick={() =>
                      downloadBlob(
                        new Blob([source.value], { type: source.type || "text/plain;charset=utf-8" }),
                        source.filename,
                      )
                    }
                    className="border border-white/10 px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] text-white/60 uppercase transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60"
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <p className="mt-4 font-mono text-[0.5625rem] tracking-[0.14em] text-white/25 uppercase">
            ● Rendered and exported locally
          </p>
        </Panel>
      ) : null}
    </div>
  );
}

function FormatButton({ label, hint, onClick, busy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="border border-white/10 px-3 py-2.5 text-center transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c] disabled:opacity-40"
    >
      <span className="block font-mono text-[0.6875rem] tracking-[0.14em] uppercase">
        {busy ? "…" : label}
      </span>
      <span className="mt-0.5 block text-[0.5625rem] text-white/35">{hint}</span>
    </button>
  );
}
