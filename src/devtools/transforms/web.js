/**
 * Front-end transforms: colour maths, CSS/HTML/JS tidying, Markdown and cURL.
 *
 * The formatters here are indentation-and-spacing passes over a tokenised
 * stream, not AST reprinters. They reliably make minified or badly-indented
 * code readable, which is what a paste-in formatter is for; they are not
 * Prettier and do not claim to be. Adding Prettier's browser build would be a
 * megabyte of dependency for the gap between the two.
 */

/* --------------------------------- Colour --------------------------------- */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Named colours people actually type. Anything else is parsed numerically. */
const NAMED = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000",
  blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", magenta: "#ff00ff",
  gray: "#808080", grey: "#808080", orange: "#ffa500", purple: "#800080",
  transparent: "#00000000",
};

/** Parses hex, rgb(), hsl() or a named colour into `{r,g,b,a}` (0–255, a 0–1). */
export function parseColor(input) {
  const text = String(input).trim().toLowerCase();
  if (!text) throw new Error("Enter a colour.");

  const named = NAMED[text];
  const source = named || text;

  const hex = /^#?([0-9a-f]{3,8})$/.exec(source);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits].map((character) => character + character).join("");
    }
    if (digits.length !== 6 && digits.length !== 8) {
      throw new Error("A hex colour has 3, 4, 6 or 8 digits.");
    }
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1,
    };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(source);
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean);
    const channel = (value) =>
      value.endsWith("%") ? Math.round((parseFloat(value) / 100) * 255) : parseFloat(value);
    return {
      r: clamp(channel(parts[0]), 0, 255),
      g: clamp(channel(parts[1]), 0, 255),
      b: clamp(channel(parts[2]), 0, 255),
      a: parts[3] === undefined ? 1 : clamp(parseFloat(parts[3]) > 1 && parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]), 0, 1),
    };
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(source);
  if (hsl) {
    const parts = hsl[1].split(/[,/\s]+/).filter(Boolean);
    return hslToRgb(
      parseFloat(parts[0]),
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parts[3] === undefined ? 1 : parseFloat(parts[3]),
    );
  }

  throw new Error(`"${input}" is not a colour this converter recognises.`);
}

export function rgbToHsl({ r, g, b, a = 1 }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) hue = ((bn - rn) / delta + 2) * 60;
    else hue = ((rn - gn) / delta + 4) * 60;
  }

  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
    a,
  };
}

export function hslToRgb(h, s, l, a = 1) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;
  const [r1, g1, b1] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] : [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a: clamp(a, 0, 1),
  };
}

const hex2 = (value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");

export function formatColor({ r, g, b, a = 1 }) {
  const hsl = rgbToHsl({ r, g, b, a });
  const hasAlpha = a < 1;
  return {
    hex: `#${hex2(r)}${hex2(g)}${hex2(b)}${hasAlpha ? hex2(a * 255) : ""}`,
    hexShort: `#${hex2(r)}${hex2(g)}${hex2(b)}`,
    rgb: hasAlpha
      ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`
      : `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    hsl: hasAlpha
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${Number(a.toFixed(3))})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    channels: { r: Math.round(r), g: Math.round(g), b: Math.round(b), a },
    hslChannels: hsl,
  };
}

/** WCAG relative luminance, used for the contrast readout. */
export function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours, 1–21. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

/* -------------------------------- Formatters ------------------------------- */

/**
 * Stand-in for a CSS comment while the rest of the source is collapsed.
 *
 * A printable, base64-safe token rather than a NUL byte: control characters in
 * a regular expression are a lint error, and this survives the whitespace
 * collapse just as well.
 */
const COMMENT_MARKER = "␄CSSCOMMENT␄";

