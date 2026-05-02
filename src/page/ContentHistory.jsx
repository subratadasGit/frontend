import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { contentHistory, searchContent } from "../services/content";
import { ErrorIcon, LoadingIcon, SearchIcon } from "../components/Icon";

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
    } catch (err) {
      setError("Failed to load content history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Content History
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Browse and manage generated content
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by prompt or output..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 pl-10 pr-3 py-2.5"
            />
            <SearchIcon style="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={() => loadContent(query)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
          <button
            onClick={() => {
              setQuery("");
              loadContent();
            }}
            className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 text-gray-800 rounded-lg"
          >
            Reset
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <LoadingIcon style="animate-spin h-10 w-10 text-indigo-600" />
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
            <ErrorIcon style="w-5 h-5" />
            {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="bg-white dark:bg-gray-900 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            No content found.
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="grid gap-4">
            {items.map((item) => (
              <Link
                key={item._id}
                to={`/content-details/${item._id}`}
                className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {moment(item.createdAt).fromNow()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                  {item.prompt}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
