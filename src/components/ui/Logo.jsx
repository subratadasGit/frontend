/**
 * The creates.io mark.
 *
 * One component for the landing header, the product navigation, the CMS admin
 * sidebar, and the footer, so the brand is identical everywhere. The favicon is
 * the same shape on a dark tile (`public/favicon.svg`).
 */
export function LogoMark({ className = "h-6 w-6", accent = false }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`shrink-0 ${accent ? "text-[#ff4d1c]" : "text-white"} ${className}`.trim()}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14 24 L50 42 L86 14 L77 50 L90 84 L50 61 L18 88 L27 50 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Mark plus wordmark, as used in navigation bars. */
export default function Logo({
  className = "",
  markClassName = "h-6 w-6",
  name = "creates.io",
  accent = false,
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`.trim()}>
      <LogoMark className={markClassName} accent={accent} />
      <span className="text-sm font-semibold tracking-[-0.02em]">{name}</span>
    </span>
  );
}
