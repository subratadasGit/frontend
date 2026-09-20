/**
 * Renders a laid-out schema as a standalone SVG string.
 *
 * The same function backs the on-screen diagram and every export, so what you
 * see is exactly what downloads. That means no external stylesheet and no CSS
 * variables: colours are written as literals, taken from the application's own
 * palette (`--ink`, `--charcoal`, `--ember`, the hairline whites) so the
 * diagram looks like the rest of the product rather than a foreign artefact.
 */

import { HEADER_HEIGHT, ROW_HEIGHT } from "./transforms/prisma";

const COLORS = {
  ground: "#050505",
  card: "#0a0a0a",
  header: "#141414",
  hairline: "#ffffff1f",
  text: "#ffffffd9",
  muted: "#ffffff73",
  faint: "#ffffff40",
  ember: "#ff4d1c",
  emberSoft: "#ff4d1c99",
  highlight: "#ff9933",
};

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Truncates to fit the node width, since SVG text does not wrap. */
const fit = (text, maxChars) =>
  text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}…` : text;

/** The markers described in the legend: 🔑 PK, 🔗 FK, ★ unique, ? optional. */
function fieldMarker(field) {
  if (field.isId) return { glyph: "◆", color: COLORS.ember, title: "Primary key" };
  if (field.isForeignKey) return { glyph: "◇", color: "#7cc4ff", title: "Foreign key" };
  if (field.isUnique) return { glyph: "★", color: "#ffc46b", title: "Unique" };
  return null;
}

const typeLabel = (field) =>
  `${field.type}${field.isArray ? "[]" : ""}${field.isOptional ? "?" : ""}`;

/**
 * Builds the SVG.
 *
 * `highlight` dims everything not connected to the named model, which is how
 * "highlight relationships" is expressed without a second rendering path.
 */
export function renderSchemaSvg(layout, { highlight = null, matches = null } = {}) {
  const { nodes, edges, width, height } = layout;

  const connected = new Set();
  if (highlight) {
    connected.add(highlight);
    edges.forEach((edge) => {
      if (edge.fromModel === highlight) connected.add(edge.toModel);
      if (edge.toModel === highlight) connected.add(edge.fromModel);
    });
  }

  const isDimmed = (name) => {
    if (highlight) return !connected.has(name);
    if (matches && matches.size > 0) return !matches.has(name);
    return false;
  };

  /* Edges first so they sit behind the cards. */
  const edgeMarkup = edges
    .map((edge) => {
      const dimmed = isDimmed(edge.fromModel) || isDimmed(edge.toModel);
      const active =
        highlight && (edge.fromModel === highlight || edge.toModel === highlight);

      // Leave from whichever side faces the target, so lines do not cross cards.
      const fromRight = edge.from.x + edge.from.width <= edge.to.x;
      const x1 = fromRight ? edge.from.x + edge.from.width : edge.from.x;
      const x2 = fromRight ? edge.to.x : edge.to.x + edge.to.width;
      const bend = Math.max(36, Math.abs(x2 - x1) / 2);
      const c1 = fromRight ? x1 + bend : x1 - bend;
      const c2 = fromRight ? x2 - bend : x2 + bend;

      const stroke = active ? COLORS.highlight : COLORS.emberSoft;
      const opacity = dimmed ? 0.12 : 1;
      const midX = (x1 + x2) / 2;
      const midY = (edge.y1 + edge.y2) / 2;

      const label =
        edge.kind === "one-to-many" ? "1:N" : edge.kind === "one-to-one" ? "1:1" : "N:M";

      return `  <g opacity="${opacity}">
    <path d="M ${x1} ${edge.y1} C ${c1} ${edge.y1}, ${c2} ${edge.y2}, ${x2} ${edge.y2}" fill="none" stroke="${stroke}" stroke-width="${active ? 2 : 1.4}"/>
    <circle cx="${x1}" cy="${edge.y1}" r="3.2" fill="${stroke}"/>
    <circle cx="${x2}" cy="${edge.y2}" r="3.2" fill="${stroke}"/>
    <rect x="${midX - 15}" y="${midY - 8}" width="30" height="16" rx="2" fill="${COLORS.ground}" stroke="${stroke}" stroke-width="0.8"/>
    <text x="${midX}" y="${midY + 4}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" fill="${stroke}">${label}</text>
  </g>`;
    })
    .join("\n");

  /* Cards. */
  const nodeMarkup = nodes
    .map((node) => {
      const dimmed = isDimmed(node.name);
      const active = highlight === node.name;
      const opacity = dimmed ? 0.25 : 1;
      const border = active ? COLORS.ember : COLORS.hairline;

      const rows = node.collapsed
        ? ""
        : node.fields
            .map((field, index) => {
              const y = node.y + HEADER_HEIGHT + index * ROW_HEIGHT;
              const marker = fieldMarker(field);
              const nameX = node.x + (marker ? 26 : 12);

              return `    ${marker ? `<text x="${node.x + 11}" y="${y + 16}" font-family="ui-monospace, monospace" font-size="10" fill="${marker.color}">${marker.glyph}</text>` : ""}
    <text x="${nameX}" y="${y + 16}" font-family="ui-monospace, monospace" font-size="11" fill="${field.isId ? COLORS.text : COLORS.muted}">${escape(fit(field.name, 18))}</text>
    <text x="${node.x + node.width - 12}" y="${y + 16}" text-anchor="end" font-family="ui-monospace, monospace" font-size="10" fill="${COLORS.faint}">${escape(fit(typeLabel(field), 16))}</text>`;
            })
            .join("\n");

      const separatorY = node.y + HEADER_HEIGHT;

      return `  <g opacity="${opacity}" data-model="${escape(node.name)}">
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="2" fill="${COLORS.card}" stroke="${border}" stroke-width="${active ? 1.6 : 1}"/>
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${HEADER_HEIGHT}" rx="2" fill="${COLORS.header}"/>
    <rect x="${node.x}" y="${node.y + HEADER_HEIGHT - 1}" width="${node.width}" height="1" fill="${border}"/>
    <text x="${node.x + 12}" y="${node.y + 24}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="600" fill="${COLORS.ember}">${escape(fit(node.name, 24))}</text>
    <text x="${node.x + node.width - 12}" y="${node.y + 24}" text-anchor="end" font-family="ui-monospace, monospace" font-size="9" fill="${COLORS.faint}">${node.fields.length}</text>
${rows}
    ${node.collapsed ? "" : `<rect x="${node.x}" y="${separatorY}" width="0" height="0" fill="none"/>`}
  </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="ui-sans-serif, system-ui, sans-serif">
  <rect data-role="bg" x="0" y="0" width="${width}" height="${height}" fill="${COLORS.ground}"/>
${edgeMarkup}
${nodeMarkup}
</svg>`;
}

/** The marker key, rendered in the UI beside the diagram. */
export const LEGEND = [
  { glyph: "◆", color: COLORS.ember, label: "Primary key" },
  { glyph: "◇", color: "#7cc4ff", label: "Foreign key" },
  { glyph: "★", color: "#ffc46b", label: "Unique" },
  { glyph: "?", color: COLORS.faint, label: "Optional" },
  { glyph: "[]", color: COLORS.faint, label: "Array" },
];
