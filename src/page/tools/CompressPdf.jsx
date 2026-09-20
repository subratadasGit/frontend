import { useState } from "react";
import { compressPdf, COMPRESSION_PRESETS } from "../../utils/pdfCompression";
import { formatBytes } from "../../utils/fileTools";
import {
  FileDrop,
  FileQueue,
  PrivacyNote,
  ResultList,
  ToolError,
  ToolNotice,
} from "../../components/tools/FileTools";
import { Btn, LABEL, Page, PageHeader, Panel } from "../../components/ui/AppUI";
import { LoadingIcon } from "../../components/Icon";

/**
 * Shrinks a PDF by rasterising each page and rebuilding it as JPEGs.
 *
 * That trade-off — smaller file, no more selectable text — is real, so it is
 * said plainly rather than left for the download to reveal.
 */
export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [presetId, setPresetId] = useState("medium");
  const [scale, setScale] = useState(1.15);
  const [quality, setQuality] = useState(0.68);
  const [outputs, setOutputs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const choosePreset = (preset) => {
    setPresetId(preset.id);
    if (preset.scale != null) setScale(preset.scale);
    if (preset.quality != null) setQuality(preset.quality);
  };

  const pick = ([incoming]) => {
    setFile(incoming);
    setOutputs([]);
    setError(null);
    setNotice(null);
  };

  const reset = () => {
    setFile(null);
    setOutputs([]);
    setError(null);
    setNotice(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setOutputs([]);

    try {
      const result = await compressPdf(file, {
        scale,
        quality,
        onProgress: (done, total) => setProgress(`page ${done} / ${total}`),
      });

      setOutputs([
        {
          name: result.name,
          blob: result.blob,
          meta: `${result.pageCount} pages · ${formatBytes(result.originalSize)} → ${formatBytes(
            result.compressedSize,
          )}`,
        },
      ]);

      if (result.grew) {
        setNotice(
          "The result is larger than the original. This PDF is likely already text-based rather than scanned — rasterising pages does not help it, so the original file is probably the better one to keep.",
        );
      }
    } catch (caught) {
      setError(caught.message || "Compression failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Compress PDF"
        description="Best for scanned documents and image-heavy exports — pages are rasterised and re-encoded at the resolution and quality you choose."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {file ? (
            <FileQueue files={[file]} title="Source" onRemove={reset} onClear={reset} />
          ) : (
            <FileDrop
              accept="application/pdf,.pdf"
              onFiles={pick}
              label="Drop a PDF here"
              hint="One document at a time."
            />
          )}

          <ToolNotice>
            This rasterises every page to a JPEG image, which shrinks scanned
            documents and image-heavy PDFs dramatically — but the output loses
            selectable text and sharp vector lines. For a text-based PDF, this
            is usually the wrong tool.
          </ToolNotice>

          <ToolError>{error}</ToolError>
          <ToolNotice>{notice}</ToolNotice>
          <ResultList outputs={outputs} onReset={reset} />
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Compression
          </h2>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {COMPRESSION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => choosePreset(preset)}
                aria-pressed={presetId === preset.id}
                className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors ${
                  presetId === preset.id
                    ? "border-[#ff4d1c] text-[#ff4d1c]"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="pdf-scale" className={LABEL}>
                Resolution — {scale.toFixed(2)}× (~{Math.round(scale * 72)} DPI)
              </label>
              <input
                id="pdf-scale"
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(event) => {
                  setPresetId("custom");
                  setScale(Number(event.target.value));
                }}
                className="editor-range w-full"
              />
            </div>

            <div>
              <label htmlFor="pdf-quality" className={LABEL}>
                JPEG quality — {Math.round(quality * 100)}%
              </label>
              <input
                id="pdf-quality"
                type="range"
                min="0.2"
                max="0.95"
                step="0.01"
                value={quality}
                onChange={(event) => {
                  setPresetId("custom");
                  setQuality(Number(event.target.value));
                }}
                className="editor-range w-full"
              />
            </div>
          </div>

          <Btn
            onClick={handleCompress}
            disabled={busy || !file}
            className="mt-6 w-full !py-3.5"
          >
            {busy ? (
              <>
                <LoadingIcon style="animate-spin h-4 w-4" />
                <span>Compressing{progress ? ` — ${progress}` : "…"}</span>
              </>
            ) : (
              <span>Compress PDF</span>
            )}
          </Btn>

          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <PrivacyNote />
          </div>
        </Panel>
      </div>
    </Page>
  );
}
