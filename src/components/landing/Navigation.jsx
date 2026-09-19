import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Button from "../ui/Button";
import { LogoMark } from "../ui/Logo";

/**
 * Floating navigation.
 *
 * Desktop: a single glass bar that tightens once the hero is scrolled past.
 * Mobile: logo + menu trigger, opening a full-screen drawer with staggered
 * links. The drawer traps nothing but does lock body scroll and closes on
 * Escape, on navigation, and when the viewport grows back to desktop.
 *
 * `items` comes from the CMS (label / url / order / visible).
 */
export default function Navigation({ items = [], settings, ctaLabel = "Get Started", ctaHref = "/register" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav link for whichever CMS section is currently on screen.
  useEffect(() => {
    const targets = items
      .map((item) => (item.url?.startsWith("#") ? document.querySelector(item.url) : null))
      .filter(Boolean);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (onScreen) setActiveHash(`#${onScreen.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  // Body scroll lock + Escape while the mobile drawer is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const siteName = settings?.siteName || "creates.io";

  const mark = <LogoMark className="h-6 w-6" />;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 px-[clamp(0.75rem,3vw,2rem)] pt-[clamp(0.75rem,2vw,1.5rem)]"
        data-scrolled={scrolled}
      >
        <nav
          aria-label="Primary"
          className={`mx-auto flex max-w-[1400px] items-center justify-between gap-6 rounded-full border border-white/10 px-4 backdrop-blur-xl transition-all duration-500 sm:px-6 ${
            scrolled
              ? "h-14 bg-black/70 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]"
              : "h-16 bg-white/[0.04]"
          }`}
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em]"
          >
            {mark}
            <span>{siteName}</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 lg:flex">
            {items.map((item) => (
              <li key={item._id || item.label}>
                <a
                  href={item.url}
                  className="nav-link text-[0.8125rem] text-white/60 hover:text-white"
                  data-active={activeHash === item.url}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to={isAuthenticated ? "/app" : "/login"}
              className="nav-link hidden text-[0.8125rem] text-white/60 hover:text-white sm:block"
            >
              {isAuthenticated ? "Dashboard" : "Sign in"}
            </Link>

            <Button
              href={ctaHref}
              variant="primary"
              withArrow={false}
              className="!hidden !px-5 !py-2.5 !text-[0.6875rem] lg:!inline-flex"
            >
              {ctaLabel}
            </Button>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 lg:hidden"
            >
              <span className="relative block h-3 w-4" aria-hidden="true">
                <span
                  className={`absolute left-0 block h-px w-full bg-white transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-full bg-white transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-40 lg:hidden"
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="absolute inset-0 h-full w-full cursor-default bg-black/80 backdrop-blur-xl"
        />
        <div className="relative flex h-full flex-col justify-between px-6 pt-28 pb-10">
          <ul className="flex flex-col gap-1">
            {items.map((item, index) => (
              <li
                key={item._id || item.label}
                className="overflow-hidden border-b border-white/[0.08]"
              >
                <a
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="block py-5 text-4xl font-semibold tracking-tight uppercase transition-transform duration-700"
                  style={{
                    transform: open ? "translateY(0)" : "translateY(110%)",
                    transitionDelay: `${index * 55 + 80}ms`,
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            <Button href={ctaHref} variant="primary" className="w-full">
              {ctaLabel}
            </Button>
            <Button
              href={isAuthenticated ? "/app" : "/login"}
              variant="ghost"
              withArrow={false}
              className="w-full"
            >
              {isAuthenticated ? "Dashboard" : "Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
