import { useId, useRef, useState } from "react";
import { Btn } from "../ui/AppUI";
import { CrossIcon, Download, ErrorIcon } from "../Icon";
import { downloadBlob } from "../../utils/global";
import { formatBytes } from "../../utils/fileTools";

/**
 * Shared pieces for the file toolkit: a drop zone, the queue of picked files,
 * and the list of produced results.
 *
 * These tools never touch the network, so there is no upload state to model —
 * a file goes from the picker straight into a worker-free canvas or PDF
 * routine and comes back out as a blob.
 */

/* -------------------------------- Drop zone ------------------------------- */

export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here",
  hint,
}) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const inputId = useId();

  const handle = (list) => {
    const files = Array.from(list || []);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        handle(event.dataTransfer.files);
      }}
      className={`border border-dashed px-6 py-12 text-center transition-colors ${
        over
          ? "border-[#ff4d1c] bg-[#ff4d1c]/[0.06]"
          : "border-white/15 hover:border-white/30"
      }`}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          handle(event.target.files);
          // Reset so picking the same file twice still fires a change.
          event.target.value = "";
        }}
      />

      <p className="text-sm font-medium text-white/80">{label}</p>
      {hint ? (
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/40">
          {hint}
        </p>
      ) : null}

      <label
        htmlFor={inputId}
        className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 border border-white/10 px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-white uppercase transition-colors hover:border-white/35 hover:bg-white/[0.04] focus-within:outline focus-within:outline-2 focus-within:outline-[#ff4d1c]"
      >
        Choose file{multiple ? "s" : ""}
      </label>
    </div>
  );
}

/* ------------------------------- Input queue ------------------------------ */

export function FileQueue({ files, onRemove, onReorder, onClear, title = "Selected" }) {
  if (files.length === 0) return null;

  return (
    <section className="border border-white/[0.08] bg-black">
      <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <h3 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          {title} — {files.length}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[0.625rem] tracking-[0.16em] text-white/40 uppercase transition-colors hover:text-white"
        >
          Clear
        </button>
      </header>

      <ul className="divide-y divide-white/[0.06]">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.lastModified}-${index}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="font-mono text-[0.625rem] text-white/25 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/80">{file.name}</p>
              <p className="font-mono text-[0.625rem] tracking-[0.12em] text-white/30 uppercase">
                {formatBytes(file.size)}
              </p>
            </div>

            {onReorder ? (
              <div className="flex shrink-0 gap-1">
                <IconStep
                  label={`Move ${file.name} up`}
                  disabled={index === 0}
                  onClick={() => onReorder(index, index - 1)}
                >
                  ↑
                </IconStep>
                <IconStep
                  label={`Move ${file.name} down`}
                  disabled={index === files.length - 1}
                  onClick={() => onReorder(index, index + 1)}
                >
                  ↓
                </IconStep>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${file.name}`}
              className="shrink-0 text-white/30 transition-colors hover:text-red-400"
            >
              <CrossIcon style="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function IconStep({ children, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center border border-white/10 text-xs text-white/60 transition-colors hover:border-white/35 hover:text-white disabled:opacity-25 disabled:hover:border-white/10"
    >
      {children}
    </button>
  );
}

/* --------------------------------- Results -------------------------------- */

export function ResultList({ outputs, onReset }) {
  if (!outputs || outputs.length === 0) return null;

  const downloadAll = () => {
    // Browsers throttle rapid successive downloads, so they are spaced out.
    outputs.forEach((output, index) => {
      setTimeout(() => downloadBlob(output.blob, output.name), index * 260);
    });
  };

  return (
    <section className="border border-[#ff4d1c]/25 bg-[#ff4d1c]/[0.03]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <h3 className="font-mono text-[0.625rem] tracking-[0.2em] text-[#ff4d1c] uppercase">
          Result — {outputs.length} file{outputs.length === 1 ? "" : "s"}
        </h3>
        <div className="flex gap-2">
          {outputs.length > 1 ? (
            <Btn onClick={downloadAll} className="!px-4 !py-2">
              <Download style="w-4 h-4" />
              Download all
            </Btn>
          ) : null}
          {onReset ? (
            <Btn variant="ghost" onClick={onReset} className="!px-4 !py-2">
              Start over
            </Btn>
          ) : null}
        </div>
      </header>

      <ul className="max-h-96 divide-y divide-white/[0.06] overflow-y-auto">
        {outputs.map((output, index) => (
          <li
            key={`${output.name}-${index}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/85">{output.name}</p>
              <p className="font-mono text-[0.625rem] tracking-[0.12em] text-white/30 uppercase">
                {formatBytes(output.blob.size)}
                {output.meta ? ` · ${output.meta}` : ""}
              </p>
            </div>
            <Btn
              variant="ghost"
              onClick={() => downloadBlob(output.blob, output.name)}
              className="!px-3 !py-1.5"
            >
              <Download style="w-4 h-4" />
              Save
            </Btn>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------- Notices -------------------------------- */

export function ToolError({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
    >
      <ErrorIcon style="w-5 h-5 shrink-0" />
      {children}
    </p>
  );
}

export function ToolNotice({ children }) {
  if (!children) return null;
  return (
    <p className="border-l-2 border-[#ff4d1c]/50 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-white/50">
      {children}
    </p>
  );
}

/** "Files never leave your browser" — worth saying on every tool page. */
export function PrivacyNote() {
  return (
    <p className="font-mono text-[0.625rem] leading-relaxed tracking-[0.12em] text-white/25 uppercase">
      Processed locally — nothing is uploaded
    </p>
  );
}
