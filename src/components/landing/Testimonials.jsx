import { Section, SectionLabel } from "../ui/Section";

/**
 * Social proof, set as three editorial columns divided by hairlines rather than
 * as boxed cards — quieter than the feature grid, which keeps the page's
 * emphasis where it belongs.
 */
export default function Testimonials({ testimonials = [], title, subtitle }) {
  if (testimonials.length === 0) return null;

  return (
    <Section id="proof" labelledBy="proof-title" className="rule-top">
      <SectionLabel index="05">{subtitle || "Proof"}</SectionLabel>

      <h2
        id="proof-title"
        className="mt-6 max-w-2xl text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em]"
      >
        {title || "Teams shipping more, with the same headcount."}
      </h2>

      <ul className="mt-16 grid gap-px bg-white/[0.08] md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <li
            key={testimonial._id || testimonial.name}
            className="reveal bg-[#050505] p-8 sm:p-10"
            style={{ "--delay": `${index * 110}ms` }}
          >
            <figure className="flex h-full flex-col justify-between gap-10">
              <blockquote className="text-lg leading-snug tracking-[-0.02em] text-white/90 sm:text-xl">
                <span className="accent" aria-hidden="true">
                  “
                </span>
                {testimonial.quote}
              </blockquote>

              <figcaption className="flex items-center gap-4 border-t border-white/[0.08] pt-6">
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
    </Section>
  );
}
