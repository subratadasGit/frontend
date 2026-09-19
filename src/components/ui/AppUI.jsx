import { Link } from "react-router-dom";

/**
 * Shared primitives for the authenticated product surface.
 *
 * These carry the same tokens as the landing page and the CMS admin — #050505
 * ground, #0a0a0a panels, hairline borders, mono labels, ember accent — so the
 * whole application reads as one product rather than three.
 */

/* --------------------------------- Tokens -------------------------------- */

export const INPUT =
  "w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff4d1c] disabled:opacity-50";

export const INPUT_ERROR = "border-red-500/60 focus:border-red-500";

export const LABEL =
  "mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase";

/* --------------------------------- Layout -------------------------------- */

/** Full-height page ground. Every authenticated screen sits on this. */
export function Page({ className = "", children }) {
  return (
    <div className={`min-h-screen bg-[#050505] text-white ${className}`.trim()}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-8 sm:py-14">
        {children}
      </div>
    </div>
  );
}

/**
 * Section heading shared by every product screen: mono eyebrow, tight title,
 * muted description, optional actions on the right.
 */
export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <header
      className={`mb-10 flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.06] font-semibold tracking-[-0.035em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** Hairline panel used for forms, results, and content blocks. */
export function Panel({ as: Tag = "div", className = "", children }) {
  return (
    <Tag
      className={`border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8 ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------- Actions ------------------------------- */

const VARIANTS = {
  primary:
    "bg-[#ff4d1c] text-[#0a0000] font-semibold border border-[#ff4d1c] hover:bg-[#ff6a3d] hover:shadow-[0_0_34px_rgba(255,77,28,0.35)]",
  ghost:
    "border border-white/10 text-white hover:border-white/35 hover:bg-white/[0.04]",
  subtle: "border border-transparent text-white/55 hover:text-white",
  danger:
    "border border-white/10 text-white/55 hover:border-red-500/50 hover:text-red-400",
};

const BASE =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]";

/**
 * The product surface's button. Renders as a router link when given `to`, so
 * navigation keeps correct semantics instead of a click handler on a div.
 */
export function Btn({
  to,
  href,
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const classes = `${BASE} ${VARIANTS[variant] || VARIANTS.primary} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ---------------------------------- Bits --------------------------------- */

/** Mono pill used for content types, categories, and statuses. */
export function Tag({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.16em] text-white/60 uppercase ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/** Shown when a list or result area has nothing in it yet. */
export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-white/10 px-6 py-16 text-center">
      <p className="text-sm font-medium text-white/80">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-white/40">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Inline validation message tied to a field by `aria-describedby`. */
export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 text-xs text-red-400">
      {children}
    </p>
  );
}
