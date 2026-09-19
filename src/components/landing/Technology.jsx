import PredictiveArcCanvas from "../shader/PredictiveArcCanvas";
import { Section, SectionLabel } from "../ui/Section";

/**
 * Technical specification block.
 *
 * The shader returns here as a framed panel rather than a background, so the
 * halftone flow reads as part of the product's visual system instead of
 * decoration that only appears once at the top. This instance is viewport-gated
 * by the wrapper, so its WebGL context is only created while the section is
 * actually near the screen.
 *
 * The spec rows come from the CMS as `content.items` — label / value / detail.
 */
export default function Technology({ section }) {
  if (!section) return null;

  const items = Array.isArray(section.content?.items) ? section.content.items : [];

  return (
    <Section id="technology" labelledBy="technology-title" className="rule-top">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Framed shader panel */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <div className="relative aspect-square border border-white/[0.08] sm:aspect-[4/3] lg:aspect-square">
              <PredictiveArcCanvas
                variant="halftone-flow"
                hue={0}
                saturation={1.0}
                brightness={1.0}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_35%,rgba(5,5,5,0.75)_100%)]"
              />

              {/* Corner registration marks — technical framing, not chrome. */}
              <span className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-white/30" />
              <span className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-white/30" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/30" />
              <span className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-white/30" />
            </div>

            <p className="eyebrow mt-4 flex items-center justify-between">
              <span>PredictiveArcCanvas</span>
              <span className="text-white/25">halftone-flow</span>
            </p>
          </div>
        </div>

        {/* Specification table */}
        <div className="lg:col-span-7">
          <SectionLabel index="04">{section.subtitle || "Technology"}</SectionLabel>

          <h2
            id="technology-title"
            className="mt-6 max-w-xl text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em]"
          >
            {section.title}
          </h2>

          {section.description ? (
            <p className="reveal mt-6 max-w-xl text-base leading-relaxed text-white/65">
              {section.description}
            </p>
          ) : null}

          {items.length > 0 ? (
            <dl className="mt-14 border-t border-white/[0.08]">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  className="reveal group grid grid-cols-1 gap-2 border-b border-white/[0.08] py-7 transition-colors duration-500 hover:bg-white/[0.02] sm:grid-cols-12 sm:gap-6"
                  style={{ "--delay": `${index * 80}ms` }}
                >
                  <dt className="eyebrow flex items-center gap-3 sm:col-span-3">
                    <span className="text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </dt>
                  <dd className="sm:col-span-9">
                    <p className="text-lg font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-[#ff9933]">
                      {item.value}
                    </p>
                    {item.detail ? (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
                        {item.detail}
                      </p>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
