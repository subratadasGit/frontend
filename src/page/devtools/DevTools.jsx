import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Btn, EmptyState, Page, PageHeader, Panel } from "../../components/ui/AppUI";
import { SearchIcon, CrossIcon } from "../../components/Icon";
import { CATEGORIES, DEV_TOOLS, searchTools } from "../../devtools/registry";
import { useFavourites } from "../../devtools/useToolPrefs";

/**
 * The developer tools landing page.
 *
 * This is the *browse* surface. Jumping between tools, filtering by category
 * and reaching favourites or recents all belong to the sidebar in
 * `DevToolsLayout`, so none of that is repeated here — one job per surface.
 *
 * What is left is what a landing page is actually good at: a search box, and
 * the whole catalogue laid out by category so you can see what exists.
 */
export default function DevTools() {
  const [query, setQuery] = useState("");
  // The category comes from the URL, so a breadcrumb or a sidebar link can
  // point straight at a section and the choice survives a reload.
  const [params, setParams] = useSearchParams();
  const category = params.get("category");
  const searchRef = useRef(null);

  const { isFavourite, toggleFavourite } = useFavourites();

  const searching = query.trim().length > 0;

  const results = useMemo(() => {
    const matched = searching ? searchTools(query) : DEV_TOOLS;
    return category ? matched.filter((tool) => tool.category === category) : matched;
  }, [query, category, searching]);

  const sections = useMemo(() => {
    if (searching) return null;
    return CATEGORIES.filter((entry) => !category || entry.id === category)
      .map((entry) => ({ ...entry, tools: results.filter((tool) => tool.category === entry.id) }))
      .filter((entry) => entry.tools.length > 0);
  }, [results, searching, category]);

  const activeCategory = CATEGORIES.find((entry) => entry.id === category);

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title={activeCategory ? activeCategory.label : "Dev Tools"}
        description={
          activeCategory
            ? activeCategory.description
            : `${DEV_TOOLS.length} developer utilities across ${CATEGORIES.length} categories. Everything runs in your browser — nothing you paste is uploaded.`
        }
        actions={
          <>
            {activeCategory ? (
              <Btn
                variant="ghost"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete("category");
                  setParams(next, { replace: true });
                }}
              >
                All categories
              </Btn>
            ) : null}
            <Btn to="/tools" variant="ghost">
              File toolkit
            </Btn>
          </>
        }
      />

      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
          <SearchIcon style="w-4 h-4" />
        </span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          placeholder="Search tools — try prisma, jwt, regex, sql, base64, timestamp…"
          aria-label="Search developer tools"
          className="w-full border border-white/10 bg-black py-3.5 pr-28 pl-11 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff4d1c]"
        />
        <span className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="text-white/30 transition-colors hover:text-white"
            >
              <CrossIcon style="w-4 h-4" />
            </button>
          ) : null}
          <kbd className="hidden border border-white/10 px-1.5 py-0.5 font-mono text-[0.5625rem] text-white/25 sm:block">
            ⌘K
          </kbd>
        </span>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title={`No tools match “${query}”.`}
            description="Try a different term — the search covers names, descriptions and keywords."
            action={<Btn onClick={() => setQuery("")}>Clear search</Btn>}
          />
        </div>
      ) : searching ? (
        <section className="mt-8" aria-label="Search results">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            {results.length} result{results.length === 1 ? "" : "s"}
            {activeCategory ? ` in ${activeCategory.label}` : ""}
          </h2>
          <ToolGrid tools={results} isFavourite={isFavourite} onToggleFavourite={toggleFavourite} />
        </section>
      ) : (
        sections.map((section) => (
          <section key={section.id} className="mt-10" aria-labelledby={`category-${section.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.08] pb-2">
              <h2
                id={`category-${section.id}`}
                className="font-mono text-[0.625rem] tracking-[0.2em] text-white/40 uppercase"
              >
                {section.label}
                <span className="ml-2 text-white/20">{section.tools.length}</span>
              </h2>
              <p className="text-xs text-white/35">{section.description}</p>
            </div>
            <ToolGrid
              tools={section.tools}
              isFavourite={isFavourite}
              onToggleFavourite={toggleFavourite}
            />
          </section>
        ))
      )}

      <Panel className="mt-12">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          How these work
        </h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-white/55 md:grid-cols-2">
          <p>
            Every tool here runs entirely in your browser. Nothing you paste —
            tokens, schemas, passwords, API responses — is sent to the server or
            stored anywhere. The one exception is the REST API Client, which by
            definition sends the request you tell it to.
          </p>
          <p>
            Favourites and recently-used tools live in this browser's local
            storage, so they follow the device rather than the account. Press{" "}
            <kbd className="border border-white/10 px-1 py-px font-mono text-[0.625rem]">⌘K</kbd>{" "}
            anywhere to jump straight to a tool.
          </p>
        </div>
      </Panel>
    </Page>
  );
}

/** The catalogue cards, in the same visual language as the other hubs. */
function ToolGrid({ tools, isFavourite, onToggleFavourite }) {
  return (
    <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <Link
            to={`/devtools/${tool.id}`}
            className="card group flex h-full min-h-[10.5rem] flex-col justify-between p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
          >
            <div>
              <h3 className="pr-8 text-base font-semibold tracking-[-0.02em]">{tool.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{tool.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.16em] text-white/45 uppercase transition-colors group-hover:text-[#ff4d1c]">
              Open
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => onToggleFavourite(tool.id)}
            aria-pressed={isFavourite(tool.id)}
            aria-label={
              isFavourite(tool.id)
                ? `Remove ${tool.title} from favourites`
                : `Add ${tool.title} to favourites`
            }
            className={`absolute top-4 right-4 flex h-7 w-7 items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
              isFavourite(tool.id) ? "text-[#ff4d1c]" : "text-white/20 hover:text-white/60"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={isFavourite(tool.id) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinejoin="round"
                d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9z"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
