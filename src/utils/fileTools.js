/**
 * Browser-side file toolkit: PDF merge, PDF split, and format conversion.
 *
 * Everything here runs on the client. Nothing is uploaded, which is the point —
 * these are the operations people normally hand to a random website, and the
 * files in question are usually the ones you would least like to hand over.
 *
 * pdf-lib does the PDF writing, pdf.js does the PDF reading, and canvas plus a
 * handful of small parsers cover the rest.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ------------------------------ pdf.js setup ------------------------------ */

let pdfjsPromise = null;

/**
 * Loads pdf.js on first use.
 *
 * It is a large dependency and only the PDF-reading paths need it, so it is
 * imported dynamically rather than pulled into the main bundle.
 */
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/* --------------------------------- Helpers -------------------------------- */

export const extensionOf = (name = "") =>
  (name.split(".").pop() || "").toLowerCase();

export const baseNameOf = (name = "file") =>
  name.replace(/\.[^.]+$/, "") || "file";

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readArrayBuffer = (file) => file.arrayBuffer();

const readText = (file) => file.text();

const blobOf = (data, type) => new Blob([data], { type });

/* ----------------------------- PDF: merge/split --------------------------- */

/** Page count without fully parsing the document for rendering. */
export async function readPdfPageCount(file) {
  const pdf = await PDFDocument.load(await readArrayBuffer(file), {
    ignoreEncryption: true,
  });
  return pdf.getPageCount();
}

/**
 * Concatenates PDFs in the order given.
 *
 * `onProgress` is called with (done, total) so a long merge can show movement.
 */
export async function mergePdfs(files, { onProgress } = {}) {
  if (!files || files.length < 2) {
    throw new Error("Select at least two PDFs to merge.");
  }

  const merged = await PDFDocument.create();
  let done = 0;

  for (const file of files) {
    let source;
    try {
      source = await PDFDocument.load(await readArrayBuffer(file), {
        ignoreEncryption: true,
      });
    } catch {
      throw new Error(
        `"${file.name}" could not be read. It may be corrupt or password-protected.`,
      );
    }
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
    done += 1;
    onProgress?.(done, files.length);
  }

  merged.setProducer("Creates.io");
  merged.setCreationDate(new Date());
  return blobOf(await merged.save(), "application/pdf");
}

/**
 * Parses a page-range string such as `1-3, 5, 8-` into zero-based index lists.
 * Returns one group per comma-separated term, so `1-3, 5` yields two documents.
 */
export function parseRanges(input, pageCount) {
  const groups = [];
  const terms = String(input || "")
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) throw new Error("Enter at least one page range.");

  for (const term of terms) {
    const match = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(term);
    if (!match || (!match[1] && !match[3])) {
      throw new Error(`"${term}" is not a valid page range.`);
    }

    const isRange = Boolean(match[2]);
    const start = match[1] ? Number(match[1]) : 1;
    const end = isRange ? (match[3] ? Number(match[3]) : pageCount) : start;

    if (start < 1 || end > pageCount || start > end) {
      throw new Error(
        `"${term}" is outside this document (1–${pageCount}).`,
      );
    }

    const indices = [];
    for (let page = start; page <= end; page += 1) indices.push(page - 1);
    groups.push({ label: start === end ? `p${start}` : `p${start}-${end}`, indices });
  }

  return groups;
}

/**
 * Splits a PDF.
 *
 *   mode "pages"  — one output document per page
 *   mode "ranges" — one output document per comma-separated range
 *   mode "every"  — fixed-size chunks of `size` pages
 */
