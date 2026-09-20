/**
 * The developer tools catalogue.
 *
 * Metadata only — no transform code and no components are imported here, so
 * the hub, the search box and the favourites list stay cheap while each tool's
 * implementation loads on demand.
 *
 * This follows the pattern the app already uses for its other tool surfaces
 * (`PAGES` in `constant.js`, the feature arrays behind the Content, Image and
 * Toolkit hubs): one array of plain objects, rendered by the existing `Card`.
 *
 * `kind: "io"` means the tool is the standard INPUT → TRANSFORM → OUTPUT shape
 * and is driven by a config in `ioTools.js`. Anything else names its own
 * component file under `src/page/devtools/`.
 */

export const CATEGORIES = [
  { id: "json", label: "JSON", description: "Format, validate, diff and convert JSON." },
  { id: "api", label: "API", description: "Send requests and translate them between clients." },
  { id: "security", label: "Security", description: "Tokens, hashing, encoding and secrets — all local." },
  { id: "database", label: "Database", description: "SQL formatting, schema conversion and diagrams." },
  { id: "frontend", label: "Frontend", description: "CSS generators, colour maths and formatters." },
  { id: "testing", label: "Testing", description: "Regex, schemas, cron and diffing." },
  { id: "utilities", label: "Utilities", description: "Time, text, URLs and everyday lookups." },
  { id: "conversion", label: "Conversion", description: "Move data between formats." },
];

