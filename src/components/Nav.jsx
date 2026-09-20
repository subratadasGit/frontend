import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Btn } from "./ui/AppUI";
import Logo from "./ui/Logo";

/**
 * Product navigation for the authenticated app.
 *
 * Same visual system as the landing page and the CMS admin — hairline borders,
 * mono labels, ember accent — so moving between marketing, product and admin
 * never feels like changing sites.
 */
const LINKS = [
  { to: "/app", label: "Overview", end: true },
  { to: "/content", label: "Content" },
  { to: "/image", label: "Images" },
  { to: "/tools", label: "Tools" },
  { to: "/devtools", label: "Dev Tools" },
  // Shown only to administrators — see `adminOnly` filtering below.
  { to: "/admin", label: "CMS", adminOnly: true },
];

export default function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isAdmin, name: userName, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = LINKS.filter((link) => !link.adminOnly || isAdmin);

  const linkClass = ({ isActive }) =>
    `nav-link text-[0.8125rem] transition-colors ${
      isActive ? "text-white" : "text-white/55 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050505]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link
          to={isAuthenticated ? "/app" : "/"}
          className="flex shrink-0 items-center"
        >
          <Logo />
        </Link>

        {isAuthenticated ? (
          <nav aria-label="Product" className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2.5 border-l border-white/[0.08] pl-4 sm:flex">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 font-mono text-[0.6875rem] text-white/70"
                >
                  {userName?.charAt(0)?.toUpperCase()}
                </span>
                <span className="max-w-[10rem] truncate text-sm text-white/75">
                  {userName}
                </span>
              </div>
              <Btn variant="danger" onClick={handleLogout} className="!px-3 !py-2">
                Sign out
              </Btn>

              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="product-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                className="flex h-9 w-9 items-center justify-center border border-white/10 md:hidden"
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link text-[0.8125rem] text-white/55 hover:text-white"
              >
                Sign in
              </Link>
              <Btn to="/register">Get Started</Btn>
            </>
          )}
        </div>
      </div>

      {/* Mobile product links */}
      {isAuthenticated ? (
        <nav
          id="product-nav"
          hidden={!open}
          aria-label="Product (mobile)"
          className="border-t border-white/[0.08] px-4 pb-4 md:hidden"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block border-b border-white/[0.06] py-3.5 text-sm last:border-0 ${
                  isActive ? "text-white" : "text-white/55"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