/** Re-indents CSS. Handles nesting, media queries and preserves comments. */
export function formatCss(source, { indent = 2 } = {}) {
  if (!source.trim()) throw new Error("There is nothing to format.");

  const compact = source
    .replace(
      /\/\*[\s\S]*?\*\//g,
      (comment) => COMMENT_MARKER + btoa(unescape(encodeURIComponent(comment))) + COMMENT_MARKER,
    )
    .replace(/\s+/g, " ")
    .trim();

  let depth = 0;
  let output = "";
  const pad = () => " ".repeat(depth * indent);

  for (let i = 0; i < compact.length; i += 1) {
    const character = compact[i];
    if (character === "{") {
      output = `${output.trimEnd()} {\n`;
      depth += 1;
      output += pad();
    } else if (character === "}") {
      depth = Math.max(0, depth - 1);
      output = `${output.trimEnd()}\n${pad()}}\n${pad()}`;
    } else if (character === ";") {
      output = `${output.trimEnd()};\n${pad()}`;
    } else if (character === ":" && depth > 0) {
      output += ": ";
      // Skip the space the source may already have had.
      if (compact[i + 1] === " ") i += 1;
    } else {
      output += character;
    }
  }

  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.trim() !== "" || lines[index - 1]?.trim() !== "")
    .join("\n")
    .replace(new RegExp(COMMENT_MARKER + "([A-Za-z0-9+/=]+)" + COMMENT_MARKER, "g"), (unused, encoded) =>
      decodeURIComponent(escape(atob(encoded))),
    )
    .trim();
}

export const minifyCss = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
const INLINE_ELEMENTS = new Set([
  "a", "abbr", "b", "code", "em", "i", "small", "span", "strong", "sub", "sup",
]);

/** Re-indents HTML, leaving the contents of script/style/pre alone. */
export function formatHtml(source, { indent = 2 } = {}) {
  if (!source.trim()) throw new Error("There is nothing to format.");

  // Tokenise into tags and text, keeping verbatim blocks whole.
  const tokens = source.match(
    /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g,
  );
  if (!tokens) return source.trim();

  let depth = 0;
  const lines = [];
  const pad = () => " ".repeat(depth * indent);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const isClosing = /^<\//.test(trimmed);
    const isTag = /^</.test(trimmed);
    const name = isTag ? (/^<\/?\s*([A-Za-z0-9-]+)/.exec(trimmed)?.[1] || "").toLowerCase() : "";
    const selfClosing =
      isTag && (/\/>$/.test(trimmed) || VOID_ELEMENTS.has(name) || /^<[!?]/.test(trimmed));

    if (isClosing) depth = Math.max(0, depth - 1);

    if (isTag) {
      lines.push(pad() + trimmed);
    } else {
      // Collapse run-on whitespace in text nodes but keep the words.
      lines.push(pad() + trimmed.replace(/\s+/g, " "));
    }

    if (isTag && !isClosing && !selfClosing && !INLINE_ELEMENTS.has(name) && !/<\/[A-Za-z0-9-]+>$/.test(trimmed)) {
      depth += 1;
    }
  }

  return lines.join("\n");
}

/**
 * Re-indents JavaScript by brace and bracket depth.
 *
 * Strings, template literals, regex literals and comments are carried through
 * untouched, so braces inside them do not shift the indentation.
 */
export function formatJavaScript(source, { indent = 2 } = {}) {
  if (!source.trim()) throw new Error("There is nothing to format.");

  const out = [];
  let depth = 0;
  let line = "";
  let i = 0;

  const pad = () => " ".repeat(Math.max(0, depth) * indent);
  const pushLine = () => {
    if (line.trim()) out.push(pad() + line.trim());
    line = "";
  };

  while (i < source.length) {
    const character = source[i];
    const rest = source.slice(i);

    // Verbatim regions.
    const verbatim = /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/.exec(rest);
    if (verbatim) {
      if (verbatim[0].startsWith("//") || verbatim[0].startsWith("/*")) {
        pushLine();
        out.push(pad() + verbatim[0].trim());
      } else {
        line += verbatim[0];
      }
      i += verbatim[0].length;
      continue;
    }

    if (character === "{" || character === "[" || character === "(") {
      line += character;
      if (character === "{") {
        pushLine();
        depth += 1;
      }
      i += 1;
      continue;
    }

    if (character === "}" || character === "]" || character === ")") {
      if (character === "}") {
        pushLine();
        depth -= 1;
        line = character;
        // Keep `} else {`, `},` and `});` on one line with what follows.
        const follow = /^\}\s*(else\b|catch\b|finally\b|while\b|[,;)\]])/.exec(source.slice(i));
        if (!follow) {
          pushLine();
          i += 1;
          continue;
        }
        i += 1;
        continue;
      }
      line += character;
      i += 1;
      continue;
    }

    if (character === ";") {
      line += ";";
      pushLine();
      i += 1;
      continue;
    }

    if (character === "\n") {
      pushLine();
      i += 1;
      continue;
    }

    if (/\s/.test(character)) {
      if (line && !/\s$/.test(line)) line += " ";
      i += 1;
      continue;
    }

    line += character;
    i += 1;
  }
  pushLine();

  return out.join("\n");
}

