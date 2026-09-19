import { useEffect, useRef } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "../../hooks/useMedia";

/**
 * Custom cursor: a precise dot that tracks the pointer exactly, and a soft
 * radial glow that eases behind it and swells over interactive elements.
 *
 * Never mounts on touch/coarse-pointer devices or under reduced motion, so the
 * native cursor is left alone there. Position is written straight to the DOM
 * inside one rAF loop — pointer movement never triggers a React render.
 */
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, .tile, .card';

export default function Cursor() {
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const enabled = useHasFinePointer() && !usePrefersReducedMotion();

  useEffect(() => {
    if (!enabled) return undefined;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return undefined;

    document.body.dataset.cursor = "custom";

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { ...target };
    let frame = 0;
    let visible = false;

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;

      if (!visible) {
        visible = true;
        eased.x = target.x;
        eased.y = target.y;
        glow.style.opacity = "1";
        dot.style.opacity = "1";
      }

      // Swell the glow whenever the pointer is over something interactive.
      const overInteractive = Boolean(event.target?.closest?.(INTERACTIVE));
      glow.dataset.active = String(overInteractive);
    };

    const onLeave = () => {
      visible = false;
      glow.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const tick = () => {
      // Exponential easing gives the glow its lag without a physics loop.
      eased.x += (target.x - eased.x) * 0.16;
      eased.y += (target.y - eased.y) * 0.16;
      glow.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      delete document.body.dataset.cursor;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={glowRef} className="cursor-glow" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  );
}
