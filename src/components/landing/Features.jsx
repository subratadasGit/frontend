import { useCallback } from "react";
import { Section, SectionLabel } from "../ui/Section";
import FeatureIcon from "./FeatureIcon";
import { useHasFinePointer, usePrefersReducedMotion } from "../../hooks/useMedia";

/**
 * Numbered capability cards.
 *
 * Hover state is CSS (border warm-up, gradient sweep, lift). The only JS is a
 * small pointer-driven tilt, written to CSS custom properties so React never
 * re-renders on pointer movement. Tilt is skipped entirely on touch devices
 * and under reduced motion, where the cards stay flat.
 */
function FeatureCard({ feature, index, tiltEnabled }) {
  const onPointerMove = useCallback(
    (event) => {
      if (!tiltEnabled) return;
      const card = event.currentTarget;
      const bounds = card.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width - 0.5;
      const py = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--tilt-y", `${px * 6}deg`);
      card.style.setProperty("--tilt-x", `${-py * 6}deg`);
    },
    [tiltEnabled],
  );

  const onPointerLeave = useCallback((event) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }, []);

  return (
    <article
      className="card card--tilt reveal flex flex-col p-8 sm:p-10"
      style={{ "--delay": `${index * 110}ms` }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <header className="flex items-start justify-between gap-6">
        <span className="font-mono text-xs tracking-[0.2em] text-white/30">
          {String(index + 1).padStart(2, "0")}
        </span>
        <FeatureIcon
          name={feature.icon}
          className="h-7 w-7 text-[#ff4d1c] transition-transform duration-500 group-hover:scale-110"
        />
      </header>

      <div className="mt-20 sm:mt-24">
        <h3 className="text-2xl font-semibold tracking-[-0.03em] uppercase sm:text-[1.75rem]">
          {feature.title}
        </h3>
        {feature.description ? (
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            {feature.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function Features({ features = [], title, subtitle }) {
  const tiltEnabled = useHasFinePointer() && !usePrefersReducedMotion();

  if (features.length === 0) return null;

  return (
    <Section id="features" labelledBy="features-title" className="rule-top">
      <div className="mb-14 flex flex-col gap-6 sm:mb-20 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel index="02">{subtitle || "Capabilities"}</SectionLabel>
          <h2
            id="features-title"
            className="mt-6 max-w-xl text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em]"
          >
            {title || "Three things this does properly."}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature._id || feature.title}
            feature={feature}
            index={index}
            tiltEnabled={tiltEnabled}
          />
        ))}
      </div>
    </Section>
  );
}
