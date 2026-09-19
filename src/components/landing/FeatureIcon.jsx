/**
 * Line iconography for CMS features, keyed by the `icon` field.
 *
 * Drawn on a shared 24px grid with a 1px stroke so the set reads as one family
 * alongside the page's hairline rules. Unknown keys fall back to `grid`.
 */
const PATHS = {
  shield: (
    <>
      <path d="M12 2.5 20 6v6.2c0 4.6-3.2 7.8-8 9.3-4.8-1.5-8-4.7-8-9.3V6l8-3.5Z" />
      <path d="m8.8 12.1 2.3 2.3 4.1-4.6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2.8 9 5.2-9 5.2L3 8l9-5.2Z" />
      <path d="m3 12.6 9 5.2 9-5.2" />
      <path d="m3 16.9 9 5.2 9-5.2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2.5v6.2M12 15.3v6.2M2.5 12h6.2M15.3 12h6.2" />
      <path d="m5.6 5.6 3.1 3.1M15.3 15.3l3.1 3.1M18.4 5.6l-3.1 3.1M8.7 15.3l-3.1 3.1" />
      <circle cx="12" cy="12" r="2.3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.4" height="7.4" />
      <rect x="13.6" y="3" width="7.4" height="7.4" />
      <rect x="3" y="13.6" width="7.4" height="7.4" />
      <rect x="13.6" y="13.6" width="7.4" height="7.4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10.2" width="16" height="11" rx="1.4" />
      <path d="M8 10.2V7.1a4 4 0 0 1 8 0v3.1" />
      <path d="M12 14.4v2.6" />
    </>
  ),
  pen: (
    <>
      <path d="m14.6 4.3 5.1 5.1-10 10L3 21l1.6-6.7 10-10Z" />
      <path d="m13 5.9 5.1 5.1" />
      <path d="M4.6 14.3 9.7 19.4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m15.7 15.7 5.3 5.3" />
    </>
  ),
};

export default function FeatureIcon({ name = "grid", className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] || PATHS.grid}
    </svg>
  );
}
