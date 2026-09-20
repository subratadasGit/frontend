import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Panel } from "../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  OptionGroup,
  PaneLabel,
  PasteButton,
  SplitPanes,
  TextField,
  ToolErrorPanel,
  ToolNote,
} from "../../components/devtools/DevToolUI";
import { getIoTool } from "../../devtools/ioTools";

/**
 * Renders every tool that is the plain INPUT → TRANSFORM → OUTPUT shape.
 *
 * One component for all of them means the layout, the actions, the error
 * presentation and the keyboard behaviour cannot drift apart between tools.
 *
 * Transforms run on a short debounce as you type. Some are async (YAML and SQL
 * lazily import their library), so results are sequenced with a run counter —
 * a slow earlier keystroke can never overwrite a newer result.
 */
export default function IoToolPage({ toolId }) {
  const config = getIoTool(toolId);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const [options, setOptions] = useState(() =>
    Object.fromEntries((config?.options || []).map((option) => [option.id, option.default])),
  );

  const setOption = (id, value) => setOptions((current) => ({ ...current, [id]: value }));

  const optionsKey = useMemo(() => JSON.stringify(options), [options]);

  const runTransform = useCallback(
    async (text, currentOptions) => {
      if (!text.trim()) return { output: "", error: null, note: null };
      try {
        const result = await config.run(text, currentOptions);
        return {
          output: result ?? "",
          error: null,
          note: config.successNote ? config.successNote(result ?? "", text) : null,
        };
      } catch (caught) {
        return {
          output: "",
          note: null,
          error: {
            message: caught?.message || "This input could not be processed.",
            line: caught?.line,
            column: caught?.column,
            hint: caught?.hint,
          },
        };
      }
    },
    [config],
  );

  // Debounced, sequenced transform. `cancelled` guards the unmount/next-run
  // case so a resolved promise cannot write stale state.
  useEffect(() => {
    if (!config) return undefined;
    let cancelled = false;

    const timer = setTimeout(() => {
      runTransform(input, JSON.parse(optionsKey)).then((result) => {
        if (cancelled) return;
        setOutput(result.output);
        setError(result.error);
        setNote(result.note);
      });
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, optionsKey, config, runTransform]);

  if (!config) return null;

  const clear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setNote(null);
  };

  const errorLine = error?.line ?? null;

  const actions = (
    <>
      <CopyButton value={output} label="Copy result" />
      <DownloadButton
        value={output}
        filename={config.filename || "output.txt"}
        type={config.mimeType || "text/plain"}
      />
      <ClearButton onClick={clear} disabled={!input && !output} />
    </>
  );

  return (
    <DevToolPage toolId={toolId}>
      {(config.options?.length || 0) > 0 ? (
        <Panel className="mb-4">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
            {config.options.map((option) =>
              option.type === "text" ? (
                <div key={option.id} className="min-w-[12rem]">
                  <TextField
                    label={option.label}
                    value={options[option.id] ?? ""}
                    onChange={(value) => setOption(option.id, value)}
                    placeholder={option.placeholder}
                  />
                </div>
              ) : (
                <OptionGroup
                  key={option.id}
                  label={option.label}
                  options={option.choices}
                  value={options[option.id]}
                  onChange={(value) => setOption(option.id, value)}
                />
              ),
            )}
          </div>
        </Panel>
      ) : null}

      <SplitPanes
        actions={actions}
        input={
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel
              right={
                <div className="flex gap-2">
                  <PasteButton onPaste={setInput} />
                  <ClearButton onClick={clear} disabled={!input} />
                </div>
              }
            >
              {config.inputLabel}
            </PaneLabel>
            <CodeField
              value={input}
              onChange={setInput}
              placeholder={config.placeholder}
              ariaLabel={config.inputLabel}
              errorLine={errorLine}
            />
            {config.note ? <div className="mt-3"><ToolNote>{config.note}</ToolNote></div> : null}
          </Panel>
        }
        output={
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel
              right={
                output ? (
                  <span className="font-mono text-[0.625rem] tracking-[0.14em] text-white/30 uppercase">
                    {output.split("\n").length} lines
                  </span>
                ) : null
              }
            >
              {config.outputLabel}
            </PaneLabel>

            {error ? (
              <ToolErrorPanel error={error} />
            ) : (
              <CodeField
                value={output}
                readOnly
                placeholder="The result appears here as you type."
                ariaLabel={config.outputLabel}
              />
            )}

            {!error && note ? (
              <div className="mt-3">
                <ToolNote tone="good">{note}</ToolNote>
              </div>
            ) : null}

            {/* Repeat the primary action next to the result on small screens,
                where the shared action row sits far below the fold. */}
            <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
              <CopyButton value={output} label="Copy result" />
              <DownloadButton
                value={output}
                filename={config.filename || "output.txt"}
                type={config.mimeType || "text/plain"}
              />
            </div>
          </Panel>
        }
      />

      {config.example ? (
        <Btn variant="ghost" className="mt-4" onClick={() => setInput(config.example)}>
          Load example
        </Btn>
      ) : null}
    </DevToolPage>
  );
}
