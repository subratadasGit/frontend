/**
 * Full-bleed scrolling statement band.
 *
 * The track holds the CMS items twice; the keyframe translates it by exactly
 * -50%, so the loop is seamless with a single animation and no JS. Under
 * reduced motion the animation is cancelled in CSS and the band reads as a
 * static row of terms.
 */
export default function Marquee({ section }) {
  const items = section?.content?.items?.length
    ? section.content.items
    : String(section?.title || "")
        .split("·")
        .map((item) => item.trim())
        .filter(Boolean);

  if (items.length === 0) return null;

  const track = [...items, ...items];

  return (
    <section
      aria-label={section?.title || "Highlights"}
      className="relative overflow-hidden border-y border-white/[0.08] bg-[#0a0a0a] py-6 sm:py-8"
    >
      {/* Fade the band into the page background at both edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050505] to-transparent sm:w-32"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050505] to-transparent sm:w-32"
      />

      <div className="marquee">
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-8 px-8 text-xl font-semibold tracking-tight whitespace-nowrap uppercase sm:gap-12 sm:px-12 sm:text-3xl"
            /* The list is duplicated for the loop; only announce it once. */
            aria-hidden={index >= items.length ? "true" : undefined}
          >
            <span className={index % 2 === 1 ? "text-white/35" : "text-white"}>
              {item}
            </span>
            <span className="text-[#ff4d1c]" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
