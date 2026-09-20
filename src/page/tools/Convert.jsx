import { useMemo, useState } from "react";
import {
  CONVERSION_TARGETS,
  convertFile,
  detectKind,
  extensionOf,
} from "../../utils/fileTools";
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
  LABEL,
  Page,
  PageHeader,
  Panel,
} from "../../components/ui/AppUI";
import { LoadingIcon } from "../../components/Icon";

/**
 * Format conversion, in the browser.
 *
 * The available targets depend on what the source actually is, so the panel is
 * driven by `detectKind` rather than by a fixed list — pick a PDF and you get
 * per-page images or extracted text; pick a CSV and you get the tabular
 * targets. What is *not* supported is stated on the page rather than left for
 * the user to discover through a failure.
 */

const KIND_LABEL = {
  image: "Image",
  pdf: "PDF",
  text: "Text / data",
  unknown: "Unsupported",
};

export default function Convert() {
  const [files, setFiles] = useState([]);
  const [target, setTarget] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);

  // Targets are only offered when every queued file shares one family, so a
  // single conversion can never half-succeed across mixed input.
  const kinds = useMemo(
    () => [...new Set(files.map((file) => detectKind(file)))],
    [files],
  );
  const kind = kinds.length === 1 ? kinds[0] : null;
  const targets = kind ? CONVERSION_TARGETS[kind] || [] : [];
  const activeTarget = targets.find((entry) => entry.id === target) || null;

  const addFiles = (incoming) => {
    setError(null);
    setNotice(null);
    setOutputs([]);
    const next = [...files, ...incoming];
    setFiles(next);

    const nextKinds = [...new Set(next.map((file) => detectKind(file)))];
    if (nextKinds.length === 1) {
      const available = CONVERSION_TARGETS[nextKinds[0]] || [];
      // Keep the current choice if it survives the new file set.
      if (!available.some((entry) => entry.id === target)) {
        setTarget(available[0]?.id ?? null);
      }
    } else {
      setTarget(null);
    }
  };

  const reset = () => {
    setFiles([]);
    setOutputs([]);
    setTarget(null);
    setError(null);
    setNotice(null);
  };

  const handleConvert = async () => {
    if (!activeTarget || files.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setOutputs([]);

    const produced = [];
    const warnings = new Set();

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(
          files.length > 1 ? `${index + 1} / ${files.length}` : null,
        );
        const result = await convertFile(file, activeTarget.id, {
          quality,
          scale,
          onProgress: (done, total) =>
            setProgress(
              files.length > 1
                ? `${index + 1} / ${files.length} · page ${done}/${total}`
                : `page ${done}/${total}`,
            ),
        });
        produced.push(...result.outputs);
        if (result.warning) warnings.add(result.warning);
      }
      setOutputs(produced);
      if (warnings.size > 0) setNotice([...warnings].join(" "));
    } catch (caught) {
      setError(caught.message || "The conversion failed.");
      // Keep whatever finished — a failure on file 4 should not discard 1–3.
      setOutputs(produced);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const rasterising = kind === "pdf" && activeTarget && activeTarget.id !== "txt";
  const lossy = activeTarget && ["jpg", "jpeg", "webp"].includes(activeTarget.id);

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Convert"
        description="Change a file's format without uploading it anywhere. The targets on offer depend on what you drop in."
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
            onFiles={addFiles}
            label="Drop files here"
            hint="Images (PNG, JPG, WEBP, GIF, BMP, AVIF, SVG), PDFs, and text or data files (TXT, MD, CSV, TSV, JSON, HTML, XML, YAML)."
          />

          <FileQueue
            files={files}
            title={kind ? `Source — ${KIND_LABEL[kind]}` : "Source"}
            onRemove={(index) => {
              const next = files.filter((unused, i) => i !== index);
              setFiles(next);
              if (next.length === 0) reset();
            }}
            onClear={reset}
          />

          {files.length > 0 && !kind ? (
            <ToolError>
              These files are of different kinds. Convert images, PDFs and text
              files in separate batches.
            </ToolError>
          ) : null}

          {kind === "unknown" ? (
            <ToolError>
              {`.${extensionOf(files[0]?.name || "")} is not a format this converter reads. It handles images, PDFs, and text or data files. Office formats (DOCX, XLSX, PPTX) are not supported — they need a server-side converter.`}
            </ToolError>
          ) : null}

          <ToolError>{error}</ToolError>
          <ToolNotice>{notice}</ToolNotice>
          <ResultList outputs={outputs} onReset={reset} />
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Convert to
          </h2>

          {targets.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              Add a file to see what it can become.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {targets.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTarget(entry.id)}
                  aria-pressed={target === entry.id}
                  className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors ${
                    target === entry.id
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}

          {rasterising ? (
            <div className="mt-5">
              <label htmlFor="raster-scale" className={LABEL}>
                Resolution — {scale}×
              </label>
              <input
                id="raster-scale"
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="editor-range w-full"
              />
              <p className="mt-2 text-xs text-white/40">
                Each page renders at {scale}× its PDF point size.
              </p>
            </div>
          ) : null}

          {lossy ? (
            <div className="mt-5">
              <label htmlFor="convert-quality" className={LABEL}>
                Quality — {Math.round(quality * 100)}%
              </label>
              <input
                id="convert-quality"
                type="range"
                min="0.3"
                max="1"
                step="0.01"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="editor-range w-full"
              />
            </div>
          ) : null}

          <Btn
            onClick={handleConvert}
            disabled={busy || !activeTarget || files.length === 0}
            className="mt-6 w-full !py-3.5"
          >
            {busy ? (
              <>
                <LoadingIcon style="animate-spin h-4 w-4" />
                <span>Converting{progress ? ` ${progress}` : "…"}</span>
              </>
            ) : (
              <span>
                Convert{activeTarget ? ` to ${activeTarget.label.split(" ")[0]}` : ""}
              </span>
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
