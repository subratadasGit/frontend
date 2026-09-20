import BrandLoader from "./ui/BrandLoader";

/**
 * Full-screen wait shown by route suspense.
 *
 * The animation itself lives in `BrandLoader` so the landing page's first paint
 * uses exactly the same one.
 */
export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#050505] px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <BrandLoader label={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
