import { Section, SectionLabel } from "../ui/Section";

/**
 * Product introduction, laid out as an editorial spread: a sticky label column
 * on the left, the argument on the right, and a hairline stat table beneath.
 * Collapses to a single column below `lg`.
 */
export default function About({ section }) {
  if (!section) return null;

  const stats = Array.isArray(section.content?.stats) ? section.content.stats : [];

  return (
    <Section id="about" labelledBy="about-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index="01">{section.subtitle || "About"}</SectionLabel>
            {section.image ? (
              <img
                src={section.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="mt-10 hidden w-full border border-white/[0.08] object-cover lg:block"
              />
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-8">
          <h2
            id="about-title"
            className="max-w-3xl text-[clamp(1.875rem,4.2vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.035em]"
          >
            {section.title}
          </h2>

          {section.description ? (
            <p
              className="reveal mt-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
              style={{ "--delay": "140ms" }}
            >
              {section.description}
            </p>
          ) : null}

          {stats.length > 0 ? (
            <dl className="mt-16 grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="reveal bg-[#050505] p-6 sm:p-8"
                  style={{ "--delay": `${index * 90 + 200}ms` }}
                >
                  <dd className="font-mono text-2xl tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dt className="eyebrow mt-3">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