export const DEV_TOOLS = [
  /* --------------------------------- JSON --------------------------------- */
  {
    id: "json-formatter",
    category: "json",
    title: "JSON Formatter",
    description: "Format, minify and validate JSON with the error line and column called out.",
    keywords: ["json", "format", "beautify", "pretty", "validate", "validator", "minify", "lint"],
    kind: "io",
  },
  {
    id: "json-diff",
    category: "json",
    title: "JSON Diff",
    description: "Compare two documents by key path, so reordering and reformatting are not changes.",
    keywords: ["json", "diff", "compare", "difference", "changes"],
    component: "JsonDiff",
  },
  {
    id: "jsonpath-tester",
    category: "json",
    title: "JSONPath Tester",
    description: "Run a JSONPath expression and see every match with its path.",
    keywords: ["json", "jsonpath", "query", "path", "selector"],
    component: "JsonPathTester",
  },
  {
    id: "json-to-typescript",
    category: "json",
    title: "JSON → TypeScript",
    description: "Infer TypeScript interfaces, merging array elements into one shape.",
    keywords: ["json", "typescript", "ts", "types", "interface", "convert"],
    kind: "io",
  },
  {
    id: "json-to-zod",
    category: "json",
    title: "JSON → Zod",
    description: "Generate a Zod schema and its inferred type from a sample document.",
    keywords: ["json", "zod", "schema", "validation", "convert"],
    kind: "io",
  },
  {
    id: "json-schema-validator",
    category: "testing",
    title: "JSON Schema Validator",
    description: "Validate a document against a JSON Schema and see exactly which rule failed.",
    keywords: ["json", "schema", "validate", "draft-07", "ajv"],
    component: "JsonSchemaValidator",
  },

  /* ---------------------------------- API --------------------------------- */
  {
    id: "api-client",
    category: "api",
    title: "REST API Client",
    description: "Send any method with headers, params, auth and a body; inspect status, timing and response.",
    keywords: ["api", "rest", "http", "client", "request", "postman", "fetch", "get", "post"],
    component: "ApiClient",
  },
  {
    id: "headers-inspector",
    category: "api",
    title: "HTTP Headers Inspector",
    description: "Paste a raw header block and get each header explained.",
    keywords: ["http", "headers", "inspect", "cache-control", "cors", "security"],
    component: "HeadersInspector",
  },
  {
    id: "curl-to-fetch",
    category: "api",
    title: "cURL → Fetch",
    description: "Turn a copied cURL command into a fetch() call.",
    keywords: ["curl", "fetch", "convert", "http", "request", "javascript"],
    kind: "io",
  },
  {
    id: "curl-to-axios",
    category: "api",
    title: "cURL → Axios",
    description: "Turn a copied cURL command into an axios request config.",
    keywords: ["curl", "axios", "convert", "http", "request", "javascript"],
    kind: "io",
  },

  /* -------------------------------- Security ------------------------------- */
  {
    id: "jwt-inspector",
    category: "security",
    title: "JWT Decoder & Inspector",
    description: "Decode a token locally and read its header, claims and expiry.",
    keywords: ["jwt", "token", "decode", "inspect", "claims", "auth", "bearer"],
    component: "JwtInspector",
  },
  {
    id: "base64",
    category: "security",
    title: "Base64 Encoder / Decoder",
    description: "UTF-8 safe base64, with URL-safe output when you need it.",
    keywords: ["base64", "encode", "decode", "btoa", "atob", "url-safe"],
    kind: "io",
  },
  {
    id: "url-encoder",
    category: "security",
    title: "URL Encoder / Decoder",
    description: "Percent-encode or decode a string or a whole URL.",
    keywords: ["url", "encode", "decode", "percent", "uri", "escape"],
    kind: "io",
  },
  {
    id: "hash-generator",
    category: "security",
    title: "Hash Generator",
    description: "MD5, SHA-1, SHA-256, SHA-384 and SHA-512 over text.",
    keywords: ["hash", "md5", "sha", "sha256", "checksum", "digest"],
    component: "HashGenerator",
  },
  {
    id: "uuid-generator",
    category: "security",
    title: "UUID Generator",
    description: "Random v4 UUIDs from the platform's cryptographic RNG.",
    keywords: ["uuid", "guid", "id", "random", "v4"],
    component: "UuidGenerator",
  },
  {
    id: "password-generator",
    category: "security",
    title: "Password Generator",
    description: "Strong passwords with an entropy readout, generated locally.",
    keywords: ["password", "generate", "random", "secure", "entropy", "passphrase"],
    component: "PasswordGenerator",
  },
  {
    id: "env-validator",
    category: "security",
    title: ".env Validator",
    description: "Catch duplicate keys, bad names, quoting errors and leftover placeholders.",
    keywords: ["env", "dotenv", "environment", "validate", "config", "secrets"],
    component: "EnvValidator",
  },

  /* -------------------------------- Database ------------------------------- */
  {
    id: "prisma-workspace",
    category: "database",
    title: "Prisma Schema Visualizer",
    description:
      "Turn a Prisma schema into an interactive ER diagram, PlantUML, or a PNG, SVG or PDF you can share.",
    keywords: [
      "prisma", "schema", "diagram", "er", "erd", "entity", "relationship",
      "plantuml", "uml", "visualize", "visualiser", "database", "models",
      "export", "png", "svg", "pdf",
    ],
    component: "PrismaWorkspace",
  },
  {
    id: "sql-formatter",
    category: "database",
    title: "SQL Formatter",
    description: "Beautify or minify SQL across eight dialects.",
    keywords: ["sql", "format", "beautify", "pretty", "minify", "postgres", "mysql"],
    kind: "io",
  },
  {
    id: "sql-validator",
    category: "database",
    title: "SQL Validator",
    description: "Structural checks for unbalanced brackets, missing clauses and risky statements.",
    keywords: ["sql", "validate", "lint", "check", "syntax"],
    component: "SqlValidator",
  },
  {
    id: "sql-to-prisma",
    category: "database",
    title: "SQL → Prisma Schema",
    description: "Turn CREATE TABLE statements into Prisma models with relations.",
    keywords: ["sql", "prisma", "schema", "orm", "convert", "migration"],
    kind: "io",
  },
  {
    id: "prisma-viewer",
    category: "database",
    title: "Prisma Schema Viewer",
    description: "Read a schema.prisma as models, fields, enums and relations.",
    keywords: ["prisma", "schema", "viewer", "models", "orm"],
    component: "PrismaViewer",
  },
  {
    id: "erd-generator",
    category: "database",
    title: "ER Diagram Generator",
    description: "Draw an entity-relationship diagram from SQL or a Prisma schema.",
    keywords: ["erd", "er", "diagram", "entity", "relationship", "schema", "database"],
    component: "ErdGenerator",
  },
  {
    id: "json-to-sql",
    category: "database",
    title: "JSON → SQL",
    description: "Infer a CREATE TABLE and INSERT statements from a JSON array.",
    keywords: ["json", "sql", "convert", "insert", "create table", "seed"],
    kind: "io",
  },
  {
    id: "json-to-prisma",
    category: "database",
    title: "JSON → Prisma",
    description: "Infer a Prisma model from a sample JSON object.",
    keywords: ["json", "prisma", "model", "schema", "convert"],
    kind: "io",
  },

  /* -------------------------------- Frontend ------------------------------- */
  {
    id: "color-converter",
    category: "frontend",
    title: "Color Converter",
    description: "HEX, RGB and HSL in every direction, with a WCAG contrast check.",
    keywords: ["color", "colour", "hex", "rgb", "hsl", "convert", "contrast", "wcag"],
    component: "ColorConverter",
  },
  {
    id: "gradient-generator",
    category: "frontend",
    title: "Gradient Generator",
    description: "Build linear, radial and conic gradients with a live preview.",
    keywords: ["gradient", "css", "linear", "radial", "conic", "background", "generator"],
    component: "GradientGenerator",
  },
  {
    id: "box-shadow-generator",
    category: "frontend",
    title: "Box Shadow Generator",
    description: "Stack multiple shadows and copy the CSS.",
    keywords: ["shadow", "box-shadow", "css", "generator", "elevation"],
    component: "BoxShadowGenerator",
  },
  {
    id: "border-radius-generator",
    category: "frontend",
    title: "Border Radius Generator",
    description: "Per-corner and elliptical radii with a live preview.",
    keywords: ["border", "radius", "rounded", "css", "generator", "squircle"],
    component: "BorderRadiusGenerator",
  },
  {
    id: "css-clamp-generator",
    category: "frontend",
    title: "CSS Clamp Generator",
    description: "Fluid typography and spacing with clamp(), from two breakpoints.",
    keywords: ["clamp", "css", "fluid", "responsive", "typography", "vw", "calc"],
    component: "ClampGenerator",
  },
  {
    id: "html-formatter",
    category: "frontend",
    title: "HTML Formatter",
    description: "Re-indent HTML, leaving script, style and pre blocks untouched.",
    keywords: ["html", "format", "beautify", "indent", "pretty"],
    kind: "io",
  },
  {
    id: "css-formatter",
    category: "frontend",
    title: "CSS Formatter",
    description: "Re-indent or minify CSS, preserving comments.",
    keywords: ["css", "format", "beautify", "minify", "indent", "pretty"],
    kind: "io",
  },
  {
    id: "js-formatter",
    category: "frontend",
    title: "JavaScript Formatter",
    description: "Re-indent JavaScript by brace depth, leaving strings and comments alone.",
    keywords: ["javascript", "js", "format", "beautify", "indent", "pretty"],
    kind: "io",
  },
  {
    id: "markdown-preview",
    category: "frontend",
    title: "Markdown Preview",
    description: "Write Markdown and see it rendered as you type.",
    keywords: ["markdown", "md", "preview", "render", "readme"],
    component: "MarkdownPreview",
  },

  /* -------------------------------- Testing -------------------------------- */
  {
    id: "regex-tester",
    category: "testing",
    title: "Regex Tester",
    description: "Live matching with highlighting, capture groups and a match count.",
    keywords: ["regex", "regexp", "pattern", "match", "test", "expression"],
    component: "RegexTester",
  },
  {
    id: "cron-tester",
    category: "testing",
    title: "Cron Expression Tester",
    description: "Explain a cron expression in English and list its next runs.",
    keywords: ["cron", "crontab", "schedule", "expression", "next run"],
    component: "CronTester",
  },
  {
    id: "diff-checker",
    category: "testing",
    title: "Diff Checker",
    description: "Line-by-line diff for text or code, side by side or unified.",
    keywords: ["diff", "compare", "text", "code", "changes", "merge"],
    component: "DiffChecker",
  },
  {
    id: "http-status-lookup",
    category: "testing",
    title: "HTTP Status Lookup",
    description: "Every status code with what it actually means in practice.",
    keywords: ["http", "status", "code", "404", "500", "lookup", "reference"],
    component: "HttpStatusLookup",
  },
  {
    id: "user-agent-parser",
    category: "testing",
    title: "User-Agent Parser",
    description: "Identify browser, engine, OS and device from a UA string.",
    keywords: ["user agent", "ua", "browser", "parse", "device", "os"],
    component: "UserAgentParser",
  },

  /* ------------------------------- Utilities ------------------------------- */
  {
    id: "timestamp-converter",
    category: "utilities",
    title: "Timestamp Converter",
    description: "Unix epoch to date and back, in seconds or milliseconds.",
    keywords: ["timestamp", "unix", "epoch", "date", "time", "convert", "seconds"],
    component: "TimestampConverter",
  },
  {
    id: "timezone-converter",
    category: "utilities",
    title: "Timezone Converter",
    description: "See one moment across several timezones at once.",
    keywords: ["timezone", "tz", "utc", "convert", "time", "date", "offset"],
    component: "TimezoneConverter",
  },
  {
    id: "text-counter",
    category: "utilities",
    title: "Text Counter",
    description: "Characters, words, lines, sentences, bytes and reading time.",
    keywords: ["count", "counter", "words", "characters", "lines", "length", "bytes"],
    component: "TextCounter",
  },
  {
    id: "case-converter",
    category: "utilities",
    title: "Case Converter",
    description: "camelCase, snake_case, kebab-case, CONSTANT_CASE and six more.",
    keywords: ["case", "camel", "snake", "kebab", "pascal", "convert", "naming"],
    kind: "io",
  },
  {
    id: "slug-generator",
    category: "utilities",
    title: "Slug Generator",
    description: "URL-safe slugs with accents folded and length capped.",
    keywords: ["slug", "url", "permalink", "seo", "kebab"],
    kind: "io",
  },
  {
    id: "lorem-generator",
    category: "utilities",
    title: "Lorem Ipsum Generator",
    description: "Placeholder paragraphs, sentences or words.",
    keywords: ["lorem", "ipsum", "placeholder", "dummy", "filler", "text"],
    component: "LoremGenerator",
  },
  {
    id: "random-data-generator",
    category: "utilities",
    title: "Random Data Generator",
    description: "Fake rows of names, emails, dates and more as JSON or CSV.",
    keywords: ["random", "fake", "mock", "seed", "data", "fixture", "faker"],
    component: "RandomDataGenerator",
  },
  {
    id: "url-parser",
    category: "utilities",
    title: "URL Parser",
    description: "Break a URL into protocol, host, path, query and hash.",
    keywords: ["url", "parse", "query", "host", "path", "uri"],
    component: "UrlParser",
  },
  {
    id: "query-string-parser",
    category: "utilities",
    title: "Query String Parser",
    description: "Expand a query string into editable pairs, and build one back.",
    keywords: ["query", "string", "params", "url", "parse", "querystring"],
    component: "QueryStringParser",
  },
  {
    id: "mime-lookup",
    category: "utilities",
    title: "MIME Type Lookup",
    description: "Find a MIME type from an extension, or the other way round.",
    keywords: ["mime", "content-type", "extension", "media type", "lookup"],
    component: "MimeLookup",
  },
  {
    id: "git-commands",
    category: "utilities",
    title: "Git Command Generator",
    description: "The git incantations worth looking up, filled in for you.",
    keywords: ["git", "command", "undo", "rebase", "stash", "branch", "cheatsheet"],
    component: "GitCommands",
  },
  {
    id: "chmod-calculator",
    category: "utilities",
    title: "Chmod Calculator",
    description: "Octal and symbolic permissions, in both directions.",
    keywords: ["chmod", "permissions", "octal", "unix", "file", "755", "644"],
    component: "ChmodCalculator",
  },

  /* ------------------------------- Conversion ------------------------------ */
  {
    id: "json-to-csv",
    category: "conversion",
    title: "JSON → CSV",
    description: "Flatten an array of objects into CSV with a header row.",
    keywords: ["json", "csv", "convert", "export", "spreadsheet"],
    kind: "io",
  },
  {
    id: "csv-to-json",
    category: "conversion",
    title: "CSV → JSON",
    description: "Parse CSV into objects, recovering numbers and booleans.",
    keywords: ["csv", "json", "convert", "import", "parse"],
    kind: "io",
  },
  {
    id: "json-to-yaml",
    category: "conversion",
    title: "JSON → YAML",
    description: "Convert JSON to YAML for configs and manifests.",
    keywords: ["json", "yaml", "yml", "convert", "config"],
    kind: "io",
  },
  {
    id: "yaml-to-json",
    category: "conversion",
    title: "YAML → JSON",
    description: "Convert YAML to JSON, with the failing line called out.",
    keywords: ["yaml", "yml", "json", "convert", "parse"],
    kind: "io",
  },
  {
    id: "xml-to-json",
    category: "conversion",
    title: "XML → JSON",
    description: "Parse XML into JSON, keeping attributes and repeated tags.",
    keywords: ["xml", "json", "convert", "parse", "soap", "rss"],
    kind: "io",
  },
  {
    id: "json-to-xml",
    category: "conversion",
    title: "JSON → XML",
    description: "Serialise JSON as XML with a root element you choose.",
    keywords: ["json", "xml", "convert", "serialise", "soap"],
    kind: "io",
  },
  {
    id: "markdown-to-html",
    category: "conversion",
    title: "Markdown → HTML",
    description: "Convert Markdown to a standalone HTML document.",
    keywords: ["markdown", "md", "html", "convert", "render"],
    kind: "io",
  },
  {
    id: "html-to-markdown",
    category: "conversion",
    title: "HTML → Markdown",
    description: "Convert HTML back to Markdown, including tables and lists.",
    keywords: ["html", "markdown", "md", "convert", "reverse"],
    kind: "io",
  },
];

