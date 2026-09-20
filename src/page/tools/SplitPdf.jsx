import { useState } from "react";
import { readPdfPageCount, splitPdf } from "../../utils/fileTools";
import {
  FileDrop,
  FileQueue,
  PrivacyNote,
  ResultList,
  ToolError,
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

const MODES = [
  {
    id: "pages",
    label: "Every page",
    description: "One PDF per page.",
  },
  {
    id: "every",
    label: "Fixed chunks",
    description: "Split into documents of N pages each.",
  },
  {
    id: "ranges",
    label: "Page ranges",
    description: "One PDF per range, e.g. 1-3, 5, 9-.",
  },
];

/** Splits one PDF into several, by page, by chunk size, or by explicit range. */
export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [mode, setMode] = useState("pages");
  const [ranges, setRanges] = useState("1-2, 3");
  const [size, setSize] = useState(2);
  const [outputs, setOutputs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pick = async ([incoming]) => {
    setOutputs([]);
    setError(null);
    setFile(incoming);
    setPageCount(null);
    try {
      setPageCount(await readPdfPageCount(incoming));
    } catch {
      setError("This PDF could not be read. It may be password-protected.");
      setFile(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(null);
    setOutputs([]);
    setError(null);
  };

  const handleSplit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setOutputs([]);
    try {
      setOutputs(await splitPdf(file, { mode, ranges, size }));
    } catch (caught) {
      setError(caught.message || "The split failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Split PDF"
        description="Break a PDF into separate documents — one per page, in fixed chunks, or by the ranges you name."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {file ? (
            <FileQueue
              files={[file]}
              title="Source"
              onRemove={reset}
              onClear={reset}
            />
          ) : (
            <FileDrop
              accept="application/pdf,.pdf"
              onFiles={pick}
              label="Drop a PDF here"
              hint="One document at a time. Its page count is read as soon as it lands."
            />
          )}

          <ToolError>{error}</ToolError>
          <ResultList outputs={outputs} onReset={reset} />
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Split by
          </h2>

          {pageCount ? (
            <p className="mt-3 font-mono text-[0.625rem] tracking-[0.16em] text-[#ff4d1c] uppercase">
              {pageCount} pages
            </p>
          ) : null}

          <div className="mt-5 space-y-2">
            {MODES.map((entry) => (
              <label
                key={entry.id}
                className={`flex cursor-pointer gap-3 border p-3 transition-colors ${
                  mode === entry.id
                    ? "border-[#ff4d1c]/60 bg-[#ff4d1c]/[0.05]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="split-mode"
                  value={entry.id}
                  checked={mode === entry.id}
                  onChange={() => setMode(entry.id)}
                  className="mt-1 h-3.5 w-3.5 shrink-0 accent-[#ff4d1c]"
                />
                <span>
                  <span className="block text-sm text-white/85">{entry.label}</span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    {entry.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {mode === "every" ? (
            <div className="mt-5">
              <label htmlFor="chunk-size" className={LABEL}>
                Pages per document
              </label>
              <input
                id="chunk-size"
                type="number"
                min="1"
                max={pageCount || 999}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className={INPUT}
              />
            </div>
          ) : null}

          {mode === "ranges" ? (
            <div className="mt-5">
              <label htmlFor="page-ranges" className={LABEL}>
                Ranges
              </label>
              <input
                id="page-ranges"
                value={ranges}
                onChange={(event) => setRanges(event.target.value)}
                placeholder="1-3, 5, 9-"
                className={INPUT}
              />
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Each comma-separated term becomes its own PDF. An open-ended
                range like <span className="font-mono">9-</span> runs to the last
                page.
              </p>
            </div>
          ) : null}

          <Btn
            onClick={handleSplit}
            disabled={busy || !file}
            className="mt-6 w-full !py-3.5"
          >
            {busy ? (
              <>
                <LoadingIcon style="animate-spin h-4 w-4" />
                <span>Splitting…</span>
              </>
            ) : (
              <span>Split PDF</span>
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
