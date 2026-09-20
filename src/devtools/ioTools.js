/**
 * Configuration for every tool that is the plain INPUT → TRANSFORM → OUTPUT
 * shape.
 *
 * Keeping them as data means one page component renders all of them, so they
 * share identical layout, actions, error handling and keyboard behaviour by
 * construction rather than by discipline. A tool only needs a bespoke
 * component when it genuinely has a different interaction — a request builder,
 * a live preview, a diagram.
 *
 * Each entry provides `run(input, options)` returning the output string, and
 * optionally declares `options` rendered as segmented controls above the input.
 */

import {
  formatJson,
  jsonToPrisma,
  jsonToSql,
  jsonToTypeScript,
  jsonToZod,
  minifyJson,
  sortJsonKeys,
  parseJson,
} from "./transforms/json";
import {
  csvToJson,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
  xmlToJson,
  yamlToJson,
} from "./transforms/data";
import {
  curlToAxios,
  curlToFetch,
  formatCss,
  formatHtml,
  formatJavaScript,
  htmlToMarkdown,
  minifyCss,
} from "./transforms/web";
import { decodeBase64, encodeBase64, decodeUrlComponent, encodeUrlComponent, encodeUrlFull } from "./transforms/security";
import { CASE_STYLES, convertCase, slugify } from "./transforms/text";
import { formatSql, minifySql, sqlToPrisma, SQL_DIALECTS } from "./transforms/sql";
import { markdownToHtml } from "../utils/fileTools";

const INDENT_OPTIONS = {
  id: "indent",
  label: "Indent",
  default: "2",
  choices: [
    { id: "2", label: "2 spaces" },
    { id: "4", label: "4 spaces" },
    { id: "tab", label: "Tab" },
  ],
};

const indentValue = (choice) => (choice === "tab" ? "\t" : Number(choice));

