import { Section } from "../ui/Section";
import Button from "../ui/Button";

/**
 * Closing call to action.
 *
 * Deliberately shader-free: after two WebGL panels the page needs a moment of
 * stillness before the footer, so the accent here is a single soft radial
 * bloom behind very large type.
 */
export default function CallToAction({ section }) {
  if (!section) return null;

  const primary = section.content?.primaryCTA;
  const secondary = section.content?.secondaryCTA;

  return (
    <Section id="start" labelledBy="cta-title" className="rule-top overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[520px] -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,77,28,0.16)_0%,transparent_70%)]"
      />

      <div className="mx-auto max-w-4xl text-center">
        <h2
          id="cta-title"
          className="display text-[clamp(2.75rem,8vw,7rem)]"
        >
          <span className="reveal-line">
            <span>{section.title}</span>
          </span>
        </h2>

        {section.description ? (
          <p
            className="reveal mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
            style={{ "--delay": "160ms" }}
          >
            {section.description}
          </p>
        ) : null}

        <div
          className="reveal mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          style={{ "--delay": "280ms" }}
        >
          {primary?.label ? (
            <Button href={primary.url} variant="primary">
              {primary.label}
            </Button>
          ) : null}
          {secondary?.label ? (
            <Button href={secondary.url} variant="ghost">
              {secondary.label}
            </Button>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
