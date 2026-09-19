import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { contentHistory, searchContent } from "../services/content";
import { ErrorIcon, LoadingIcon, SearchIcon } from "../components/Icon";
import {
  Btn,
  EmptyState,
  INPUT,
  Page,
  PageHeader,
  Tag,
} from "../components/ui/AppUI";

export default function ContentHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  const loadContent = async (searchTerm = "") => {
    try {
      setIsLoading(true);
      setError(null);
      const response = searchTerm.trim()
        ? await searchContent(searchTerm)
        : await contentHistory();
      setItems(response?.data?.data?.content || []);
    } catch {
      setError("Failed to load content history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const onSearch = (event) => {
    event.preventDefault();
    loadContent(query);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Content"
        title="History"
        description="Everything you have generated, newest first. Open any item to see the full result."
        actions={
          <Btn to="/content" variant="ghost">
            All tools
          </Btn>
        }
      />

      <form onSubmit={onSearch} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="history-search" className="sr-only">
            Search content history
          </label>
          <input
            id="history-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by prompt or output…"
            className={`${INPUT} pl-10`}
          />
          <SearchIcon style="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
        <div className="flex gap-2">
          <Btn type="submit">Search</Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              setQuery("");
              loadContent();
            }}
          >
            Reset
          </Btn>
        </div>
      </form>

      {isLoading ? (
        <div
          className="flex items-center justify-center py-24"
          role="status"
          aria-live="polite"
        >
          <LoadingIcon style="animate-spin h-8 w-8 text-[#ff4d1c]" />
          <span className="sr-only">Loading content history</span>
        </div>
      ) : null}

      {error && !isLoading ? (
        <p
          role="alert"
          className="flex items-center gap-2 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
        >
          <ErrorIcon style="w-5 h-5 shrink-0" />
          {error}
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title={query ? "Nothing matches that search." : "No content yet."}
          description={
            query
              ? "Try a different term, or reset the search."
              : "Generate a rewrite, an article, or SEO metadata to start building your history."
          }
          action={query ? null : <Btn to="/content">Open the studio</Btn>}
        />
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <ul className="grid gap-px border border-white/[0.08] bg-white/[0.08]">
          {items.map((item) => (
            <li key={item._id}>
              <Link
                to={`/content-details/${item._id}`}
                className="group block bg-[#0a0a0a] p-5 transition-colors hover:bg-white/[0.04] sm:p-6"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <Tag>{item.type}</Tag>
                  <span className="font-mono text-[0.625rem] tracking-[0.14em] text-white/30 uppercase">
                    {moment(item.createdAt).fromNow()}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-white/70 group-hover:text-white/90">
                  {item.prompt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Page>
  );
}