export const IO_TOOLS = {
  /* --------------------------------- JSON --------------------------------- */
  "json-formatter": {
    inputLabel: "JSON",
    outputLabel: "Result",
    placeholder: '{\n  "name": "Ada",\n  "roles": ["engineer", "author"]\n}',
    filename: "formatted.json",
    mimeType: "application/json",
    liveByDefault: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        default: "format",
        choices: [
          { id: "format", label: "Format" },
          { id: "minify", label: "Minify" },
          { id: "sort", label: "Sort keys" },
        ],
      },
      INDENT_OPTIONS,
    ],
    run: (input, { mode, indent }) => {
      if (mode === "minify") return minifyJson(input);
      if (mode === "sort") {
        return JSON.stringify(sortJsonKeys(parseJson(input)), null, indentValue(indent));
      }
      return formatJson(input, indentValue(indent));
    },
    // A successful parse is itself the validation result.
    successNote: (output, input) => {
      const size = new TextEncoder().encode(input).length;
      return `Valid JSON — ${size.toLocaleString()} bytes in, ${new TextEncoder().encode(output).length.toLocaleString()} bytes out.`;
    },
  },

  "json-to-typescript": {
    inputLabel: "JSON",
    outputLabel: "TypeScript",
    placeholder: '{\n  "id": 1,\n  "name": "Ada",\n  "tags": ["a", "b"]\n}',
    filename: "types.ts",
    liveByDefault: true,
    options: [
      {
        id: "rootName",
        label: "Root name",
        type: "text",
        default: "Root",
        placeholder: "Root",
      },
    ],
    run: (input, { rootName }) => jsonToTypeScript(input, rootName || "Root"),
  },

  "json-to-zod": {
    inputLabel: "JSON",
    outputLabel: "Zod schema",
    placeholder: '{\n  "email": "a@b.com",\n  "age": 30\n}',
    filename: "schema.ts",
    liveByDefault: true,
    options: [{ id: "rootName", label: "Schema name", type: "text", default: "root", placeholder: "root" }],
    run: (input, { rootName }) => jsonToZod(input, rootName || "root"),
  },

  "json-to-prisma": {
    inputLabel: "JSON",
    outputLabel: "Prisma model",
    placeholder: '{\n  "id": 1,\n  "email": "a@b.com",\n  "active": true\n}',
    filename: "model.prisma",
    liveByDefault: true,
    options: [{ id: "modelName", label: "Model name", type: "text", default: "Model", placeholder: "User" }],
    run: (input, { modelName }) => jsonToPrisma(input, modelName || "Model"),
    note: "Nested objects become Json columns — inferring relations from one sample would be guesswork.",
  },

  "json-to-sql": {
    inputLabel: "JSON array",
    outputLabel: "SQL",
    placeholder: '[\n  { "id": 1, "name": "Ada" },\n  { "id": 2, "name": "Grace" }\n]',
    filename: "seed.sql",
    liveByDefault: true,
    options: [{ id: "tableName", label: "Table name", type: "text", default: "records", placeholder: "users" }],
    run: (input, { tableName }) => jsonToSql(input, tableName || "records"),
  },

  /* ------------------------------ Conversion ------------------------------ */
  "json-to-csv": {
    inputLabel: "JSON array",
    outputLabel: "CSV",
    placeholder: '[\n  { "name": "Ada", "role": "Engineer" }\n]',
    filename: "data.csv",
    mimeType: "text/csv",
    liveByDefault: true,
    options: [
      {
        id: "delimiter",
        label: "Delimiter",
        default: ",",
        choices: [
          { id: ",", label: "Comma" },
          { id: "\t", label: "Tab" },
          { id: ";", label: "Semicolon" },
        ],
      },
    ],
    run: (input, { delimiter }) => jsonToCsv(input, { delimiter }),
  },

  "csv-to-json": {
    inputLabel: "CSV",
    outputLabel: "JSON",
    placeholder: "name,role\nAda,Engineer\nGrace,Admiral",
    filename: "data.json",
    mimeType: "application/json",
    liveByDefault: true,
    options: [
      {
        id: "delimiter",
        label: "Delimiter",
        default: ",",
        choices: [
          { id: ",", label: "Comma" },
          { id: "\t", label: "Tab" },
          { id: ";", label: "Semicolon" },
        ],
      },
      {
        id: "inferTypes",
        label: "Values",
        default: "infer",
        choices: [
          { id: "infer", label: "Infer types" },
          { id: "strings", label: "All strings" },
        ],
      },
    ],
    run: (input, { delimiter, inferTypes }) =>
      csvToJson(input, { delimiter, inferTypes: inferTypes === "infer" }),
  },

  "json-to-yaml": {
    inputLabel: "JSON",
    outputLabel: "YAML",
    placeholder: '{\n  "service": "api",\n  "ports": [8080]\n}',
    filename: "config.yaml",
    liveByDefault: true,
    run: (input) => jsonToYaml(input),
  },

  "yaml-to-json": {
    inputLabel: "YAML",
    outputLabel: "JSON",
    placeholder: "service: api\nports:\n  - 8080",
    filename: "config.json",
    mimeType: "application/json",
    liveByDefault: true,
    run: (input) => yamlToJson(input),
  },

  "xml-to-json": {
    inputLabel: "XML",
    outputLabel: "JSON",
    placeholder: '<user id="1">\n  <name>Ada</name>\n</user>',
    filename: "data.json",
    mimeType: "application/json",
    liveByDefault: true,
    run: (input) => xmlToJson(input),
    note: "Attributes are kept as @name keys and mixed text as #text, so the conversion stays reversible.",
  },

  "json-to-xml": {
    inputLabel: "JSON",
    outputLabel: "XML",
    placeholder: '{\n  "user": { "name": "Ada" }\n}',
    filename: "data.xml",
    mimeType: "application/xml",
    liveByDefault: true,
    options: [{ id: "rootName", label: "Root element", type: "text", default: "root", placeholder: "root" }],
    run: (input, { rootName }) => jsonToXml(input, { rootName: rootName || "root" }),
  },

  "markdown-to-html": {
    inputLabel: "Markdown",
    outputLabel: "HTML",
    placeholder: "# Title\n\nSome **bold** text and a [link](https://example.com).",
    filename: "document.html",
    mimeType: "text/html",
    liveByDefault: true,
    options: [
      {
        id: "wrap",
        label: "Output",
        default: "fragment",
        choices: [
          { id: "fragment", label: "Fragment" },
          { id: "document", label: "Full document" },
        ],
      },
    ],
    run: (input, { wrap }) => {
      if (!input.trim()) throw new Error("There is nothing to convert.");
      const body = markdownToHtml(input);
      if (wrap !== "document") return body;
      return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Document</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
    },
  },

  "html-to-markdown": {
    inputLabel: "HTML",
    outputLabel: "Markdown",
    placeholder: "<h1>Title</h1>\n<p>Some <strong>bold</strong> text.</p>",
    filename: "document.md",
    mimeType: "text/markdown",
    liveByDefault: true,
    run: (input) => htmlToMarkdown(input),
  },

  /* ---------------------------------- API --------------------------------- */
  "curl-to-fetch": {
    inputLabel: "cURL command",
    outputLabel: "fetch()",
    placeholder: `curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Ada"}'`,
    filename: "request.js",
    liveByDefault: true,
    run: (input) => curlToFetch(input),
  },

  "curl-to-axios": {
    inputLabel: "cURL command",
    outputLabel: "axios",
    placeholder: `curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Ada"}'`,
    filename: "request.js",
    liveByDefault: true,
    run: (input) => curlToAxios(input),
  },

  /* -------------------------------- Security ------------------------------ */
  base64: {
    inputLabel: "Input",
    outputLabel: "Output",
    placeholder: "Text to encode, or base64 to decode",
    filename: "base64.txt",
    liveByDefault: true,
    options: [
      {
        id: "mode",
        label: "Direction",
        default: "encode",
        choices: [
          { id: "encode", label: "Encode" },
          { id: "decode", label: "Decode" },
        ],
      },
      {
        id: "variant",
        label: "Alphabet",
        default: "standard",
        choices: [
          { id: "standard", label: "Standard" },
          { id: "urlsafe", label: "URL-safe" },
        ],
      },
    ],
    run: (input, { mode, variant }) => {
      if (!input) return "";
      return mode === "decode"
        ? decodeBase64(input)
        : encodeBase64(input, { urlSafe: variant === "urlsafe" });
    },
  },

  "url-encoder": {
    inputLabel: "Input",
    outputLabel: "Output",
    placeholder: "https://example.com/search?q=hello world",
    filename: "url.txt",
    liveByDefault: true,
    options: [
      {
        id: "mode",
        label: "Direction",
        default: "encode",
        choices: [
          { id: "encode", label: "Encode" },
          { id: "decode", label: "Decode" },
        ],
      },
      {
        id: "scope",
        label: "Scope",
        default: "component",
        choices: [
          { id: "component", label: "Component", hint: "encodeURIComponent — escapes / ? & = too" },
          { id: "full", label: "Full URL", hint: "encodeURI — leaves URL structure intact" },
        ],
      },
    ],
    run: (input, { mode, scope }) => {
      if (!input) return "";
      if (mode === "decode") return decodeUrlComponent(input);
      return scope === "full" ? encodeUrlFull(input) : encodeUrlComponent(input);
    },
  },

  /* -------------------------------- Frontend ------------------------------ */
  "html-formatter": {
    inputLabel: "HTML",
    outputLabel: "Formatted",
    placeholder: "<div><p>Hello</p><span>world</span></div>",
    filename: "formatted.html",
    mimeType: "text/html",
    options: [INDENT_OPTIONS],
    run: (input, { indent }) =>
      formatHtml(input, { indent: indent === "tab" ? 1 : Number(indent) }),
    note: "An indentation pass, not a full parser — script, style and pre blocks are passed through untouched.",
  },

  "css-formatter": {
    inputLabel: "CSS",
    outputLabel: "Result",
    placeholder: ".card{color:red;padding:1rem}",
    filename: "styles.css",
    mimeType: "text/css",
    options: [
      {
        id: "mode",
        label: "Mode",
        default: "format",
        choices: [
          { id: "format", label: "Format" },
          { id: "minify", label: "Minify" },
        ],
      },
      INDENT_OPTIONS,
    ],
    run: (input, { mode, indent }) => {
      if (!input.trim()) throw new Error("There is nothing to format.");
      return mode === "minify"
        ? minifyCss(input)
        : formatCss(input, { indent: indent === "tab" ? 1 : Number(indent) });
    },
  },

  "js-formatter": {
    inputLabel: "JavaScript",
    outputLabel: "Formatted",
    placeholder: "function add(a,b){return a+b}",
    filename: "formatted.js",
    options: [INDENT_OPTIONS],
    run: (input, { indent }) =>
      formatJavaScript(input, { indent: indent === "tab" ? 1 : Number(indent) }),
    note: "Re-indents by brace depth, leaving strings, template literals and comments untouched. It is not a full AST reprinter like Prettier.",
  },

  /* -------------------------------- Database ------------------------------ */
  "sql-formatter": {
    inputLabel: "SQL",
    outputLabel: "Result",
    placeholder: "select u.id, u.name from users u join orders o on o.user_id = u.id where u.active = true;",
    filename: "query.sql",
    mimeType: "application/sql",
    options: [
      {
        id: "mode",
        label: "Mode",
        default: "format",
        choices: [
          { id: "format", label: "Format" },
          { id: "minify", label: "Minify" },
        ],
      },
      {
        id: "dialect",
        label: "Dialect",
        default: "sql",
        choices: SQL_DIALECTS.map((dialect) => ({ id: dialect.id, label: dialect.label })),
      },
      {
        id: "keywords",
        label: "Keywords",
        default: "upper",
        choices: [
          { id: "upper", label: "UPPERCASE" },
          { id: "preserve", label: "Preserve" },
        ],
      },
    ],
    run: (input, { mode, dialect, keywords }) =>
      mode === "minify"
        ? minifySql(input)
        : formatSql(input, { dialect, uppercase: keywords === "upper" }),
  },

  "sql-to-prisma": {
    inputLabel: "CREATE TABLE statements",
    outputLabel: "Prisma schema",
    placeholder:
      "CREATE TABLE users (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  email VARCHAR(255) NOT NULL UNIQUE\n);\n\nCREATE TABLE posts (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  user_id INT NOT NULL,\n  FOREIGN KEY (user_id) REFERENCES users(id)\n);",
    filename: "schema.prisma",
    run: (input) => sqlToPrisma(input),
    note: "Reads CREATE TABLE definitions across MySQL, Postgres and SQLite syntax. Review the generated types and relations before using them.",
  },

  /* ------------------------------- Utilities ------------------------------ */
  "case-converter": {
    inputLabel: "Text",
    outputLabel: "Converted",
    placeholder: "hello world example",
    filename: "converted.txt",
    liveByDefault: true,
    options: [
      {
        id: "style",
        label: "Style",
        default: "camel",
        choices: CASE_STYLES.map((style) => ({ id: style.id, label: style.label })),
      },
    ],
    run: (input, { style }) => convertCase(input, style),
    note: "Each line converts on its own, so a pasted list keeps its structure.",
  },

  "slug-generator": {
    inputLabel: "Text",
    outputLabel: "Slug",
    placeholder: "Héllo World — This is a Post Title!",
    filename: "slugs.txt",
    liveByDefault: true,
    options: [
      {
        id: "separator",
        label: "Separator",
        default: "-",
        choices: [
          { id: "-", label: "Hyphen" },
          { id: "_", label: "Underscore" },
        ],
      },
      {
        id: "casing",
        label: "Case",
        default: "lower",
        choices: [
          { id: "lower", label: "lowercase" },
          { id: "preserve", label: "Preserve" },
        ],
      },
    ],
    run: (input, { separator, casing }) =>
      input
        .split(/\r?\n/)
        .map((line) =>
          line.trim() ? slugify(line, { separator, lowercase: casing === "lower" }) : "",
        )
        .join("\n"),
  },
};

export const getIoTool = (id) => IO_TOOLS[id];
