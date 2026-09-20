import { useState } from "react";
import {
  compressImage,
  compressToTarget,
} from "../../utils/imageCompression";
import { formatBytes } from "../../utils/fileTools";
import {
  FileDrop,
  FileQueue,
  PrivacyNote,
  ResultList,
  ToolError,
  ToolNotice,
} from "../../components/tools/FileTools";
import {
  Btn,
  INPUT,
  LABEL,
  Page,
  PageHeader,
  Panel,
} from "../../components/ui/AppUI";
import { LoadingIcon } from "../../components/Icon";

const FORMATS = [
  { id: "keep", label: "Keep format" },
  { id: "jpg", label: "JPG" },
  { id: "webp", label: "WEBP" },
  { id: "png", label: "PNG" },
];

const MAX_DIMENSIONS = [
  { id: "none", label: "Original", value: null },
  { id: "2560", label: "2560px", value: 2560 },
  { id: "1920", label: "1920px", value: 1920 },
  { id: "1280", label: "1280px", value: 1280 },
  { id: "800", label: "800px", value: 800 },
];

/**
 * Shrinks image files for upload or email — quality and an optional max
 * dimension, or a KB target that a binary search hits directly.
 */
export default function CompressImage() {
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState("quality");
  const [format, setFormat] = useState("jpg");
  const [quality, setQuality] = useState(0.75);
  const [maxDimension, setMaxDimension] = useState(null);
  const [targetKb, setTargetKb] = useState(200);
  const [outputs, setOutputs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const addFiles = (incoming) => {
    const images = incoming.filter((file) => file.type.startsWith("image/"));
    setError(images.length !== incoming.length ? "Only image files can be compressed — the rest were skipped." : null);
    setNotice(null);
    setFiles((current) => [...current, ...images]);
    setOutputs([]);
  };

  const reset = () => {
    setFiles([]);
    setOutputs([]);
    setError(null);
    setNotice(null);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setOutputs([]);

    const produced = [];
    let underTarget = 0;

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(files.length > 1 ? `${index + 1} / ${files.length}` : null);

        const result =
          mode === "target"
            ? await compressToTarget(file, {
                format: format === "keep" ? "jpg" : format,
                targetBytes: targetKb * 1024,
                maxDimension,
              })
            : await compressImage(file, { format, quality, maxDimension });

        if (mode === "target" && result.reachedTarget === false) underTarget += 1;

        const saved = Math.max(
          0,
          Math.round((1 - result.compressedSize / result.originalSize) * 100),
        );
        const base = file.name.replace(/\.[^.]+$/, "");
        const extension = result.mime.split("/")[1].replace("jpeg", "jpg");

        produced.push({
          name: `${base}-compressed.${extension}`,
          blob: result.blob,
          meta:
            result.compressedSize < result.originalSize
              ? `${saved}% smaller · was ${formatBytes(result.originalSize)}`
              : `larger than the original (${formatBytes(result.originalSize)}) — already well compressed`,
        });
      }

      setOutputs(produced);
      if (underTarget > 0) {
        setNotice(
          `${underTarget} file${underTarget === 1 ? "" : "s"} could not reach ${targetKb} KB even at the lowest quality — that is the smallest this can get without resizing further.`,
        );
      }
    } catch (caught) {
      setError(caught.message || "Compression failed.");
      setOutputs(produced);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Compress Image"
        description="Shrink photos for upload or email — by quality, or by a size you name."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <FileDrop
            multiple
            accept="image/*"
            onFiles={addFiles}
            label="Drop images here"
            hint="JPG, PNG, WEBP, GIF, BMP, AVIF — any format the browser can decode."
          />

          <FileQueue
            files={files}
            title="Selected"
            onRemove={(index) => {
              const next = files.filter((unused, i) => i !== index);
              setFiles(next);
              if (next.length === 0) reset();
            }}
            onClear={reset}
          />

          <ToolError>{error}</ToolError>
          <ToolNotice>{notice}</ToolNotice>
          <ResultList outputs={outputs} onReset={reset} />
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Compress by
          </h2>

          <div className="mt-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("quality")}
              aria-pressed={mode === "quality"}
              className={`flex-1 border px-3 py-2 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors ${
                mode === "quality"
                  ? "border-[#ff4d1c] text-[#ff4d1c]"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              Quality
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("target");
                // A byte target only makes sense for a lossy format.
                setFormat((current) => (current === "keep" || current === "png" ? "jpg" : current));
              }}
              aria-pressed={mode === "target"}
              className={`flex-1 border px-3 py-2 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors ${
                mode === "target"
                  ? "border-[#ff4d1c] text-[#ff4d1c]"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              Target size
            </button>
          </div>

          <div className="mt-5">
            <span className={LABEL}>Format</span>
            <div className="flex flex-wrap gap-1.5">
              {(mode === "target" ? FORMATS.filter((entry) => entry.id !== "png" && entry.id !== "keep") : FORMATS).map(
                (entry) => (
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
                ),
              )}
            </div>
            {mode === "target" ? (
              <p className="mt-2 text-xs text-white/40">
                A byte target needs a lossy format.
              </p>
            ) : null}
          </div>

          {mode === "quality" ? (
            <div className="mt-5">
              <label htmlFor="compress-quality" className={LABEL}>
                Quality — {Math.round(quality * 100)}%
              </label>
              <input
                id="compress-quality"
                type="range"
                min="0.1"
                max="0.95"
                step="0.01"
                value={quality}
                disabled={format === "png"}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="editor-range w-full disabled:opacity-30"
              />
              {format === "png" ? (
                <p className="mt-2 text-xs text-white/40">
                  PNG is lossless — quality does not apply. Use a max dimension to shrink it.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <label htmlFor="target-kb" className={LABEL}>
                Target size (KB)
              </label>
              <input
                id="target-kb"
                type="number"
                min="10"
                value={targetKb}
                onChange={(event) => setTargetKb(Number(event.target.value))}
                className={INPUT}
              />
            </div>
          )}

          <div className="mt-5">
            <span className={LABEL}>Max dimension</span>
            <div className="flex flex-wrap gap-1.5">
              {MAX_DIMENSIONS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setMaxDimension(entry.value)}
                  aria-pressed={maxDimension === entry.value}
                  className={`border px-3 py-2 font-mono text-[0.625rem] uppercase transition-colors ${
                    maxDimension === entry.value
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <Btn
            onClick={handleCompress}
            disabled={busy || files.length === 0}
            className="mt-6 w-full !py-3.5"
          >
            {busy ? (
              <>
                <LoadingIcon style="animate-spin h-4 w-4" />
                <span>Compressing{progress ? ` ${progress}` : "…"}</span>
              </>
            ) : (
              <span>Compress {files.length > 1 ? files.length : ""}</span>
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