export async function splitPdf(file, { mode = "pages", ranges = "", size = 1 } = {}) {
  const bytes = await readArrayBuffer(file);
  let source;
  try {
    source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new Error("This PDF could not be read. It may be password-protected.");
  }

  const pageCount = source.getPageCount();
  if (pageCount < 2 && mode !== "ranges") {
    throw new Error("This PDF has a single page — there is nothing to split.");
  }

  let groups;
  if (mode === "ranges") {
    groups = parseRanges(ranges, pageCount);
  } else if (mode === "every") {
    const chunk = Math.max(1, Math.floor(Number(size) || 1));
    groups = [];
    for (let start = 0; start < pageCount; start += chunk) {
      const indices = [];
      for (let i = start; i < Math.min(start + chunk, pageCount); i += 1) {
        indices.push(i);
      }
      groups.push({
        label:
          indices.length === 1
            ? `p${indices[0] + 1}`
            : `p${indices[0] + 1}-${indices[indices.length - 1] + 1}`,
        indices,
      });
    }
  } else {
    groups = Array.from({ length: pageCount }, (unused, index) => ({
      label: `p${index + 1}`,
      indices: [index],
    }));
  }

  const base = baseNameOf(file.name);
  const outputs = [];

  for (const group of groups) {
    const document = await PDFDocument.create();
    const pages = await document.copyPages(source, group.indices);
    pages.forEach((page) => document.addPage(page));
    document.setProducer("Creates.io");
    outputs.push({
      name: `${base}-${group.label}.pdf`,
      blob: blobOf(await document.save(), "application/pdf"),
      meta: `${group.indices.length} page${group.indices.length === 1 ? "" : "s"}`,
    });
  }

  return outputs;
}

/* ------------------------------- Conversion ------------------------------- */

const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "avif",
  "svg",
];

const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "html",
  "htm",
  "xml",
  "yml",
  "yaml",
  "log",
  "rtf",
];

/** Broad family a file belongs to, which decides the available targets. */
export function detectKind(file) {
  const extension = extensionOf(file.name);
  if (extension === "pdf" || file.type === "application/pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(extension) || file.type.startsWith("image/")) {
    return "image";
  }
  if (TEXT_EXTENSIONS.includes(extension) || file.type.startsWith("text/")) {
    return "text";
  }
  return "unknown";
}

/** Every target this toolkit can produce, grouped by the source family. */
export const CONVERSION_TARGETS = {
  image: [
    { id: "png", label: "PNG", extension: "png" },
    { id: "jpg", label: "JPG", extension: "jpg" },
    { id: "jpeg", label: "JPEG", extension: "jpeg" },
    { id: "webp", label: "WEBP", extension: "webp" },
    { id: "pdf", label: "PDF", extension: "pdf" },
  ],
  pdf: [
    { id: "png", label: "PNG (per page)", extension: "png" },
    { id: "jpg", label: "JPG (per page)", extension: "jpg" },
    { id: "jpeg", label: "JPEG (per page)", extension: "jpeg" },
    { id: "webp", label: "WEBP (per page)", extension: "webp" },
    { id: "txt", label: "TXT (extracted text)", extension: "txt" },
  ],
  text: [
    { id: "txt", label: "TXT", extension: "txt" },
    { id: "md", label: "Markdown", extension: "md" },
    { id: "html", label: "HTML", extension: "html" },
    { id: "csv", label: "CSV", extension: "csv" },
    { id: "tsv", label: "TSV", extension: "tsv" },
    { id: "json", label: "JSON", extension: "json" },
    { id: "rtf", label: "RTF (opens in Word)", extension: "rtf" },
    { id: "pdf", label: "PDF", extension: "pdf" },
  ],
  unknown: [],
};

/* -- Images ---------------------------------------------------------------- */

const MIME_BY_TARGET = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

async function decodeImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error(`"${file.name}" is not an image this browser can read.`));
      image.src = url;
    });
    // SVG without intrinsic dimensions decodes at 0×0; give it a usable box.
    const width = image.naturalWidth || 1024;
    const height = image.naturalHeight || 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error(`This browser cannot write ${mime}.`)),
      mime,
      quality,
    );
  });
}

/** Flattens onto white, because JPEG has no alpha channel. */
function flatten(canvas) {
  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height;
  const ctx = output.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.drawImage(canvas, 0, 0);
  return output;
}

async function imagesToPdf(canvases, producerName) {
  const pdf = await PDFDocument.create();
  for (const canvas of canvases) {
    const pngBlob = await canvasToBlob(canvas, "image/png");
    const embedded = await pdf.embedPng(await pngBlob.arrayBuffer());
    const page = pdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  pdf.setProducer(producerName);
  return blobOf(await pdf.save(), "application/pdf");
}

/* -- PDF reading ----------------------------------------------------------- */

async function openPdf(file) {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data: new Uint8Array(await readArrayBuffer(file)) })
    .promise;
}

