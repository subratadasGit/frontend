import { useCallback, useEffect, useRef } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "./useMedia";

/**
 * Pulls an element a few pixels toward the pointer while hovered, then releases
 * it. Writes only `transform`, so the effect stays on the compositor.
 *
 * Disabled for touch devices and for `prefers-reduced-motion`, where the ref is
 * returned unattached and the element simply never moves.
 */
export function useMagnetic({ strength = 0.28, max = 14 } = {}) {
  const ref = useRef(null);
  const enabled = useHasFinePointer() && !usePrefersReducedMotion();

  const reset = useCallback(() => {
    const element = ref.current;
    if (element) element.style.transform = "";
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {
      reset();
      return undefined;
    }

    const onMove = (event) => {
      const bounds = element.getBoundingClientRect();
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const x = Math.max(-max, Math.min(max, dx * strength));
      const y = Math.max(-max, Math.min(max, dy * strength));
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", reset);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [enabled, strength, max, reset]);

  return ref;
}

export default useMagnetic;
