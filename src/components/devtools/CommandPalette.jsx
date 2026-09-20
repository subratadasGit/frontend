import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "../Icon";
import { CATEGORIES, DEV_TOOLS, findTool, searchTools } from "../../devtools/registry";
import { useFavourites, useRecents } from "../../devtools/useToolPrefs";

/**
 * ⌘K / Ctrl-K tool search.
 *
 * Reads the same registry the hub does, so a tool added there is instantly
 * findable here with nothing else to wire. Results are grouped by category
 * because a flat list of sixty tools tells you nothing about where you are.
 *
 * Fully keyboard driven: ↑ ↓ to move, Enter to open, Escape to close, and the
 * active option is wired through `aria-activedescendant` so screen readers
 * follow the selection without the focus ever leaving the input.
 */
export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { favourites } = useFavourites();
  const { recents, recordUse } = useRecents();

  useEffect(() => {
    const onKey = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen((current) => {
          if (!current) {
            setQuery("");
            setActive(0);
          }
          return !current;
        });
        return;
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    // Focus after the dialog paints, or the caret lands nowhere.
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  /** With no query, show recents and favourites — the useful default. */
  const results = useMemo(() => {
    if (query.trim()) return searchTools(query).slice(0, 40);
    const suggested = [...new Set([...recents, ...favourites])]
      .map(findTool)
      .filter(Boolean);
    return suggested.length > 0 ? suggested : DEV_TOOLS.slice(0, 12);
  }, [query, recents, favourites]);

  const grouped = useMemo(() => {
    const byCategory = new Map();
    results.forEach((tool) => {
      if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
      byCategory.get(tool.category).push(tool);
    });
    // Flat index alongside the groups, so arrow keys cross group boundaries.
    let index = 0;
    return [...byCategory.entries()].map(([categoryId, tools]) => ({
      category: CATEGORIES.find((entry) => entry.id === categoryId),
      tools: tools.map((tool) => ({ tool, index: index++ })),
    }));
  }, [results]);

  // A narrower search can leave the stored index past the end; clamping here
  // keeps it valid without an effect that writes state back after every keystroke.
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  const openTool = (tool) => {
    if (!tool) return;
    recordUse(tool.id);
    setOpen(false);
    navigate(`/devtools/${tool.id}`);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % Math.max(1, results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % Math.max(1, results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      openTool(results[activeIndex]);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(0, results.length - 1));
    }
  };

  // Keep the highlighted row in view as the selection moves.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search developer tools"
        className="w-full max-w-xl border border-white/[0.12] bg-[#0a0a0a] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <span className="text-white/30" aria-hidden="true">
            <SearchIcon style="w-4 h-4" />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search tools — prisma, plantuml, jwt, regex…"
            aria-label="Search tools"
            aria-controls="command-palette-results"
            aria-activedescendant={results[activeIndex] ? `palette-${results[activeIndex].id}` : undefined}
            className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"
          />
          <kbd className="shrink-0 border border-white/10 px-1.5 py-0.5 font-mono text-[0.5625rem] text-white/30">
            ESC
          </kbd>
        </div>

        <div
          id="command-palette-results"
          ref={listRef}
          role="listbox"
          aria-label="Tools"
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-white/40">
              No tool matches “{query}”.
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.category?.id || "other"}>
                <p className="px-4 py-1.5 font-mono text-[0.5625rem] tracking-[0.2em] text-white/25 uppercase">
                  {group.category?.label || "Tools"}
                </p>
                {group.tools.map(({ tool, index }) => (
                  <button
                    key={tool.id}
                    id={`palette-${tool.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === activeIndex}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => openTool(tool)}
                    className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === activeIndex ? "bg-[#ff4d1c]/[0.12] text-white" : "text-white/70"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{tool.title}</span>
                    <span className="hidden max-w-[16rem] truncate text-xs text-white/30 sm:block">
                      {tool.description}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2">
          <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-white/25 uppercase">
            {query.trim() ? `${results.length} results` : "Recent and favourites"}
          </span>
          <span className="flex gap-2 font-mono text-[0.5625rem] text-white/25">
            <kbd className="border border-white/10 px-1.5 py-0.5">↑↓</kbd> move
            <kbd className="border border-white/10 px-1.5 py-0.5">↵</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}
