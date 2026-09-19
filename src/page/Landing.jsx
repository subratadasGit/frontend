import { useEffect, useMemo } from "react";
import { useLandingContent } from "../cms/queries";
import Seo from "../components/Seo";
import Cursor from "../components/ui/Cursor";
import Navigation from "../components/landing/Navigation";
import Hero from "../components/landing/Hero";
import Marquee from "../components/landing/Marquee";
import Statement from "../components/landing/Statement";
import About from "../components/landing/About";
import Features from "../components/landing/Features";
import Collections from "../components/landing/Collections";
import Technology from "../components/landing/Technology";
import Testimonials from "../components/landing/Testimonials";
import CallToAction from "../components/landing/CallToAction";
import Footer from "../components/landing/Footer";

/**
 * The landing page.
 *
 * Data flow: CMS → MongoDB → CMS service → API → `useLandingContent` → here →
 * presentational sections. This component owns composition and ordering only;
 * every string, link, image and section on the page comes from the CMS.
 *
 * Section ordering is CMS-controlled: `sections` arrives sorted by `order`, and
 * the fixed-position blocks (features, collections, proof) are slotted into the
 * narrative at the points the story calls for them.
 */

/**
 * Section types that supply only a heading for a block rendered from its own
 * collection (features, collections, testimonials) rather than a layout of
 * their own.
 */
const HEADING_ONLY_TYPES = ["features", "collections", "proof"];

/** Maps a CMS section `type` to the component that renders it. */
const SECTION_COMPONENTS = {
  marquee: Marquee,
  statement: Statement,
  about: About,
  technology: Technology,
  cta: CallToAction,
};

export default function Landing() {
  const { content, status, source } = useLandingContent();

  // The landing surface is always dark, independent of the product's
  // light/dark preference. Restored on unmount so the app pages are unaffected.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    document.body.style.backgroundColor = "#050505";
    return () => {
      if (!hadDark) root.classList.remove("dark");
      document.body.style.backgroundColor = "";
    };
  }, []);

  const sections = useMemo(
    () => (Array.isArray(content?.sections) ? content.sections : []),
    [content],
  );

  const bySlot = useMemo(() => {
    const byType = (type) => sections.find((section) => section.type === type);
    return {
      marquee: byType("marquee"),
      statement: byType("statement"),
      about: byType("about"),
      technology: byType("technology"),
      cta: byType("cta"),
      // Heading-only sections: these carry the title/subtitle for the blocks
      // built from their own collections, so that copy is CMS-editable too.
      features: byType("features"),
      collections: byType("collections"),
      proof: byType("proof"),
    };
  }, [sections]);

  if (status === "loading") {
    return (
      <div
        className="landing flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <span className="eyebrow animate-pulse">Loading</span>
      </div>
    );
  }

  if (!content) return null;

  const { settings, hero, seo, footer, navigation, features, collections, testimonials } =
    content;

  const heroStats = bySlot.about?.content?.stats || [];

  // Sections the renderer does not place explicitly still render, in `order`,
  // so adding a new one in the CMS never silently drops it from the page.
  const placedTypes = new Set([
    ...Object.keys(SECTION_COMPONENTS),
    ...HEADING_ONLY_TYPES,
  ]);
  const unplaced = sections.filter((section) => !placedTypes.has(section.type));

  return (
    <div className="landing">
      <Seo seo={seo} settings={settings} />
      <Cursor />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border focus:border-white/20 focus:bg-black focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <Navigation
        items={navigation}
        settings={settings}
        ctaLabel={hero?.primaryCTA?.label || "Get Started"}
        ctaHref={hero?.primaryCTA?.url || "/register"}
      />

      <main id="main">
        {/* BIG IDEA */}
        <Hero hero={hero} stats={heroStats} />

        {/* VISUAL IMPACT */}
        {bySlot.marquee ? <Marquee section={bySlot.marquee} /> : null}
        {bySlot.statement ? <Statement section={bySlot.statement} /> : null}

        {/* PRODUCT */}
        {bySlot.about ? <About section={bySlot.about} /> : null}
        <Features
          features={features}
          title={bySlot.features?.title}
          subtitle={bySlot.features?.subtitle}
        />
        <Collections
          collections={collections}
          title={bySlot.collections?.title}
          subtitle={bySlot.collections?.subtitle}
        />

        {/* TECHNOLOGY */}
        {bySlot.technology ? <Technology section={bySlot.technology} /> : null}

        {/* PROOF */}
        <Testimonials
          testimonials={testimonials}
          title={bySlot.proof?.title}
          subtitle={bySlot.proof?.subtitle}
        />

        {unplaced.map((section) => {
          const Component = SECTION_COMPONENTS[section.type];
          return Component ? (
            <Component key={section._id || section.type} section={section} />
          ) : null;
        })}

        {/* ACTION */}
        {bySlot.cta ? <CallToAction section={bySlot.cta} /> : null}
      </main>

      <Footer footer={footer} settings={settings} />

      {source === "fallback" ? (
        <p className="sr-only" role="status">
          Showing cached content — the content API is unavailable.
        </p>
      ) : null}
    </div>
  );
}