async function pdfToImages(file, target, { scale = 2, quality = 0.92, onProgress } = {}) {
  const document_ = await openPdf(file);
  const base = baseNameOf(file.name);
  const mime = MIME_BY_TARGET[target.id];
  const outputs = [];

  for (let number = 1; number <= document_.numPages; number += 1) {
    const page = await document_.getPage(number);
    const viewport = page.getViewport({ scale });
    let canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    // PDF pages have no background of their own; without this, transparent
    // areas render black once flattened into an image.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    if (mime === "image/jpeg") canvas = flatten(canvas);
    outputs.push({
      name: `${base}-p${number}.${target.extension}`,
      blob: await canvasToBlob(canvas, mime, mime === "image/png" ? undefined : quality),
      meta: `${canvas.width} × ${canvas.height}`,
    });
    onProgress?.(number, document_.numPages);
  }

  return outputs;
}

async function pdfToText(file, { onProgress } = {}) {
  const document_ = await openPdf(file);
  const chunks = [];

  for (let number = 1; number <= document_.numPages; number += 1) {
    const page = await document_.getPage(number);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => (item.str ?? "") + (item.hasEOL ? "\n" : ""))
      .join("");
    chunks.push(`--- Page ${number} ---\n${line.trim()}`);
    onProgress?.(number, document_.numPages);
  }

  return chunks.join("\n\n");
}

/* -- Text parsing and serialising ------------------------------------------ */

/** CSV/TSV reader that understands quoted fields and embedded newlines. */
export function parseDelimited(input, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];

    if (quoted) {
      if (character === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
}

const escapeDelimited = (value, delimiter) => {
  const text = value == null ? "" : String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Reads a source document into a common shape: always `text`, plus `rows` when
 * the input is genuinely tabular. Targets are then written from that.
 */
function parseTextSource(content, extension) {
  if (extension === "csv") {
    return { rows: parseDelimited(content, ","), text: content };
  }
  if (extension === "tsv") {
    return { rows: parseDelimited(content, "\t"), text: content };
  }
  if (extension === "json") {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        const headers = [
          ...new Set(parsed.flatMap((entry) => Object.keys(entry || {}))),
        ];
        const rows = [
          headers,
          ...parsed.map((entry) =>
            headers.map((header) => {
              const value = entry?.[header];
              return value == null
                ? ""
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
            }),
          ),
        ];
        return { rows, text: content, json: parsed };
      }
      return { rows: null, text: content, json: parsed };
    } catch {
      throw new Error("This file is not valid JSON.");
    }
  }
  if (extension === "html" || extension === "htm") {
    const parsed = new DOMParser().parseFromString(content, "text/html");
    return { rows: null, text: parsed.body?.textContent?.trim() || "", html: content };
  }
  return { rows: null, text: content };
}

const rowsToDelimited = (rows, delimiter) =>
  rows
    .map((row) => row.map((cell) => escapeDelimited(cell, delimiter)).join(delimiter))
    .join("\n");

function rowsToJson(rows) {
  const [headers, ...body] = rows;
  return JSON.stringify(
    body.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
    ),
    null,
    2,
  );
}

const rowsToMarkdown = (rows) => {
  const [headers, ...body] = rows;
  const escape = (cell) => String(cell ?? "").replace(/\|/g, "\\|");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${headers.map((h, i) => escape(row[i])).join(" | ")} |`),
  ].join("\n");
};

const rowsToHtmlTable = (rows) => {
  const [headers, ...body] = rows;
  return [
    "<table>",
    `  <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`,
    "  <tbody>",
    ...body.map(
      (row) =>
        `    <tr>${headers
          .map((unused, index) => `<td>${escapeHtml(row[index])}</td>`)
          .join("")}</tr>`,
    ),
    "  </tbody>",
    "</table>",
  ].join("\n");
};

/**
 * Small Markdown renderer: headings, emphasis, inline code, links, lists,
 * blockquotes and paragraphs. Deliberately not a full CommonMark
 * implementation — it covers the constructs a plain document actually uses.
 */
export function markdownToHtml(markdown) {
  const inline = (text) =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

  const output = [];
  let list = null;

  const closeList = () => {
    if (list) {
      output.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (heading) {
      closeList();
      output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    } else if (bullet || ordered) {
      const wanted = bullet ? "ul" : "ol";
      if (list !== wanted) {
        closeList();
        output.push(`<${wanted}>`);
        list = wanted;
      }
      output.push(`<li>${inline((bullet || ordered)[1])}</li>`);
    } else if (quote) {
      closeList();
      output.push(`<blockquote>${inline(quote[1])}</blockquote>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      output.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  return output.join("\n");
}

