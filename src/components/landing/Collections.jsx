import { useMemo, useState } from "react";
import { Section, SectionLabel } from "../ui/Section";

/**
 * Editorial collection grid.
 *
 * Layout is masonry-inspired rather than uniform: featured CMS items take two
 * of the twelve-column tracks and a taller frame, so the rhythm is set by the
 * content instead of a fixed template. Below `md` everything collapses to a
 * single readable column.
 *
 * Interaction is hover-driven on desktop (image scale, gradient deepening,
 * metadata and CTA reveal) but nothing is hover-*dependent*: the category,
 * title and description are always in the DOM and always visible on touch.
 */
function Tile({ item, index }) {
  const featured = Boolean(item.featured);

  return (
    <article
      className={`tile card reveal group relative overflow-hidden ${
        featured ? "md:col-span-7 lg:col-span-8" : "md:col-span-5 lg:col-span-4"
      }`}
      style={{ "--delay": `${(index % 3) * 110}ms` }}
    >
      <a
        href={`#collection-${item.slug}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
        aria-label={`${item.title} — view collection`}
      >
        <div
          className={`relative overflow-hidden ${
            featured ? "aspect-[16/10]" : "aspect-[4/5]"
          }`}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.description || item.title}
              loading="lazy"
              decoding="async"
              className="tile__image h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#141414] to-[#080808]" />
          )}

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-black/95"
          />

          {/* Always-visible metadata */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-3">
              {item.category ? (
                <span className="eyebrow !text-white/70">{item.category}</span>
              ) : null}
              {featured ? (
                <span className="font-mono text-[0.625rem] tracking-[0.2em] text-[#ff4d1c] uppercase">
                  Featured
                </span>
              ) : null}
            </div>

            <h3
              className={`font-semibold tracking-[-0.03em] uppercase ${
                featured ? "text-3xl sm:text-4xl" : "text-2xl"
              }`}
            >
              {item.title}
            </h3>

            {/* Reveals on hover/focus for desktop; shown outright on touch. */}
            <div className="tile__meta max-md:!translate-y-0 max-md:!opacity-100">
              {item.description ? (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
                  {item.description}
                </p>
              ) : null}
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.18em] text-white uppercase">
                View collection
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </div>
      </a>
    </article>
  );
}

export default function Collections({ collections = [], title, subtitle }) {
  const categories = useMemo(() => {
    const unique = [...new Set(collections.map((item) => item.category).filter(Boolean))];
    return ["All", ...unique];
  }, [collections]);

  const [active, setActive] = useState("All");

  const visible = useMemo(
    () =>
      active === "All"
        ? collections
        : collections.filter((item) => item.category === active),
    [collections, active],
  );

  if (collections.length === 0) return null;

  return (
    <Section id="collections" labelledBy="collections-title" className="rule-top">
      <div className="mb-12 flex flex-col gap-8 sm:mb-16 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel index="03">{subtitle || "Workflows"}</SectionLabel>
          <h2
            id="collections-title"
            className="mt-6 max-w-2xl text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em]"
          >
            {title || "Workflows you can run today."}
          </h2>
        </div>

        {categories.length > 2 ? (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter collections by category"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                aria-pressed={active === category}
                className={`border px-4 py-2 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
                  active === category
                    ? "border-[#ff4d1c] bg-[#ff4d1c]/10 text-white"
                    : "border-white/[0.08] text-white/50 hover:border-white/25 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-12">
        {visible.map((item, index) => (
          <Tile key={item._id || item.slug} item={item} index={index} />
        ))}
      </div>
    </Section>
  );
}
