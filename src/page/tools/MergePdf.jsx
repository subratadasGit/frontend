import { useState } from "react";
import { mergePdfs } from "../../utils/fileTools";
import {
  FileDrop,
  FileQueue,
  PrivacyNote,
  ResultList,
  ToolError,
} from "../../components/tools/FileTools";
import { Btn, Page, PageHeader, Panel } from "../../components/ui/AppUI";
import { LoadingIcon } from "../../components/Icon";

/** Combines several PDFs into one, in the order shown in the queue. */
export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const addFiles = (incoming) => {
    const pdfs = incoming.filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length !== incoming.length) {
      setError("Only PDF files can be merged — the rest were skipped.");
    } else {
      setError(null);
    }
    setFiles((current) => [...current, ...pdfs]);
    setOutputs([]);
  };

  const reorder = (from, to) => {
    setFiles((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleMerge = async () => {
    setBusy(true);
    setError(null);
    setOutputs([]);
    try {
      const blob = await mergePdfs(files, {
        onProgress: (done, total) => setProgress(`${done} / ${total}`),
      });
      setOutputs([{ name: "merged.pdf", blob, meta: `${files.length} documents` }]);
    } catch (caught) {
      setError(caught.message || "The merge failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Merge PDFs"
        description="Combine any number of PDFs into a single document. Drag the rows to set the order the pages appear in."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <FileDrop
            accept="application/pdf,.pdf"
            multiple
            onFiles={addFiles}
            label="Drop PDFs here"
            hint="Add as many as you need. They are merged top to bottom in the order below."
          />

          <FileQueue
            files={files}
            title="Merge order"
            onRemove={(index) =>
              setFiles((current) => current.filter((unused, i) => i !== index))
            }
            onReorder={reorder}
            onClear={() => {
              setFiles([]);
              setOutputs([]);
            }}
          />

          <ToolError>{error}</ToolError>
          <ResultList
            outputs={outputs}
            onReset={() => {
              setFiles([]);
              setOutputs([]);
            }}
          />
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Merge
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/55">
            {files.length === 0
              ? "Add two or more PDFs to begin."
              : `${files.length} document${files.length === 1 ? "" : "s"} queued.`}
          </p>

          <Btn
            onClick={handleMerge}
            disabled={busy || files.length < 2}
            className="mt-6 w-full !py-3.5"
          >
            {busy ? (
              <>
                <LoadingIcon style="animate-spin h-4 w-4" />
                <span>Merging{progress ? ` ${progress}` : "…"}</span>
              </>
            ) : (
              <span>Merge {files.length > 1 ? files.length : ""} PDFs</span>
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
