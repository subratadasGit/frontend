import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ADMIN_GROUPS } from "../../cms/models";
import { useAuth } from "../../context/auth";
import { LogoMark } from "../../components/ui/Logo";

/**
 * Admin shell: sidebar + content area.
 *
 * The sidebar is generated from `ADMIN_GROUPS`, which is itself derived from
 * the content model, so a new resource appears in the navigation without any
 * change here. Same dark visual system as the landing page and the product
 * surface, with the ember accent reserved for primary actions.
 */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { name, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors ${
      isActive
        ? "border-[#ff4d1c] bg-[#ff4d1c]/10 text-white"
        : "border-transparent text-white/50 hover:border-white/20 hover:text-white"
    }`;

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-[-0.02em]">Creates.io</span>
          <span className="font-mono text-[0.625rem] tracking-[0.18em] text-white/35 uppercase">
            CMS
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <NavLink
          to="/admin"
          end
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          Dashboard
        </NavLink>

        {ADMIN_GROUPS.map(({ group, items }) =>
          items.length === 0 ? null : (
            <div key={group} className="mt-7">
              <p className="px-4 pb-2 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
                {group}
              </p>
              {items.map((resource) => (
                <NavLink
                  key={resource.key}
                  to={`/admin/${resource.key}`}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {resource.label}
                </NavLink>
              ))}
            </div>
          ),
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase">
          Signed in
        </p>
        <p className="mt-1 truncate text-sm text-white/80">{name || "Admin"}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full border border-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="admin min-h-screen bg-[#050505] text-white">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2.5">
          <LogoMark className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-[-0.02em]">Creates.io</span>
          <span className="font-mono text-[0.625rem] tracking-[0.18em] text-white/35 uppercase">
            CMS
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          className="border border-white/10 px-3 py-1.5 text-sm"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar — static column on desktop, overlay on mobile */}
        <aside
          id="admin-sidebar"
          className={`border-r border-white/10 bg-[#0a0a0a] lg:sticky lg:top-0 lg:block lg:h-screen ${
            open ? "block" : "hidden"
          }`}
        >
          {sidebar}
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
