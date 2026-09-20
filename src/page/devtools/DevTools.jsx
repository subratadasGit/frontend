import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Btn, EmptyState, Page, PageHeader, Panel } from "../../components/ui/AppUI";
import { SearchIcon, CrossIcon } from "../../components/Icon";
import { CATEGORIES, DEV_TOOLS, findTool, searchTools } from "../../devtools/registry";
import { useFavourites, useRecents } from "../../devtools/useToolPrefs";

/**
 * The developer tools hub.
 *
 * Search, categories, favourites and recents all read from one registry, so a
 * tool added there shows up everywhere at once with nothing else to wire.
 *
 * The card grid, hairline panels, mono labels and ember accent are the same
 * ones the Content, Image and Toolkit hubs already use.
 */
export default function DevTools() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const searchRef = useRef(null);

  const { favourites, isFavourite, toggleFavourite } = useFavourites();
  const { recents, clearRecents } = useRecents();

  const results = useMemo(() => {
    const matched = query.trim() ? searchTools(query) : DEV_TOOLS;
    return category === "all" ? matched : matched.filter((tool) => tool.category === category);
  }, [query, category]);

  const searching = query.trim().length > 0;

  // Grouped view when browsing, a single ranked list when searching.
  const grouped = useMemo(() => {
    if (searching) return null;
    return CATEGORIES.map((entry) => ({
      ...entry,
      tools: results.filter((tool) => tool.category === entry.id),
    })).filter((entry) => entry.tools.length > 0);
  }, [results, searching]);

  const favouriteTools = favourites.map(findTool).filter(Boolean);
  const recentTools = recents.map(findTool).filter(Boolean);

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Dev Tools"
        description={`${DEV_TOOLS.length} developer utilities — JSON, APIs, security, databases, CSS and everyday conversions. Everything runs in your browser.`}
        actions={
          <Btn to="/tools" variant="ghost">
            File toolkit
          </Btn>
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
          placeholder="Search tools — try json, jwt, regex, sql, base64, timestamp…"
          aria-label="Search developer tools"
          className="w-full border border-white/10 bg-black py-3.5 pr-11 pl-11 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff4d1c]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/30 transition-colors hover:text-white"
          >
            <CrossIcon style="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        <CategoryChip
          label={`All (${DEV_TOOLS.length})`}
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {CATEGORIES.map((entry) => {
          const count = DEV_TOOLS.filter((tool) => tool.category === entry.id).length;
          return (
            <CategoryChip
              key={entry.id}
              label={`${entry.label} (${count})`}
              active={category === entry.id}
              onClick={() => setCategory(category === entry.id ? "all" : entry.id)}
            />
          );
        })}
      </div>

      {/* Favourites and recents — only once there is something in them. */}
      {!searching && favouriteTools.length > 0 ? (
        <ToolStrip
          title="Favourites"
          tools={favouriteTools}
          isFavourite={isFavourite}
          onToggleFavourite={toggleFavourite}
        />
      ) : null}

      {!searching && recentTools.length > 0 ? (
        <ToolStrip
          title="Recently used"
          tools={recentTools}
          isFavourite={isFavourite}
          onToggleFavourite={toggleFavourite}
          action={
            <button
              type="button"
              onClick={clearRecents}
              className="font-mono text-[0.625rem] tracking-[0.16em] text-white/35 uppercase transition-colors hover:text-white"
            >
              Clear
            </button>
          }
        />
      ) : null}

      {/* Results */}
      {results.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title={`No tools match "${query}".`}
            description="Try a different term — the search covers names, descriptions and keywords."
            action={
              <Btn
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Clear search
              </Btn>
            }
          />
        </div>
      ) : searching ? (
        <section className="mt-10" aria-label="Search results">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            {results.length} result{results.length === 1 ? "" : "s"}
          </h2>
          <ToolGrid
            tools={results}
            isFavourite={isFavourite}
            onToggleFavourite={toggleFavourite}
          />
        </section>
      ) : (
        grouped.map((entry) => (
          <section key={entry.id} className="mt-12" aria-labelledby={`category-${entry.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id={`category-${entry.id}`}
                className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
              >
                {entry.label}
              </h2>
              <p className="text-xs text-white/35">{entry.description}</p>
            </div>
            <ToolGrid
              tools={entry.tools}
              isFavourite={isFavourite}
              onToggleFavourite={toggleFavourite}
            />
          </section>
        ))
      )}

      <Panel className="mt-14">
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
            Favourites and recently-used tools are kept in this browser's local
            storage, so they follow the device rather than the account. Each
            tool is code-split and loads only when you open it.
          </p>
        </div>
      </Panel>
    </Page>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
        active
          ? "border-[#ff4d1c] text-[#ff4d1c]"
          : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

/** Compact horizontal list used for favourites and recents. */
function ToolStrip({ title, tools, action, isFavourite, onToggleFavourite }) {
  return (
    <section className="mt-10" aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4 grid gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <div key={tool.id} className="flex items-center gap-2 bg-[#0a0a0a] pr-2">
            <Link
              to={`/devtools/${tool.id}`}
              className="group min-w-0 flex-1 px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
            >
              <span className="block truncate text-sm text-white/80 group-hover:text-white">
                {tool.title}
              </span>
            </Link>
            <FavouriteToggle
              tool={tool}
              active={isFavourite(tool.id)}
              onToggle={onToggleFavourite}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The registry's cards, in the same visual language as `Card`. */
function ToolGrid({ tools, isFavourite, onToggleFavourite }) {
  return (
    <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <Link
            to={`/devtools/${tool.id}`}
            className="card group flex h-full min-h-[11rem] flex-col justify-between p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
          >
            <div>
              <span className="font-mono text-[0.625rem] tracking-[0.16em] text-white/25 uppercase">
                {tool.category}
              </span>
              <h3 className="mt-3 pr-9 text-lg font-semibold tracking-[-0.02em]">{tool.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{tool.description}</p>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.16em] text-white/60 uppercase transition-colors group-hover:text-white">
              Open
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
          <div className="absolute top-5 right-5">
            <FavouriteToggle
              tool={tool}
              active={isFavourite(tool.id)}
              onToggle={onToggleFavourite}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FavouriteToggle({ tool, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tool.id)}
      aria-pressed={active}
      aria-label={
        active ? `Remove ${tool.title} from favourites` : `Add ${tool.title} to favourites`
      }
      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
        active ? "text-[#ff4d1c]" : "text-white/20 hover:text-white/60"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={active ? "currentColor" : "none"}
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
  );
}
