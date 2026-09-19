/**
 * Regenerates `src/cms/fallbackContent.js` from the backend seed defaults.
 *
 * The landing page is CMS-driven, but it should still render if the API is
 * unreachable. Rather than maintaining a second copy of the starter content by
 * hand, this script derives it from `backend/cms/defaults.js` so the two can
 * never drift.
 *
 *   npm run sync:fallback
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const defaultsPath = resolve(here, "../../backend/cms/defaults.js");
const outputPath = resolve(here, "../src/cms/fallbackContent.js");

const defaults = require(defaultsPath);

const content = {
  settings: defaults.siteSettings,
  hero: defaults.hero,
  footer: defaults.footer,
  seo: defaults.seo,
  navigation: defaults.navigation,
  sections: defaults.sections,
  features: defaults.features,
  collections: defaults.collections,
  testimonials: defaults.testimonials,
};

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Mirrors the backend CMS seed (\`backend/cms/defaults.js\`) so the landing page
 * still renders when the API is unreachable. Regenerate with:
 *
 *   npm run sync:fallback
 */
`;

writeFileSync(
  outputPath,
  `${banner}\nexport const FALLBACK_CONTENT = ${JSON.stringify(content, null, 2)};\n\nexport default FALLBACK_CONTENT;\n`,
  "utf8",
);

console.log(`Wrote ${outputPath}`);
