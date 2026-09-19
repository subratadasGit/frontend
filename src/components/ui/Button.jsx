import { Link } from "react-router-dom";
import useMagnetic from "../../hooks/useMagnetic";

/**
 * The landing page's only button. Renders as a router `Link` for in-app paths,
 * an `<a>` for anchors/external URLs, and a `<button>` when there is no target,
 * so keyboard and screen-reader semantics stay correct in each case.
 *
 * The magnetic pull lives on an inner wrapper, which keeps the transform off
 * the element that owns focus styling.
 */
function isInternal(href) {
  return Boolean(href) && href.startsWith("/") && !href.startsWith("//");
}

export default function Button({
  href,
  variant = "primary",
  children,
  withArrow = true,
  className = "",
  onClick,
  type = "button",
  ...rest
}) {
  const magneticRef = useMagnetic();

  const classes = `btn btn--${variant} ${className}`.trim();

  const inner = (
    <>
      <span>{children}</span>
      {withArrow ? (
        <span className="btn__arrow" aria-hidden="true">
          →
        </span>
      ) : null}
    </>
  );

  if (isInternal(href)) {
    return (
      <span className="magnetic inline-flex" ref={magneticRef}>
        <Link to={href} className={classes} onClick={onClick} {...rest}>
          {inner}
        </Link>
      </span>
    );
  }

  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <span className="magnetic inline-flex" ref={magneticRef}>
        <a
          href={href}
          className={classes}
          onClick={onClick}
          {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          {...rest}
        >
          {inner}
        </a>
      </span>
    );
  }

  return (
    <span className="magnetic inline-flex" ref={magneticRef}>
      <button type={type} className={classes} onClick={onClick} {...rest}>
        {inner}
      </button>
    </span>
  );
}
