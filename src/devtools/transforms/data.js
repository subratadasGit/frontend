/**
 * Data format conversions: CSV, YAML and XML against JSON.
 *
 * CSV parsing and row serialisation are reused from `utils/fileTools.js`
 * rather than reimplemented — that parser already handles quoted fields and
 * embedded newlines, and one correct implementation beats two.
 *
 * `js-yaml` is loaded lazily so YAML only costs bytes on the pages that use it.
 * XML uses the browser's own DOMParser/XMLSerializer, so it needs no library
 * at all.
 */

import { parseDelimited } from "../../utils/fileTools";
import { parseJson } from "./json";

/* ----------------------------------- CSV ---------------------------------- */

const escapeCell = (value, delimiter) => {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
};

/** JSON array of objects → CSV, with the union of all keys as the header. */
export function jsonToCsv(text, { delimiter = "," } = {}) {
  const parsed = parseJson(text);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length === 0) return "";
  if (rows.some((row) => row === null || typeof row !== "object" || Array.isArray(row))) {
    throw new Error("CSV is generated from an array of objects.");
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map((header) => escapeCell(header, delimiter)).join(delimiter),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header], delimiter)).join(delimiter)),
  ].join("\n");
}

/**
 * CSV → JSON. Numbers and booleans are recovered by default, since a CSV that
 * round-trips back to all-strings is rarely what people want.
 */
export function csvToJson(text, { delimiter = ",", inferTypes = true } = {}) {
  const rows = parseDelimited(text, delimiter);
  if (rows.length === 0) return "[]";
  const [headers, ...body] = rows;

  const coerce = (value) => {
    if (!inferTypes) return value;
    const trimmed = value.trim();
    if (trimmed === "") return "";
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;
    // Only plain decimals — not phone numbers, IDs with leading zeros, etc.
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !/^0\d/.test(trimmed)) return Number(trimmed);
    return value;
  };

  return JSON.stringify(
    body.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, coerce(row[index] ?? "")])),
    ),
    null,
    2,
  );
}

/* ----------------------------------- YAML --------------------------------- */

let yamlPromise = null;
const getYaml = () => {
  if (!yamlPromise) yamlPromise = import("js-yaml");
  return yamlPromise;
};

export async function jsonToYaml(text) {
  const yaml = await getYaml();
  return yaml.dump(parseJson(text), { indent: 2, lineWidth: 100, noRefs: true });
}

export async function yamlToJson(text) {
  const yaml = await getYaml();
  if (!text.trim()) throw new Error("There is nothing to convert.");
  try {
    return JSON.stringify(yaml.load(text), null, 2);
  } catch (caught) {
    // js-yaml errors carry a mark with the exact line and column.
    const mark = caught?.mark;
    const where = mark ? ` (line ${mark.line + 1}, column ${mark.column + 1})` : "";
    throw new Error(`${caught?.reason || caught?.message || "Invalid YAML"}${where}`, {
      cause: caught,
    });
  }
}

/* ----------------------------------- XML ---------------------------------- */

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const xmlTagName = (name) => {
  const safe = String(name).replace(/[^A-Za-z0-9_.-]/g, "_");
  return /^[A-Za-z_]/.test(safe) ? safe : `_${safe}`;
};

/** JSON → XML. Arrays repeat their parent's singular tag for each element. */
export function jsonToXml(text, { rootName = "root", indent = 2 } = {}) {
  const value = parseJson(text);
  const pad = (depth) => " ".repeat(depth * indent);

  const build = (node, name, depth) => {
    const tag = xmlTagName(name);

    if (Array.isArray(node)) {
      return node.map((entry) => build(entry, name, depth)).join("\n");
    }
    if (node === null || node === undefined) {
      return `${pad(depth)}<${tag}/>`;
    }
    if (typeof node === "object") {
      const children = Object.entries(node)
        .map(([key, entry]) => build(entry, key, depth + 1))
        .join("\n");
      return `${pad(depth)}<${tag}>\n${children}\n${pad(depth)}</${tag}>`;
    }
    return `${pad(depth)}<${tag}>${escapeXml(node)}</${tag}>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n${build(value, rootName, 0)}\n`;
}

/**
 * XML → JSON, using the browser's parser.
 *
 * Attributes are kept under `@name` keys and text content under `#text` when
 * an element has both, which is the convention most XML-to-JSON tools use and
 * keeps the conversion lossless enough to reverse.
 */
export function xmlToJson(text) {
  if (!text.trim()) throw new Error("There is nothing to convert.");

  const document_ = new DOMParser().parseFromString(text, "application/xml");
  const failure = document_.querySelector("parsererror");
  if (failure) {
    // The browser wraps the real message in boilerplate ("This page contains
    // the following errors:"), so only the diagnostic itself is surfaced.
    const raw = failure.textContent?.replace(/\s+/g, " ").trim() || "";
    const diagnostic = /error on line[^:]*:?[^]*?(?=Below is a rendering|$)/i.exec(raw);
    throw new Error(
      (diagnostic?.[0] || raw.replace(/^This page contains the following errors:\s*/i, "") || "This is not well-formed XML.").trim(),
    );
  }

  const convert = (node) => {
    const result = {};

    for (const attribute of node.attributes || []) {
      result[`@${attribute.name}`] = attribute.value;
    }

    const elements = [...node.children];
    const textContent = [...node.childNodes]
      .filter((child) => child.nodeType === 3)
      .map((child) => child.nodeValue.trim())
      .filter(Boolean)
      .join(" ");

    if (elements.length === 0) {
      if (Object.keys(result).length === 0) return textContent;
      if (textContent) result["#text"] = textContent;
      return result;
    }

    if (textContent) result["#text"] = textContent;

    for (const child of elements) {
      const value = convert(child);
      if (child.tagName in result) {
        // Repeated tags collapse into an array, which is what they mean.
        if (!Array.isArray(result[child.tagName])) result[child.tagName] = [result[child.tagName]];
        result[child.tagName].push(value);
      } else {
        result[child.tagName] = value;
      }
    }
    return result;
  };

  const root = document_.documentElement;
  return JSON.stringify({ [root.tagName]: convert(root) }, null, 2);
}
