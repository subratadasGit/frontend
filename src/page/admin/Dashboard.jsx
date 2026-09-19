import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { RESOURCES } from "../../cms/models";
import { fetchLandingContent, seedContent } from "../../cms/services";

/**
 * Admin landing screen: what the public page is currently serving, plus quick
 * entry points into each content type.
 *
 * Counts come from the same public endpoint the landing page consumes, so the
 * dashboard reflects what visitors actually see (published + enabled) rather
 * than raw row totals.
 */
const CARDS = [
  { key: "sections", label: "Sections", path: "sections" },
  { key: "features", label: "Features", path: "features" },
  { key: "collections", label: "Collections", path: "collections" },
  { key: "testimonials", label: "Testimonials", path: "testimonials" },
  { key: "navigation", label: "Nav links", path: "navigation" },
];

export default function Dashboard() {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const response = await fetchLandingContent();
      setContent(response?.data?.data || null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedContent();
      toast.success("Starter content restored where collections were empty");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not seed content");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1.5 text-sm text-white/45">
            Everything the landing page is currently publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:border-[#ff4d1c]/60 hover:text-white disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Restore starter content"}
          </button>
        </div>
      </header>

      {status === "error" ? (
        <p className="mb-8 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Could not reach the content API. The landing page will fall back to its
          bundled starter content until the API is available.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => {
          const items = content?.[card.key];
          const count = Array.isArray(items) ? items.length : null;

          return (
            <Link
              key={card.key}
              to={`/admin/${card.path}`}
              className="group border border-white/10 bg-[#0a0a0a] p-6 transition-colors hover:border-[#ff4d1c]/40"
            >
              <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
                {card.label}
              </p>
              <p className="mt-4 font-mono text-3xl tracking-tight">
                {status === "loading" ? "—" : (count ?? "—")}
              </p>
              <p className="mt-4 text-xs text-white/35 transition-colors group-hover:text-white/60">
                Live on the landing page →
              </p>
            </Link>
          );
        })}
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          All content types
        </h2>
        <div className="mt-4 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(RESOURCES).map((resource) => (
            <Link
              key={resource.key}
              to={`/admin/${resource.key}`}
              className="bg-[#050505] px-5 py-4 transition-colors hover:bg-white/[0.04]"
            >
              <p className="text-sm font-medium">{resource.label}</p>
              <p className="mt-1 text-xs text-white/35">
                {resource.singleton ? "Single record" : "Collection"} · {resource.group}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
