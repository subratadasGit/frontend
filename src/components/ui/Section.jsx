import useReveal from "../../hooks/useReveal";

/**
 * Layout primitives shared by every landing section.
 *
 * `Section` owns the semantic landmark, the vertical rhythm, and the scroll
 * reveal; `Container` owns the ruled measure. Keeping them separate lets a
 * section go full-bleed (the marquee) while still animating in.
 */

export function Container({ as: Tag = "div", ruled = false, className = "", children }) {
  return (
    <Tag className={`shell ${ruled ? "shell--ruled" : ""} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export function Section({
  id,
  as: Tag = "section",
  className = "",
  contain = true,
  ruled = true,
  labelledBy,
  children,
}) {
  const { ref, className: revealClass } = useReveal();

  return (
    <Tag
      id={id}
      ref={ref}
      aria-labelledby={labelledBy}
      className={`relative ${revealClass} ${className}`.trim()}
    >
      {contain ? (
        <Container ruled={ruled} className="py-24 sm:py-32 lg:py-40">
          {children}
        </Container>
      ) : (
        children
      )}
    </Tag>
  );
}

/**
 * Small mono label that heads most sections, with a leading index rule.
 */
export function SectionLabel({ index, children, className = "" }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`.trim()}>
      {index ? (
        <span className="text-white/30" aria-hidden="true">
          {index}
        </span>
      ) : null}
      <span className="h-px w-8 bg-white/20" aria-hidden="true" />
      {children}
    </p>
  );
}

export default Section;