/* -------------------------------- Markdown -------------------------------- */

/** HTML → Markdown for the common block and inline constructs. */
export function htmlToMarkdown(html) {
  if (!html.trim()) throw new Error("There is nothing to convert.");
  const document_ = new DOMParser().parseFromString(html, "text/html");

  const walk = (node, listDepth = 0) => {
    if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, " ");
    if (node.nodeType !== 1) return "";

    const children = (depth = listDepth) =>
      [...node.childNodes].map((child) => walk(child, depth)).join("");

    switch (node.tagName.toLowerCase()) {
      case "h1": return `\n# ${children().trim()}\n\n`;
      case "h2": return `\n## ${children().trim()}\n\n`;
      case "h3": return `\n### ${children().trim()}\n\n`;
      case "h4": return `\n#### ${children().trim()}\n\n`;
      case "h5": return `\n##### ${children().trim()}\n\n`;
      case "h6": return `\n###### ${children().trim()}\n\n`;
      case "p": return `\n${children().trim()}\n\n`;
      case "br": return "  \n";
      case "hr": return "\n---\n\n";
      case "strong": case "b": return `**${children().trim()}**`;
      case "em": case "i": return `*${children().trim()}*`;
      case "del": case "s": return `~~${children().trim()}~~`;
      case "code":
        return node.closest("pre") ? children() : `\`${children().trim()}\``;
      case "pre": {
        const code = node.textContent.replace(/\n$/, "");
        return `\n\`\`\`\n${code}\n\`\`\`\n\n`;
      }
      case "blockquote":
        return `\n${children().trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
      case "a": {
        const href = node.getAttribute("href") || "";
        return `[${children().trim()}](${href})`;
      }
      case "img": {
        const alt = node.getAttribute("alt") || "";
        return `![${alt}](${node.getAttribute("src") || ""})`;
      }
      case "ul": case "ol": {
        const ordered = node.tagName.toLowerCase() === "ol";
        const items = [...node.children]
          .filter((child) => child.tagName.toLowerCase() === "li")
          .map((child, index) => {
            const marker = ordered ? `${index + 1}. ` : "- ";
            const body = walk(child, listDepth + 1).trim();
            const pad = "  ".repeat(listDepth);
            return `${pad}${marker}${body}`;
          });
        return `\n${items.join("\n")}\n\n`;
      }
      case "li": return children();
      case "table": {
        const rows = [...node.querySelectorAll("tr")];
        if (rows.length === 0) return "";
        const toCells = (row) =>
          [...row.children].map((cell) => walk(cell).trim().replace(/\|/g, "\\|"));
        const header = toCells(rows[0]);
        const body = rows.slice(1).map(toCells);
        return `\n| ${header.join(" | ")} |\n| ${header.map(() => "---").join(" | ")} |\n${body
          .map((cells) => `| ${cells.join(" | ")} |`)
          .join("\n")}\n\n`;
      }
      default: return children();
    }
  };

  return walk(document_.body)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ----------------------------------- cURL --------------------------------- */

/**
 * Parses a cURL command into its parts.
 *
 * Handles quoting, line continuations and the flags that appear in the copied
 * commands people actually paste: -X, -H, -d/--data*, -u, -F, --compressed,
 * -k, -L and a bare URL.
 */
export function parseCurl(command) {
  const text = command.trim().replace(/\\\r?\n/g, " ");
  if (!/^\s*curl\b/.test(text)) {
    throw new Error("This does not start with `curl`.");
  }

  // Tokenise respecting single and double quotes.
  const tokens = text.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\S+/g) || [];
  const unquote = (value) =>
    /^["']/.test(value) ? value.slice(1, -1).replace(/\\(["'])/g, "$1") : value;

  const result = {
    method: null,
    url: "",
    headers: {},
    body: null,
    auth: null,
    insecure: false,
    followRedirects: false,
  };

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = () => unquote(tokens[++i] ?? "");

    if (token === "-X" || token === "--request") {
      result.method = next().toUpperCase();
    } else if (token === "-H" || token === "--header") {
      const header = next();
      const separator = header.indexOf(":");
      if (separator > 0) {
        result.headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
      }
    } else if (/^(-d|--data|--data-raw|--data-binary|--data-ascii)$/.test(token)) {
      result.body = next();
    } else if (token === "--data-urlencode") {
      result.body = next();
    } else if (token === "-F" || token === "--form") {
      result.form = result.form || [];
      result.form.push(next());
    } else if (token === "-u" || token === "--user") {
      result.auth = next();
    } else if (token === "-k" || token === "--insecure") {
      result.insecure = true;
    } else if (token === "-L" || token === "--location") {
      result.followRedirects = true;
    } else if (token === "--compressed" || token === "-s" || token === "--silent") {
      // No effect on a fetch/axios translation.
    } else if (!token.startsWith("-")) {
      result.url = unquote(token);
    }
  }

  if (!result.url) throw new Error("No URL found in the command.");
  if (!result.method) result.method = result.body || result.form ? "POST" : "GET";

  return result;
}

const stringifyHeaders = (headers, indent) => {
  const entries = Object.entries(headers);
  if (entries.length === 0) return null;
  const pad = " ".repeat(indent);
  return `{\n${entries
    .map(([key, value]) => `${pad}  ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(",\n")}\n${pad}}`;
};

/** cURL → `fetch` source. */
export function curlToFetch(command) {
  const request = parseCurl(command);
  const headers = { ...request.headers };
  if (request.auth) headers.Authorization = `Basic ${btoa(request.auth)}`;

  const options = [`  method: ${JSON.stringify(request.method)}`];
  const headerBlock = stringifyHeaders(headers, 2);
  if (headerBlock) options.push(`  headers: ${headerBlock}`);
  if (request.body) {
    // A JSON body reads better as an object literal than an escaped string.
    let bodyLine = `  body: ${JSON.stringify(request.body)}`;
    try {
      const parsed = JSON.parse(request.body);
      bodyLine = `  body: JSON.stringify(${JSON.stringify(parsed, null, 2).replace(/\n/g, "\n  ")})`;
    } catch {
      // Not JSON — keep the raw string.
    }
    options.push(bodyLine);
  }
  if (request.followRedirects) options.push(`  redirect: "follow"`);

  return `const response = await fetch(${JSON.stringify(request.url)}, {\n${options.join(
    ",\n",
  )},\n});\n\nif (!response.ok) {\n  throw new Error(\`Request failed: \${response.status}\`);\n}\n\nconst data = await response.json();\n`;
}

/** cURL → `axios` source. */
export function curlToAxios(command) {
  const request = parseCurl(command);
  const config = [`  method: ${JSON.stringify(request.method.toLowerCase())}`, `  url: ${JSON.stringify(request.url)}`];

  const headerBlock = stringifyHeaders(request.headers, 2);
  if (headerBlock) config.push(`  headers: ${headerBlock}`);
  if (request.auth) {
    const [username, ...rest] = request.auth.split(":");
    config.push(
      `  auth: { username: ${JSON.stringify(username)}, password: ${JSON.stringify(rest.join(":"))} }`,
    );
  }
  if (request.body) {
    try {
      const parsed = JSON.parse(request.body);
      config.push(`  data: ${JSON.stringify(parsed, null, 2).replace(/\n/g, "\n  ")}`);
    } catch {
      config.push(`  data: ${JSON.stringify(request.body)}`);
    }
  }

  return `import axios from "axios";\n\nconst { data } = await axios({\n${config.join(",\n")},\n});\n`;
}
