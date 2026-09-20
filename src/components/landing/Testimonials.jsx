import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel } from "../ui/Section";
import { usePrefersReducedMotion } from "../../hooks/useMedia";

/**
 * Social proof, as a carousel.
 *
 * The track is a scroll-snap rail rather than a transform slider: the browser
 * owns the physics, so trackpad swipes, touch flicks and the arrow buttons all
 * land on the same snap points, and slides-per-view is a CSS breakpoint rather
 * than a layout calculation.
 *
 * The one thing JS does measure is how far the rail can actually travel
 * (`maxIndex`) — the last slides share the final viewport, so the number of
 * positions is always fewer than the number of slides. Driving the controls off
 * that, rather than off the slide count, is what keeps the dots, the counter
 * and the arrows' disabled state honest.
 *
 * Autoplay advances one position at a time and pauses on hover, on focus, when
 * the section scrolls out of view, and under `prefers-reduced-motion`.
 */

const AUTOPLAY_MS = 5600;

export default function Testimonials({ testimonials = [], title, subtitle }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  // The highest slide index the rail can actually scroll to. The last slides
  // share the final viewport, so with three slides two-up there are two
  // positions, not three — paginating by slide index alone would leave the
  // final dots unreachable.
  const [maxIndex, setMaxIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const count = testimonials.length;

  /**
   * Scrolls the rail so slide `index` sits at its snap point.
   *
   * Assigns `scrollLeft` rather than calling `scrollTo({behavior:"smooth"})` —
   * inside a mandatory snap container the browser cancels a programmatic smooth
   * scroll and snaps straight back. The animation comes from `scroll-behavior`
   * in CSS instead, which snapping cooperates with.
   */
  const goTo = useCallback((index) => {
    const track = trackRef.current;
    const slide = track?.children?.[index];
    if (!track || !slide) return;
    // Set the index up front rather than waiting for the scroll listener, so
    // the dots, the counter and the arrows' disabled state respond on the click
    // instead of a frame or two into the animation. The listener below then
    // reconciles it for swipes and trackpad scrolls.
    setActive(index);
    track.scrollLeft = slide.offsetLeft - track.offsetLeft;
  }, []);

  // Which slide is at the rail's left edge, derived from scroll position so
  // the dots stay correct for swipes as well as button presses.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const slides = Array.from(track.children);
        const left = track.scrollLeft + track.offsetLeft;
        let nearest = 0;
        let smallest = Infinity;
        slides.forEach((slide, index) => {
          const distance = Math.abs(slide.offsetLeft - left);
          if (distance < smallest) {
            smallest = distance;
            nearest = index;
          }
        });
        setActive(nearest);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  // A rail that fits its container has nothing to advance to, so the controls
  // and the off-centre dimming are suppressed rather than left inert.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const measure = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 1) {
        setMaxIndex(0);
        return;
      }
      const slides = Array.from(track.children);
      let last = 0;
      slides.forEach((slide, index) => {
        if (slide.offsetLeft - track.offsetLeft <= maxScroll + 1) last = index;
      });
      setMaxIndex(last);
    };
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [count]);

  // Only run autoplay while the carousel is actually on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || !inView || maxIndex === 0) return undefined;
    // Wraps back to the start once the last reachable position is showing.
    const timer = setInterval(
      () => goTo(active >= maxIndex ? 0 : active + 1),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [active, goTo, inView, maxIndex, paused, reducedMotion]);

  if (count === 0) return null;

  const step = (direction) => {
    goTo(Math.min(Math.max(active + direction, 0), maxIndex));
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const scrollable = maxIndex > 0;
  const atStart = active === 0;
  const atEnd = active >= maxIndex;

  return (
    <Section id="proof" labelledBy="proof-title" className="rule-top">
      <SectionLabel index="05">{subtitle || "Proof"}</SectionLabel>

      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <h2
          id="proof-title"
          className="max-w-2xl text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em]"
        >
          {title || "Teams shipping more, with the same headcount."}
        </h2>

        {scrollable ? (
          <div className="flex shrink-0 items-center gap-3">
            <span className="mr-2 font-mono text-[0.6875rem] tracking-[0.18em] text-white/35 tabular-nums">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(maxIndex + 1).padStart(2, "0")}
            </span>
            <CarouselButton
              label="Previous testimonial"
              onClick={() => step(-1)}
              disabled={atStart}
              direction="left"
            />
            <CarouselButton
              label="Next testimonial"
              onClick={() => step(1)}
              disabled={atEnd}
              direction="right"
            />
          </div>
        ) : null}
      </div>

      <div
        className="proof-carousel mt-14"
        role="group"
        aria-roledescription="carousel"
        aria-label="Customer testimonials"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <ul
          ref={trackRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-live={paused ? "polite" : "off"}
          data-scrollable={scrollable}
          data-single={count === 1}
          className="proof-carousel__track focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4d1c]"
        >
          {testimonials.map((testimonial, index) => (
            <li
              key={testimonial._id || `${testimonial.name}-${index}`}
              className="proof-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              data-active={index === active}
            >
              <figure className="proof-card">
                <span className="proof-card__quote" aria-hidden="true">
                  “
                </span>

                <blockquote className="text-lg leading-snug tracking-[-0.02em] text-white/90 sm:text-xl">
                  {testimonial.quote}
                </blockquote>

                <figcaption className="mt-10 flex items-center gap-4 border-t border-white/[0.08] pt-6">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.14] font-mono text-xs text-white/70"
                    >
                      {testimonial.name?.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="eyebrow mt-1">
                      {[testimonial.role, testimonial.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        {scrollable ? (
          <div className="mt-10 flex items-center gap-2">
            {testimonials.slice(0, maxIndex + 1).map((testimonial, index) => (
              <button
                key={testimonial._id || `dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1} of ${maxIndex + 1}`}
                aria-current={index === active}
                className="proof-carousel__dot"
                data-active={index === active}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/** Hairline circular control, matching the landing page's button language. */
function CarouselButton({ label, onClick, disabled, direction }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.14] text-white transition-all duration-300 hover:border-[#ff4d1c] hover:text-[#ff4d1c] disabled:pointer-events-none disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-4 w-4 transition-transform duration-300 ${
          direction === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        }`}
      >
        <path d={direction === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"} />
      </svg>
    </button>
  );
}
