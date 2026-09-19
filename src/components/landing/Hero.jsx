import { useEffect, useState } from "react";
import PredictiveArcCanvas from "../shader/PredictiveArcCanvas";
import Button from "../ui/Button";

/**
 * Full-viewport hero.
 *
 * Layer order, back to front:
 *   1. PredictiveArcCanvas — the halftone-flow shader, full-bleed
 *   2. Scrim — vertical + horizontal gradients that buy text contrast
 *   3. Structural hairlines — echo the ruled frame used across the page
 *   4. Content — headline, supporting statement, CTAs, scroll cue
 *
 * The headline is split on newlines from the CMS `title`, so an editor
 * controls both the words and how they break across lines. Each line reveals
 * from behind its own mask on mount rather than on scroll, because the hero is
 * already in view.
 */
export default function Hero({ hero, stats = [] }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // One frame's delay so the entrance transition has a start state to run from.
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!hero || hero.enabled === false) return null;

  const lines = String(hero.title || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className={`relative isolate flex min-h-[100svh] flex-col ${entered ? "is-visible" : ""}`}
    >
      {/* 1 — Shader */}
      <div className="absolute inset-0 -z-20">
        <PredictiveArcCanvas
          variant="halftone-flow"
          hue={0}
          saturation={1.0}
          brightness={1.0}
        />
      </div>

      {/* 2 — Readability scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.58)_32%,rgba(5,5,5,0.42)_55%,rgba(5,5,5,0.88)_88%,#050505_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(5,5,5,0.9)_0%,rgba(5,5,5,0.35)_45%,transparent_78%)]"
      />

      {/* 3 — Structural hairlines */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="shell h-full border-x border-white/[0.08]" />
      </div>

      {/* 4 — Content */}
      <div className="shell relative flex flex-1 flex-col justify-end pt-28 pb-10 sm:pb-12">
        <div className="max-w-[min(1100px,100%)]">
          {hero.eyebrow ? (
            <p
              className="eyebrow reveal mb-6 sm:mb-8"
              style={{ "--delay": "120ms" }}
            >
              {hero.eyebrow}
            </p>
          ) : null}

          <h1
            id="hero-title"
            className="display text-[clamp(4rem,10vw,10rem)]"
          >
            {lines.map((line, index) => (
              <span className="reveal-line" key={line + index}>
                <span style={{ "--delay": `${index * 130 + 180}ms` }}>{line}</span>
              </span>
            ))}
          </h1>

          {hero.description ? (
            <p
              className="reveal mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
              style={{ "--delay": `${lines.length * 130 + 340}ms` }}
            >
              {hero.description}
            </p>
          ) : null}

          <div
            className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            style={{ "--delay": `${lines.length * 130 + 460}ms` }}
          >
            {hero.primaryCTA?.label ? (
              <Button href={hero.primaryCTA.url} variant="primary">
                {hero.primaryCTA.label}
              </Button>
            ) : null}
            {hero.secondaryCTA?.label ? (
              <Button href={hero.secondaryCTA.url} variant="ghost">
                {hero.secondaryCTA.label}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Baseline: scroll cue on the left, first CMS stat on the right. */}
        <div
          className="reveal mt-10 flex items-end justify-between gap-8 border-t border-white/[0.08] pt-5 sm:mt-12"
          style={{ "--delay": `${lines.length * 130 + 600}ms` }}
        >
          <div className="flex items-center gap-4">
            <span
              className="scroll-cue relative block h-10 w-px overflow-hidden bg-white/12"
              aria-hidden="true"
            />
            <span className="eyebrow">Scroll</span>
          </div>

          {stats.length > 0 ? (
            <dl className="hidden gap-10 sm:flex">
              {stats.slice(0, 2).map((stat) => (
                <div key={stat.label} className="text-right">
                  <dt className="eyebrow mb-1.5">{stat.label}</dt>
                  <dd className="font-mono text-lg tracking-tight text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