const htmlDocument = (title, body) =>
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font: 16px/1.65 -apple-system, "Segoe UI", Roboto, sans-serif; margin: 3rem auto; max-width: 46rem; padding: 0 1.25rem; color: #16181d; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d8dbe0; padding: .5rem .7rem; text-align: left; }
  th { background: #f4f5f7; }
  code { background: #f4f5f7; padding: .1em .35em; border-radius: 3px; }
  blockquote { border-left: 3px solid #d8dbe0; margin: 0; padding-left: 1rem; color: #545963; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

/** RTF escaping: braces and backslashes are syntax, non-ASCII needs \\u. */
function toRtf(text) {
  const escaped = text
    .replace(/[\\{}]/g, (character) => `\\${character}`)
    .replace(/\r?\n/g, "\\par\n")
    .replace(/[\u0080-\uFFFF]/g, (character) => `\\u${character.charCodeAt(0)}?`);
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Helvetica;}}\n\\fs22 ${escaped}\n}`;
}

/**
 * pdf-lib's standard fonts are WinAnsi-encoded, so anything outside Latin-1
 * would throw on `drawText`. Common typographic characters are folded to their
 * ASCII equivalents and the rest is replaced, rather than failing the export.
 */
const WINANSI_FOLD = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": ",",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u2022": "-",
  "\u00B7": "-",
  "\u2192": "->",
  "\u2190": "<-",
  "\t": "    ",
};

function sanitizeForPdf(text) {
  let unsupported = 0;
  const cleaned = text
    .replace(/[\u2018\u2019\u201A\u201C\u201D\u2013\u2014\u2026\u00A0\u2022\u00B7\u2192\u2190\t]/g,
      (character) => WINANSI_FOLD[character])
    .replace(/[^\u0020-\u007E\u00A1-\u00FF\n]/g, () => {
      unsupported += 1;
      return "?";
    });
  return { text: cleaned, unsupported };
}

/** Lays text out on A4 pages, wrapping on the measured width of the font. */
async function textToPdf(text, { title } = {}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const size = 11;
  const leading = 15.5;
  const margin = 56;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;

  const { text: safe, unsupported } = sanitizeForPdf(text);

  const lines = [];
  for (const paragraph of safe.split(/\n/)) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      // A single word longer than the measure is broken on character count.
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let piece = "";
        for (const character of word) {
          if (font.widthOfTextAtSize(piece + character, size) > maxWidth) {
            lines.push(piece);
            piece = character;
          } else {
            piece += character;
          }
        }
        current = piece;
      } else {
        current = word;
      }
    }
    lines.push(current);
  }

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.09, 0.1, 0.12),
      });
    }
    y -= leading;
  }

  if (title) pdf.setTitle(title);
  pdf.setProducer("Creates.io");
  return { blob: blobOf(await pdf.save(), "application/pdf"), unsupported };
}

/* -- The conversion entry point -------------------------------------------- */

/**
 * Converts one file to `targetId`.
 *
 * Returns `{ outputs, warning }`, where `outputs` is a list of
 * `{ name, blob, meta }` — more than one when a PDF is rasterised per page.
 */
export async function convertFile(file, targetId, { quality = 0.92, scale = 2, onProgress } = {}) {
  const kind = detectKind(file);
  const target = (CONVERSION_TARGETS[kind] || []).find(
    (entry) => entry.id === targetId,
  );

  if (!target) {
    throw new Error(
      `"${file.name}" cannot be converted to ${String(targetId).toUpperCase()}.`,
    );
  }

  const base = baseNameOf(file.name);
  let warning = null;

  /* Images ------------------------------------------------------------- */
  if (kind === "image") {
    const canvas = await decodeImage(file);

    if (target.id === "pdf") {
      return {
        outputs: [
          {
            name: `${base}.pdf`,
            blob: await imagesToPdf([canvas], "Creates.io"),
            meta: `${canvas.width} × ${canvas.height}`,
          },
        ],
        warning,
      };
    }

    const mime = MIME_BY_TARGET[target.id];
    const source = mime === "image/jpeg" ? flatten(canvas) : canvas;
    return {
      outputs: [
        {
          name: `${base}.${target.extension}`,
          blob: await canvasToBlob(
            source,
            mime,
            mime === "image/png" ? undefined : quality,
          ),
          meta: `${canvas.width} × ${canvas.height}`,
        },
      ],
      warning,
    };
  }

  /* PDF ---------------------------------------------------------------- */
  if (kind === "pdf") {
    if (target.id === "txt") {
      const text = await pdfToText(file, { onProgress });
      if (!text.replace(/--- Page \d+ ---/g, "").trim()) {
        warning =
          "No text layer was found — this looks like a scanned PDF. Convert it to images instead.";
      }
      return {
        outputs: [
          {
            name: `${base}.txt`,
            blob: blobOf(text, "text/plain;charset=utf-8"),
            meta: `${text.length} characters`,
          },
        ],
        warning,
      };
    }
    return {
      outputs: await pdfToImages(file, target, { scale, quality, onProgress }),
      warning,
    };
  }

  /* Text --------------------------------------------------------------- */
  const extension = extensionOf(file.name);
  const content = await readText(file);
  const source = parseTextSource(content, extension);
  const needsRows = ["csv", "tsv"].includes(target.id);

  if (needsRows && !source.rows) {
    throw new Error(
      `${file.name} is not tabular, so it cannot become ${target.label}. Convert a CSV, TSV or a JSON array of objects.`,
    );
  }

  let output;
  let mime = "text/plain;charset=utf-8";

  switch (target.id) {
    case "csv":
      output = rowsToDelimited(source.rows, ",");
      mime = "text/csv;charset=utf-8";
      break;
    case "tsv":
      output = rowsToDelimited(source.rows, "\t");
      mime = "text/tab-separated-values;charset=utf-8";
      break;
    case "json":
      output = source.rows ? rowsToJson(source.rows) : JSON.stringify(
        source.json ?? { content: source.text },
        null,
        2,
      );
      mime = "application/json;charset=utf-8";
      break;
    case "md":
      output = source.rows
        ? rowsToMarkdown(source.rows)
        : extension === "md" || extension === "markdown"
          ? content
          : source.text;
      mime = "text/markdown;charset=utf-8";
      break;
    case "html":
      output = htmlDocument(
        base,
        source.rows
          ? rowsToHtmlTable(source.rows)
          : extension === "md" || extension === "markdown"
            ? markdownToHtml(content)
            : extension === "html" || extension === "htm"
              ? content
              : `<pre>${escapeHtml(source.text)}</pre>`,
      );
      mime = "text/html;charset=utf-8";
      break;
    case "rtf":
      output = toRtf(source.rows ? rowsToMarkdown(source.rows) : source.text);
      mime = "application/rtf";
      break;
    case "pdf": {
      const body = source.rows ? rowsToMarkdown(source.rows) : source.text;
      const result = await textToPdf(body, { title: base });
      if (result.unsupported > 0) {
        warning = `${result.unsupported} character${
          result.unsupported === 1 ? " was" : "s were"
        } outside the PDF font's Latin-1 range and became "?".`;
      }
      return {
        outputs: [
          { name: `${base}.pdf`, blob: result.blob, meta: formatBytes(result.blob.size) },
        ],
        warning,
      };
    }
    default:
      output = source.text;
  }

  return {
    outputs: [
      {
        name: `${base}.${target.extension}`,
        blob: blobOf(output, mime),
        meta: `${output.length} characters`,
      },
    ],
    warning,
  };
}
