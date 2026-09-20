/**
 * The product's loading state.
 *
 * Built from the brand mark rather than a generic spinner: the logo's outline
 * draws itself in, the ember fill lands, and the mark then breathes inside two
 * counter-rotating rings while the wordmark types itself out letter by letter.
 * Motion lives in `index.css` under "Brand loader" so it is all in one place
 * and can be switched off wholesale under `prefers-reduced-motion`.
 *
 * Used by route suspense (`LoadingSpinner`) and by the landing page's first
 * paint, so every wait in the application looks like the same product.
 */

/** The same path as `LogoMark` and `public/favicon.svg`. */
const MARK_PATH =
  "M14 24 L50 42 L86 14 L77 50 L90 84 L50 61 L18 88 L27 50 Z";

export default function BrandLoader({
  label = "Loading",
  name = "Creates.io",
  className = "",
}) {
  return (
    <div className={`brand-loader ${className}`.trim()}>
      <span className="brand-loader__field" aria-hidden="true" />

      <div className="brand-loader__mark">
        <svg
          className="brand-loader__rings"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          {/* Outer dashed ring, turning slowly. */}
          <circle
            className="brand-loader__ring-outer"
            cx="50"
            cy="50"
            r="47"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
            strokeDasharray="2 7"
            strokeLinecap="round"
          />
          {/* A single ember arc, faster and against the grain. */}
          <circle
            className="brand-loader__ring-inner"
            cx="50"
            cy="50"
            r="47"
            stroke="#ff4d1c"
            strokeWidth="1.5"
            strokeDasharray="44 251"
            strokeLinecap="round"
          />
          {/* Ember travelling the same orbit at its own rate. */}
          <g className="brand-loader__orbit">
            <circle cx="50" cy="3" r="2.1" fill="#ff9933" />
          </g>
        </svg>

        <svg
          className="brand-loader__svg"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          {/* `pathLength` normalises the outline to 1 so the dash animation is
              independent of the mark's real perimeter. */}
          <path
            className="brand-loader__outline"
            d={MARK_PATH}
            pathLength="1"
            stroke="#ff4d1c"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
          <path className="brand-loader__fill" d={MARK_PATH} fill="#ff4d1c" />
        </svg>
      </div>

      <p className="mt-9 text-[0.9375rem] font-semibold tracking-[-0.02em] text-white">
        {name.split("").map((character, index) => (
          <span
            // Index is the identity here: this is a fixed string rendered once.
            key={`${character}-${index}`}
            className="brand-loader__letter"
            style={{ "--delay": `${1150 + index * 55}ms` }}
          >
            {character}
          </span>
        ))}
      </p>

      <span className="brand-loader__rail mt-5" aria-hidden="true" />

      <p className="mt-4 font-mono text-[0.625rem] tracking-[0.28em] text-white/35 uppercase">
        {label}
      </p>
    </div>
  );
}
