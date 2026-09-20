/**
 * The Creates.io mark.
 *
 * One component for the landing header, the product navigation, the CMS admin
 * sidebar, and the footer, so the brand is identical everywhere. The mark is
 * drawn in the favicon's ember (#ff4d1c) by default, so the tab icon and the
 * in-page logo are the same colour — pass `accent={false}` for the plain white
 * treatment where a surface needs the quieter version.
 */
export function LogoMark({ className = "h-6 w-6", accent = true }) {
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
  name = "Creates.io",
  accent = true,
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`.trim()}>
      <LogoMark className={markClassName} accent={accent} />
      <span className="text-sm font-semibold tracking-[-0.02em]">{name}</span>
    </span>
  );
}
