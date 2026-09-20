import { Fragment } from "react";
import { Link } from "react-router-dom";

/**
 * The trail above a deep tool page.
 *
 * Deliberately quiet — mono, uppercase, the same `text-white/35` the eyebrows
 * use elsewhere — so it orients without competing with the tool's own title.
 * The last crumb is the current page and is not a link.
 */
export default function Breadcrumbs({ trail = [] }) {
  const crumbs = trail.filter(Boolean);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem] tracking-[0.16em] uppercase">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.to && !last ? (
                  <Link
                    to={crumb.to}
                    className="text-white/35 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={last ? "text-white/70" : "text-white/35"} aria-current={last ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
              {last ? null : (
                <li aria-hidden="true" className="text-white/20">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
