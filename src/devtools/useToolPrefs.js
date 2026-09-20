import { useCallback, useEffect, useState } from "react";

/**
 * Favourites and recently-used tools.
 *
 * Kept in `localStorage`, matching how the app already persists the session
 * (`token`, `name`, `role` in `context/auth.jsx`). These are per-browser
 * conveniences, not account data — there is no server-side preferences store
 * to extend, and inventing one for a bookmark list would be overreach.
 *
 * A `storage` event listener keeps two open tabs in agreement, and a custom
 * event does the same for two components in the same tab.
 */

const FAVOURITES_KEY = "devtools:favourites";
const RECENTS_KEY = "devtools:recents";
const RECENTS_LIMIT = 8;
const CHANGE_EVENT = "devtools:prefs-changed";

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private mode, blocked storage, or corrupted JSON — start empty.
    return [];
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; the in-memory state still works for this session.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
};

/** Subscribes to one stored list, in this tab and across tabs. */
function useStoredList(key) {
  const [value, setValue] = useState(() => read(key));

  useEffect(() => {
    const sync = () => setValue(read(key));
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [key]);

  return [value, setValue];
}

export function useFavourites() {
  const [favourites] = useStoredList(FAVOURITES_KEY);

  const toggleFavourite = useCallback((id) => {
    const current = read(FAVOURITES_KEY);
    write(
      FAVOURITES_KEY,
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }, []);

  const isFavourite = useCallback((id) => favourites.includes(id), [favourites]);

  return { favourites, toggleFavourite, isFavourite };
}

export function useRecents() {
  const [recents] = useStoredList(RECENTS_KEY);

  const recordUse = useCallback((id) => {
    const current = read(RECENTS_KEY).filter((entry) => entry !== id);
    write(RECENTS_KEY, [id, ...current].slice(0, RECENTS_LIMIT));
  }, []);

  const clearRecents = useCallback(() => write(RECENTS_KEY, []), []);

  return { recents, recordUse, clearRecents };
}
