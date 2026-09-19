/**
 * CMS-driven document metadata.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the
 * tree into `<head>`, so this component needs no head-management library and
 * no imperative DOM writes — the metadata is simply part of the render output
 * and updates whenever the CMS content changes.
 */
export default function Seo({ seo, settings }) {
  if (!seo) return null;

  const title = seo.metaTitle || settings?.siteName || "";
  const description = seo.metaDescription || "";
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.join(", ") : seo.keywords;

  // Resolve the canonical URL against the live origin so a CMS value of just a
  // path still produces an absolute URL.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonical = seo.canonicalUrl
    ? new URL(seo.canonicalUrl, origin || undefined).toString()
    : origin
      ? `${origin}${window.location.pathname}`
      : "";
  const ogImage = seo.ogImage
    ? new URL(seo.ogImage, origin || undefined).toString()
    : "";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.siteName || title,
    description,
    ...(canonical ? { url: canonical } : {}),
    ...(settings?.logo && origin
      ? { logo: new URL(settings.logo, origin).toString() }
      : {}),
    ...(Array.isArray(settings?.socialLinks) && settings.socialLinks.length
      ? { sameAs: settings.socialLinks.map((link) => link.url).filter(Boolean) }
      : {}),
    ...(settings?.contactInformation?.email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: settings.contactInformation.email,
            ...(settings.contactInformation.phone
              ? { telephone: settings.contactInformation.phone }
              : {}),
          },
        }
      : {}),
  };

  return (
    <>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {seo.robots ? <meta name="robots" content={seo.robots} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {settings?.favicon ? (
        <link rel="icon" href={settings.favicon} />
      ) : null}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      {ogTitle ? <meta property="og:title" content={ogTitle} /> : null}
      {ogDescription ? (
        <meta property="og:description" content={ogDescription} />
      ) : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {settings?.siteName ? (
        <meta property="og:site_name" content={settings.siteName} />
      ) : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      {/* X / Twitter */}
      <meta
        name="twitter:card"
        content={ogImage ? "summary_large_image" : "summary"}
      />
      {ogTitle ? <meta name="twitter:title" content={ogTitle} /> : null}
      {ogDescription ? (
        <meta name="twitter:description" content={ogDescription} />
      ) : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {/* Structured data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
