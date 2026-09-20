import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Btn, INPUT, LABEL, Page, PageHeader, Panel } from "../ui/AppUI";
import { Copy, Download, CrossIcon } from "../Icon";
import { downloadBlob, handleCopy } from "../../utils/global";
import { findTool } from "../../devtools/registry";
import { useFavourites, useRecents } from "../../devtools/useToolPrefs";

/**
 * The shared furniture for every developer tool.
 *
 * Built entirely from the existing primitives — `Page`, `PageHeader`, `Panel`,
 * `Btn` and the `INPUT`/`LABEL` tokens — so a new tool inherits the same
 * ground, hairlines, mono labels and ember accent as the rest of the product
 * without restating any of it.
 */

/* -------------------------------- Tool shell ------------------------------- */

/** Star toggle, in the same hairline-button language as the rest of the app. */
function FavouriteButton({ toolId }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const active = isFavourite(toolId);

  return (
    <button
      type="button"
      onClick={() => toggleFavourite(toolId)}
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      title={active ? "Remove from favourites" : "Add to favourites"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
        active
          ? "border-[#ff4d1c] text-[#ff4d1c]"
          : "border-white/10 text-white/40 hover:border-white/35 hover:text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9z" />
      </svg>
    </button>
  );
}

/**
 * Page wrapper for a single tool: title, description, favourite toggle and a
 * route back to the hub. Records the visit so the hub's "recent" list is real.
 */
export function DevToolPage({ toolId, children, actions }) {
  const tool = findTool(toolId);
  const { recordUse } = useRecents();

  useEffect(() => {
    if (toolId) recordUse(toolId);
  }, [toolId, recordUse]);

  return (
    <Page>
      <PageHeader
        eyebrow="Dev Tools"
        title={tool?.title || "Tool"}
        description={tool?.description}
        actions={
          <>
            {actions}
            {toolId ? <FavouriteButton toolId={toolId} /> : null}
            <Btn to="/devtools" variant="ghost">
              All tools
            </Btn>
          </>
        }
      />
      {children}
    </Page>
  );
}

/* ------------------------------- Field labels ------------------------------ */

/** Mono section label used above each pane, matching the product's panels. */
export function PaneLabel({ children, right }) {
  return (
    <div className="mb-3 flex min-h-[1.75rem] items-center justify-between gap-3">
      <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
        {children}
      </h2>
      {right}
    </div>
  );
}

/* --------------------------------- Actions --------------------------------- */

/** Copy button that reuses the app's existing toast-backed copy helper. */
export function CopyButton({ value, label = "Copy", disabled }) {
  return (
    <Btn
      variant="ghost"
      onClick={() => handleCopy(value)}
      disabled={disabled || !value}
      className="!px-3 !py-2"
    >
      <Copy style="w-4 h-4" />
      {label}
    </Btn>
  );
}

export function DownloadButton({ value, filename = "output.txt", type = "text/plain", disabled }) {
  return (
    <Btn
      variant="ghost"
      onClick={() => downloadBlob(new Blob([value], { type: `${type};charset=utf-8` }), filename)}
      disabled={disabled || !value}
      className="!px-3 !py-2"
    >
      <Download style="w-4 h-4" />
      Download
    </Btn>
  );
}

export function ClearButton({ onClick, disabled }) {
  return (
    <Btn variant="ghost" onClick={onClick} disabled={disabled} className="!px-3 !py-2">
      <CrossIcon style="w-4 h-4" />
      Clear
    </Btn>
  );
}

/** Reads the clipboard into the input. Silently ignored if permission is denied. */
export function PasteButton({ onPaste, disabled }) {
  const [failed, setFailed] = useState(false);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onPaste(text);
      setFailed(false);
    } catch {
      // Firefox and denied permissions land here; the textarea still accepts Ctrl+V.
      setFailed(true);
    }
  };

  return (
    <Btn
      variant="ghost"
      onClick={paste}
      disabled={disabled}
      className="!px-3 !py-2"
      title={failed ? "Clipboard access was denied — use Ctrl+V in the field" : "Paste from clipboard"}
    >
      Paste
    </Btn>
  );
}

/* -------------------------------- Code field ------------------------------- */

/**
 * A monospaced editing surface with a line-number gutter.
 *
 * Deliberately a real `<textarea>` rather than a contenteditable editor: it
 * keeps native undo, spellcheck control, selection, mobile keyboards and
 * accessibility for free, which a hand-rolled editor would have to rebuild.
 * The gutter is a sibling that mirrors the textarea's scroll position.
 */
