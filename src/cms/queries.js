import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLandingContent, fetchResource } from "./services";
import FALLBACK_CONTENT from "./fallbackContent";

/**
 * Data-fetching hooks for CMS content.
 *
 * Landing data flows: CMS → MongoDB → CMS service → API → these hooks → page.
 * Components receive plain content objects and never reach for the network
 * themselves.
 */

/**
 * Loads the whole landing page in one request.
 *
 * Falls back to the generated seed mirror if the API is unreachable, so the
 * marketing surface degrades to static content instead of an empty page.
 * `source` reports which path produced the content.
 */
export function useLandingContent() {
  const [state, setState] = useState({
    content: null,
    status: "loading",
    source: null,
    error: null,
  });

  const load = useCallback(async ({ signal } = {}) => {
    try {
      const response = await fetchLandingContent({ signal });
      const content = response?.data?.data;
      if (!content) throw new Error("Malformed CMS response");
      return { content, status: "ready", source: "api", error: null };
    } catch (error) {
      if (error?.name === "CanceledError") return null;
      return {
        content: FALLBACK_CONTENT,
        status: "ready",
        source: "fallback",
        error,
      };
    }
  }, []);

  useEffect(() => {
    let active = true;
    load().then((next) => {
      if (active && next) setState(next);
    });
    return () => {
      active = false;
    };
  }, [load]);

  return state;
}

/**
 * Loads one admin resource (a collection, or a singleton's current value).
 * Returns a `refresh` callback so mutations can re-read without a remount.
 */
export function useResource(resourceKey, { singleton = false } = {}) {
  const [data, setData] = useState(singleton ? null : []);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");
    try {
      const response = await fetchResource(resourceKey);
      // Ignore responses from a superseded request.
      if (id !== requestId.current) return;
      setData(response?.data?.data ?? (singleton ? {} : []));
      setError(null);
      setStatus("ready");
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(caught);
      setStatus("error");
    }
  }, [resourceKey, singleton]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, status, error, refresh };
}
