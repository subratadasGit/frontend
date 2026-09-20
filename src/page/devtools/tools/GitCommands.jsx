import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { SearchIcon } from "../../../components/Icon";
import { GIT_RECIPES } from "../../../devtools/transforms/dev";

/** Builds the git commands people look up rather than memorise. */
export default function GitCommands({ toolId }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(GIT_RECIPES[0].id);
  const [values, setValues] = useState({});

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return GIT_RECIPES;
    return GIT_RECIPES.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(term) ||
        recipe.build({}).join(" ").toLowerCase().includes(term),
    );
  }, [query]);

  const recipe = GIT_RECIPES.find((entry) => entry.id === selected) || filtered[0];
  const inputs = values[recipe?.id] || {};
  const commands = recipe ? recipe.build(inputs) : [];

  const setValue = (key, value) =>
    setValues((current) => ({ ...current, [recipe.id]: { ...current[recipe.id], [key]: value } }));

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <div className="relative mb-3">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
              <SearchIcon style="w-4 h-4" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search — undo, stash, branch…"
              aria-label="Search git recipes"
              className={`${INPUT} !py-2.5 pl-10 !text-xs`}
            />
          </div>

          <ul className="max-h-[28rem] space-y-1 overflow-y-auto" role="listbox" aria-label="Git recipes">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelected(entry.id)}
                  aria-selected={entry.id === recipe?.id}
                  role="option"
                  className={`w-full border px-3 py-2.5 text-left text-sm transition-colors ${
                    entry.id === recipe?.id
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.title}
                </button>
              </li>
            ))}
          </ul>

          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/40">Nothing matches “{query}”.</p>
          ) : null}
        </Panel>

        {recipe ? (
          <div className="space-y-4">
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>{recipe.title}</PaneLabel>

              {recipe.inputs.length > 0 ? (
                <div className="mb-4 space-y-3">
                  {recipe.inputs.map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={`git-${recipe.id}-${field.id}`}
                        className="mb-1.5 block font-mono text-[0.625rem] tracking-[0.16em] text-white/50 uppercase"
                      >
                        {field.label}
                      </label>
                      <input
                        id={`git-${recipe.id}-${field.id}`}
                        value={inputs[field.id] || ""}
                        onChange={(event) => setValue(field.id, event.target.value)}
                        placeholder={field.placeholder}
                        spellCheck={false}
                        className={`${INPUT} font-mono !py-2.5 !text-sm`}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {commands.map((command, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 border border-white/[0.08] bg-black px-3 py-2.5"
                  >
                    <span aria-hidden="true" className="shrink-0 font-mono text-xs text-white/25">
                      $
                    </span>
                    <code className="min-w-0 flex-1 font-mono text-sm break-all text-white/85">
                      {command}
                    </code>
                    <CopyButton value={command} label="Copy" />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={commands.join("\n")} label="Copy all" />
              </div>

              {recipe.note ? (
                <div className="mt-4">
                  <ToolNote tone="accent">{recipe.note}</ToolNote>
                </div>
              ) : null}
            </Panel>

            <ToolNote>
              Commands that rewrite history or delete work are marked. Read the
              note before running one on a branch someone else has pulled.
            </ToolNote>
          </div>
        ) : null}
      </div>

      <RelatedTools ids={["chmod-calculator", "diff-checker", "env-validator"]} />
    </DevToolPage>
  );
}