export function CodeField({
  value,
  onChange,
  placeholder,
  readOnly = false,
  rows = 14,
  ariaLabel,
  errorLine = null,
  className = "",
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const fieldId = useId();

  const lineCount = Math.max(value.split("\n").length, 1);

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div
      className={`code-field flex overflow-hidden border border-white/10 bg-black focus-within:border-[#ff4d1c] ${className}`.trim()}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="code-field__gutter shrink-0 select-none overflow-hidden border-r border-white/[0.06] bg-white/[0.02] py-3 text-right"
      >
        {Array.from({ length: lineCount }, (unused, index) => (
          <div
            key={index}
            className={`px-2.5 ${
              errorLine === index + 1 ? "bg-red-500/20 text-red-300" : "text-white/20"
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      <textarea
        id={fieldId}
        ref={textareaRef}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onScroll={syncScroll}
        readOnly={readOnly}
        rows={rows}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="code-field__input w-full flex-1 resize-y bg-transparent px-3 py-3 text-white outline-none placeholder:text-white/25"
      />
    </div>
  );
}

/* --------------------------------- Layout --------------------------------- */

/**
 * The standard two-pane tool body.
 *
 * Side by side from `lg` up and stacked below it, so the mobile order is
 * input → actions → output rather than a squeezed desktop layout.
 */
export function SplitPanes({ input, output, actions }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section aria-label="Input">{input}</section>
        {/* Actions sit between the panes on narrow screens. */}
        {actions ? <div className="flex flex-wrap gap-2 lg:hidden">{actions}</div> : null}
        <section aria-label="Output">{output}</section>
      </div>
      {actions ? <div className="hidden flex-wrap gap-2 lg:flex">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------- Notices -------------------------------- */

/** Parse/validation failure, with the position when the tool knows it. */
export function ToolErrorPanel({ error }) {
  if (!error) return null;
  const { message, line, column, hint } = error;

  return (
    <div
      role="alert"
      className="border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300"
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-medium">
        <span>{message}</span>
        {line ? (
          <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-red-300/70 uppercase">
            line {line}
            {column ? `, column ${column}` : ""}
          </span>
        ) : null}
      </p>
      {hint ? <p className="mt-1.5 text-red-200/70">{hint}</p> : null}
    </div>
  );
}

/** Success/neutral note, matching the toolkit's existing notice style. */
export function ToolNote({ children, tone = "muted" }) {
  if (!children) return null;
  const tones = {
    muted: "border-white/10 text-white/50",
    accent: "border-[#ff4d1c]/50 text-white/60",
    good: "border-emerald-500/40 text-emerald-200/80",
  };
  return (
    <p className={`border-l-2 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed ${tones[tone]}`}>
      {children}
    </p>
  );
}

/** Key/value readout used by the inspector-style tools. */
export function DataRow({ label, value, mono = true, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 font-mono text-[0.625rem] tracking-[0.14em] text-white/35 uppercase sm:w-44">
        {label}
      </dt>
      <dd className={`min-w-0 flex-1 break-words text-sm text-white/80 ${mono ? "font-mono" : ""}`}>
        {children ?? value}
      </dd>
    </div>
  );
}

/** Segmented control for the small option switches every tool needs. */
export function OptionGroup({ label, options, value, onChange, idPrefix }) {
  return (
    <div>
      {label ? <span className={LABEL}>{label}</span> : null}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            title={option.hint}
            id={idPrefix ? `${idPrefix}-${option.id}` : undefined}
            className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
              value === option.id
                ? "border-[#ff4d1c] text-[#ff4d1c]"
                : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Labelled text input, so tools do not restate the token every time. */
export function TextField({ label, value, onChange, placeholder, type = "text", ...rest }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={INPUT}
        {...rest}
      />
    </div>
  );
}

/** Slider with the value shown in the label, as the image editor does. */
export function RangeField({ label, value, onChange, min, max, step = 1, suffix = "" }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label} — {value}
        {suffix}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="editor-range w-full"
      />
    </div>
  );
}

export function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/65">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-[#ff4d1c]"
      />
      {label}
    </label>
  );
}

/** Card linking to a related tool, used in "see also" rows. */
export function RelatedTools({ ids = [] }) {
  const tools = ids.map(findTool).filter(Boolean);
  if (tools.length === 0) return null;

  return (
    <Panel className="mt-4">
      <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
        Related tools
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={`/devtools/${tool.id}`}
            className="border border-white/10 px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] text-white/60 uppercase transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
          >
            {tool.title}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