/** Tools grouped by category id, in catalogue order. */
export const toolsByCategory = () =>
  CATEGORIES.map((category) => ({
    ...category,
    tools: DEV_TOOLS.filter((tool) => tool.category === category.id),
  })).filter((category) => category.tools.length > 0);

export const findTool = (id) => DEV_TOOLS.find((tool) => tool.id === id);

/**
 * Ranked search over titles, descriptions and keywords.
 *
 * A title match outranks a keyword match, which outranks a description match,
 * so typing "json" puts the JSON tools above the ones that merely mention it.
 */
export function searchTools(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return DEV_TOOLS;

  return DEV_TOOLS.map((tool) => {
    const title = tool.title.toLowerCase();
    const description = tool.description.toLowerCase();
    const keywords = tool.keywords.join(" ").toLowerCase();
    const category = tool.category.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (title.startsWith(term)) score += 100;
      else if (title.includes(term)) score += 60;
      if (keywords.split(/\s+/).includes(term)) score += 40;
      else if (keywords.includes(term)) score += 20;
      if (category.includes(term)) score += 15;
      if (description.includes(term)) score += 8;
      // Every term has to land somewhere, so unrelated tools drop out.
      if (!title.includes(term) && !keywords.includes(term) && !description.includes(term) && !category.includes(term)) {
        return { tool, score: -1 };
      }
    }
    return { tool, score };
  })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.tool);
}
