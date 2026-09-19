import { useEffect, useState } from "react";

/**
 * Subscribes to a media query and re-renders when it changes.
 * Used to gate desktop-only behaviour (the custom cursor, magnetic buttons)
 * and to honour `prefers-reduced-motion`.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True on devices with a precise pointer — i.e. not touch. */
export const useHasFinePointer = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");

export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

export default useMediaQuery;
