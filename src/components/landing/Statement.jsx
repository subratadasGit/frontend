import { Section } from "../ui/Section";

/**
 * Oversized editorial statement.
 *
 * The opening lines come from the CMS `title` (split on newlines); the lines
 * below come from `content.lines`, each flagged `accent` or not so an editor
 * controls which words carry the shader's red-orange. Every line reveals from
 * behind its own mask, staggered on scroll.
 */
export default function Statement({ section }) {
  if (!section) return null;

  const leadLines = String(section.title || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = Array.isArray(section.content?.lines) ? section.content.lines : [];

  if (leadLines.length === 0 && lines.length === 0) return null;

  return (
    <Section id="statement" className="bg-[#050505]" labelledBy="statement-title">
      <h2
        id="statement-title"
        className="display text-[clamp(2.75rem,8.5vw,8rem)]"
      >
        {leadLines.map((line, index) => (
          <span className="reveal-line" key={`lead-${line}-${index}`}>
            <span style={{ "--delay": `${index * 90}ms` }}>{line}</span>
          </span>
        ))}

        {lines.length > 0 ? (
          <span className="mt-[0.35em] block">
            {lines.map((line, index) => (
              <span className="reveal-line" key={`line-${line.text}-${index}`}>
                <span
                  className={line.accent ? "accent" : "text-white/45"}
                  style={{ "--delay": `${(leadLines.length + index) * 90}ms` }}
                >
                  {line.text}
                </span>
              </span>
            ))}
          </span>
        ) : null}
      </h2>

      {section.description ? (
        <p
          className="reveal mt-14 max-w-xl border-l border-white/[0.08] pl-6 text-base leading-relaxed text-white/65"
          style={{ "--delay": "420ms" }}
        >
          {section.description}
        </p>
      ) : null}
    </Section>
  );
}
