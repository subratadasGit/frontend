import { useEffect, useRef, useState } from "react";

/**
 * Adds `is-visible` to an element the first time it scrolls into view, which is
 * what drives every entrance animation on the landing page. The transition
 * itself lives in CSS, so the JS side stays to a single class toggle.
 *
 * Reveals once and then disconnects — content never animates back out.
 */
export function useReveal({ threshold = 0.18, rootMargin = "0px 0px -8% 0px" } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible, className: isVisible ? "is-visible" : "" };
}

export default useReveal;
