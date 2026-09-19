import { useEffect, useRef, useState } from "react";
import { HalftoneFlow } from "../../shaders/neuform-isolated/NeuformCraftEffects";
import "../../shaders/threeui.css";

/**
 * PredictiveArcCanvas — ThreeUI, variant `halftone-flow`.
 *
 * Thin application-side wrapper around the registered ThreeUI component. The
 * shader itself (WebGL context, fragment shader, rAF loop, resize handling)
 * lives untouched inside `src/shaders/` — see the README there for provenance
 * and hashes.
 *
 * Everything added here is *surrounding* optimisation, never a change to the
 * registered source:
 *
 * - The iframe is only mounted once the frame first scrolls near the viewport,
 *   so a WebGL context is never created for a shader the user never reaches.
 *   Once mounted it stays mounted — see useNearViewport for why.
 * - `prefers-reduced-motion: reduce` renders a static gradient standing in for
 *   the shader's palette instead of the animated canvas.
 *
 * Pausing while the tab is hidden needs no code: the authored render loop is
 * driven by `requestAnimationFrame`, which browsers already throttle to a stop
 * on backgrounded documents.
 */

const VARIANTS = {
  "halftone-flow": HalftoneFlow,
};

/** Tracks `prefers-reduced-motion`, including live changes to the setting. */
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setPrefersReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}

/**
 * Latches true the first time the element comes within `rootMargin` of the
 * viewport, then stays true and stops observing.
 *
 * Deliberately one-way: tearing the iframe down on scroll would destroy and
 * recreate a WebGL context every time the section passes the viewport, which
 * costs more than it saves and risks hitting the browser's live-context limit.
 * Gating the *first* mount is what actually matters — a shader the user never
 * scrolls to never creates a context at all.
 *
 * Without IntersectionObserver support it starts true, so the shader still
 * renders.
 */
function useNearViewport(ref, rootMargin = "300px") {
  const [hasApproached, setHasApproached] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || hasApproached || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasApproached(true);
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, hasApproached]);

  return hasApproached;
}

export default function PredictiveArcCanvas({
  variant = "halftone-flow",
  hue = 0,
  saturation = 1.0,
  brightness = 1.0,
  className = "",
  style,
}) {
  const frameRef = useRef(null);
  const hasApproached = useNearViewport(frameRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const Effect = VARIANTS[variant];
  if (!Effect) {
    throw new Error(`PredictiveArcCanvas: unknown variant "${variant}"`);
  }

  const shouldRender = hasApproached && !prefersReducedMotion;

  return (
    <div
      ref={frameRef}
      className={`shader-frame ${className}`.trim()}
      style={style}
      aria-hidden="true"
      data-variant={variant}
    >
      {shouldRender ? (
        <Effect
          mode="dark"
          hue={hue}
          saturation={saturation}
          brightness={brightness}
        />
      ) : (
        /*
         * Static stand-in matched to the shader's own palette
         * (col_dark / col_red / col_bright in the authored fragment shader),
         * so the composition holds before mount and under reduced motion.
         */
        <div className="shader-frame__fallback" />
      )}
    </div>
  );
}
