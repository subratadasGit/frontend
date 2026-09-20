import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { INPUT } from "../../components/ui/AppUI";
import { SearchIcon, CrossIcon } from "../../components/Icon";
import { CATEGORIES, DEV_TOOLS, findTool } from "../../devtools/registry";
import { useFavourites, useRecents } from "../../devtools/useToolPrefs";

/**
 * The developer tools shell: section navigation on the left, tool on the right.
 *
 * Deliberately the same construction as the CMS admin shell — a 260px sticky
 * column, `border-l-2` active markers, mono group labels, ember accent — so
 * moving between the two surfaces feels like one product rather than two.
 *
 * The sidebar sits *below* the product nav rather than replacing it, so the
 * path out to Content or Images is never lost while you are deep in a tool.
 */

const OPEN_GROUPS_KEY = "devtools:open-groups";

const readOpenGroups = () => {
  try {
    const raw = localStorage.getItem(OPEN_GROUPS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function DevToolsLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const { favourites, isFavourite } = useFavourites();
  const { recents } = useRecents();

  const activeToolId = location.pathname.split("/")[2] || null;
  const activeTool = activeToolId ? findTool(activeToolId) : null;

  /*
   * Only the user's explicit choices are stored. A group with no stored choice
   * defaults to open when it holds the current tool and closed otherwise, which
   * keeps the list scannable rather than sixty links long — and needs no effect
   * mirroring the route into state.
   */
  const [openGroups, setOpenGroups] = useState(() => readOpenGroups() || {});

  const toggleGroup = (id) => {
    setOpenGroups((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable — the state still works for this session.
      }
      return next;
    });
  };

  const filtering = filter.trim().length > 0;

  const isExpanded = (categoryId) =>
    filtering ||
    (categoryId in openGroups ? openGroups[categoryId] : categoryId === activeTool?.category);

  const groups = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return CATEGORIES.map((category) => ({
      ...category,
      tools: DEV_TOOLS.filter(
        (tool) =>
          tool.category === category.id &&
          (!term ||
            tool.title.toLowerCase().includes(term) ||
            tool.keywords.some((keyword) => keyword.includes(term))),
      ),
    })).filter((category) => category.tools.length > 0);
  }, [filter]);

  const favouriteTools = favourites.map(findTool).filter(Boolean);
  const recentTools = recents
    .map(findTool)
    .filter((tool) => tool && !favourites.includes(tool.id))
    .slice(0, 4);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 border-l-2 py-2 pr-3 pl-4 text-[0.8125rem] transition-colors ${
      isActive
        ? "border-[#ff4d1c] bg-[#ff4d1c]/10 text-white"
        : "border-transparent text-white/50 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
    }`;

  const sidebar = (
    <nav aria-label="Developer tools" className="flex h-full flex-col">
      {/* Filter */}
      <div className="border-b border-white/10 p-3">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-white/30">
            <SearchIcon style="w-3.5 h-3.5" />
          </span>
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter tools…"
            aria-label="Filter the tool list"
            className={`${INPUT} !py-2 pr-8 pl-8 !text-xs`}
          />
          {filter ? (
            <button
              type="button"
              onClick={() => setFilter("")}
              aria-label="Clear filter"
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/30 transition-colors hover:text-white"
            >
              <CrossIcon style="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        <p className="mt-2 flex items-center justify-between font-mono text-[0.5625rem] tracking-[0.14em] text-white/25 uppercase">
          <span>{DEV_TOOLS.length} tools</span>
          <span className="flex items-center gap-1">
            <kbd className="border border-white/10 px-1 py-px">⌘K</kbd> search
          </span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <NavLink to="/devtools" end className={linkClass} onClick={() => setOpen(false)}>
          All tools
        </NavLink>

        {!filtering && favouriteTools.length > 0 ? (
          <Group label="Favourites">
            {favouriteTools.map((tool) => (
              <NavLink key={tool.id} to={`/devtools/${tool.id}`} className={linkClass} onClick={() => setOpen(false)}>
                <Star active />
                <span className="truncate">{tool.title}</span>
              </NavLink>
            ))}
          </Group>
        ) : null}

        {!filtering && recentTools.length > 0 ? (
          <Group label="Recent">
            {recentTools.map((tool) => (
              <NavLink key={tool.id} to={`/devtools/${tool.id}`} className={linkClass} onClick={() => setOpen(false)}>
                <span className="truncate">{tool.title}</span>
              </NavLink>
            ))}
          </Group>
        ) : null}

        {groups.map((category) => {
          // While filtering, every matching group opens — hiding matches behind
          // a collapsed header would make the filter feel broken.
          const expanded = isExpanded(category.id);
          return (
            <div key={category.id} className="mt-5">
              <button
                type="button"
                onClick={() => toggleGroup(category.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between px-4 pb-1.5 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase transition-colors hover:text-white/60"
              >
                <span>{category.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-white/20">{category.tools.length}</span>
                  <span
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                  >
                    ›
                  </span>
                </span>
              </button>

              {expanded
                ? category.tools.map((tool) => (
                    <NavLink key={tool.id} to={`/devtools/${tool.id}`} className={linkClass} onClick={() => setOpen(false)}>
                      {isFavourite(tool.id) ? <Star active /> : null}
                      <span className="truncate">{tool.title}</span>
                    </NavLink>
                  ))
                : null}
            </div>
          );
        })}

        {filtering && groups.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-white/35">
            Nothing matches “{filter}”.
          </p>
        ) : null}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="font-mono text-[0.5625rem] leading-relaxed tracking-[0.14em] text-white/25 uppercase">
          ● Everything runs locally
        </p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Mobile: the sidebar collapses to a drawer under the product nav. */}
      <div className="sticky top-16 z-30 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 py-2.5 lg:hidden">
        <span className="min-w-0 truncate font-mono text-[0.625rem] tracking-[0.16em] text-white/45 uppercase">
          {activeTool ? activeTool.title : "Dev Tools"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="devtools-sidebar"
          className="shrink-0 border border-white/10 px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] uppercase"
        >
          {open ? "Close" : "Tools"}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[248px_1fr]">
        <aside
          id="devtools-sidebar"
          className={`border-r border-white/10 bg-[#0a0a0a] lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] ${
            open ? "block" : "hidden"
          }`}
        >
          {sidebar}
        </aside>

        {/* No padding here — each tool page brings its own `Page` shell. */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div className="mt-5">
      <p className="px-4 pb-1.5 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Star({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 shrink-0"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={{ color: "#ff4d1c" }}
    >
      <path strokeLinejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9z" />
    </svg>
  );
}
