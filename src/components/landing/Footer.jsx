import { Link } from "react-router-dom";
import { Container } from "../ui/Section";
import { LogoMark } from "../ui/Logo";

/**
 * Closing block: brand column beside CMS link and social columns, divided by
 * the same hairline rules that structure the rest of the page.
 */
function isInternal(href) {
  return Boolean(href) && href.startsWith("/") && !href.startsWith("//");
}

function FooterLink({ href, children }) {
  const className = "nav-link text-sm text-white/55 hover:text-white";

  if (isInternal(href)) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  const external = /^https?:\/\//.test(href || "");
  return (
    <a
      href={href || "#"}
      className={className}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
    </a>
  );
}

export default function Footer({ footer, settings }) {
  if (!footer) return null;

  const links = Array.isArray(footer.links) ? footer.links : [];
  const socials = Array.isArray(footer.socialLinks) ? footer.socialLinks : [];
  const contact = settings?.contactInformation || {};

  // Split the link list into two balanced columns.
  const half = Math.ceil(links.length / 2);
  const columns = [links.slice(0, half), links.slice(half)].filter(
    (column) => column.length > 0,
  );

  return (
    <footer className="border-t border-white/[0.08] bg-[#050505]">
      <Container ruled className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-[-0.02em]">
                {settings?.siteName || "Creates.io"}
              </span>
            </div>

            {footer.description ? (
              <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/55">
                {footer.description}
              </p>
            ) : null}

            {(contact.email || contact.address) && (
              <address className="mt-8 space-y-1.5 text-sm text-white/45 not-italic">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="nav-link block hover:text-white"
                  >
                    {contact.email}
                  </a>
                ) : null}
                {contact.address ? <p>{contact.address}</p> : null}
              </address>
            )}
          </div>

          {/* Links */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8"
          >
            {columns.map((column, index) => (
              <div key={index} className="flex flex-col gap-4">
                <h2 className="eyebrow mb-1">
                  {index === 0 ? "Navigate" : "Account"}
                </h2>
                {column.map((link) => (
                  <FooterLink key={link.label} href={link.url}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            ))}

            {socials.length > 0 ? (
              <div className="flex flex-col gap-4">
                <h2 className="eyebrow mb-1">Social</h2>
                {socials.map((social) => (
                  <FooterLink key={social.platform} href={social.url}>
                    {social.platform}
                  </FooterLink>
                ))}
              </div>
            ) : null}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow">{footer.copyright}</p>
          <p className="eyebrow text-white/25">
            Shader — ThreeUI · halftone-flow
          </p>
        </div>
      </Container>
    </footer>
  );
}
