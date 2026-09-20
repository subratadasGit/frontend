import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  OptionGroup,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { buildErdLayout, parsePrismaSchema, parseSqlSchema } from "../../../devtools/transforms/sql";

const SAMPLE_SQL = `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  body TEXT,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);`;

const ROW_HEIGHT = 26;
const HEADER_HEIGHT = 34;

/**
 * Draws an entity-relationship diagram from SQL or a Prisma schema.
 *
 * Rendered as inline SVG so it scales, copies and downloads cleanly, with the
 * same tables repeated as a plain list underneath — the diagram is unreadable
 * on a phone, and a horizontally-scrolling canvas is not an answer.
 */
export default function ErdGenerator({ toolId }) {
  const [source, setSource] = useState(SAMPLE_SQL);
  const [dialect, setDialect] = useState("sql");

  const { schema, error } = useMemo(() => {
    if (!source.trim()) return { schema: null, error: null };
    try {
      if (dialect === "prisma") {
        const parsed = parsePrismaSchema(source);
        return {
          schema: {
            tables: parsed.models.map((model) => ({
              name: model.name,
              columns: model.fields.map((field) => ({
                name: field.name,
                type: `${field.type}${field.list ? "[]" : ""}${field.optional ? "?" : ""}`,
                primaryKey: field.isId,
                unique: field.unique,
                references: null,
              })),
            })),
            relations: parsed.relations,
          },
          error: null,
        };
      }
      return { schema: parseSqlSchema(source), error: null };
    } catch (caught) {
      return { schema: null, error: { message: caught.message } };
    }
  }, [source, dialect]);

  const layout = useMemo(() => (schema ? buildErdLayout(schema) : null), [schema]);

  const svg = useMemo(() => {
    if (!layout) return "";
    const escape = (value) =>
      String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const boxes = layout.nodes
      .map((node) => {
        const rows = node.columns
          .map((column, index) => {
            const y = node.y + HEADER_HEIGHT + index * ROW_HEIGHT + 17;
            const marker = column.primaryKey ? "PK " : column.references ? "FK " : "";
            return `    <text x="${node.x + 12}" y="${y}" font-family="monospace" font-size="11" fill="#ffffffb3">${escape(marker + column.name)}</text>
    <text x="${node.x + node.width - 12}" y="${y}" text-anchor="end" font-family="monospace" font-size="10" fill="#ffffff59">${escape(column.type)}</text>`;
          })
          .join("\n");

        return `  <g>
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="#0a0a0a" stroke="#ffffff1f"/>
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${HEADER_HEIGHT}" fill="#ff4d1c1a" stroke="#ffffff1f"/>
    <text x="${node.x + 12}" y="${node.y + 22}" font-family="monospace" font-size="12" font-weight="600" fill="#ff4d1c">${escape(node.name)}</text>
${rows}
  </g>`;
      })
      .join("\n");

    const edges = layout.edges
      .map((edge) => {
        const midpoint = (edge.x1 + edge.x2) / 2;
        return `  <path d="M ${edge.x1} ${edge.y1} C ${midpoint} ${edge.y1}, ${midpoint} ${edge.y2}, ${edge.x2} ${edge.y2}" fill="none" stroke="#ff4d1c99" stroke-width="1.5"/>
  <circle cx="${edge.x1}" cy="${edge.y1}" r="3" fill="#ff4d1c"/>
  <circle cx="${edge.x2}" cy="${edge.y2}" r="3" fill="#ff4d1c"/>`;
      })
      .join("\n");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}">
  <rect width="${layout.width}" height="${layout.height}" fill="#050505"/>
${edges}
${boxes}
</svg>`;
  }, [layout]);

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setSource} />
                <ClearButton onClick={() => setSource("")} disabled={!source} />
              </div>
            }
          >
            Schema
          </PaneLabel>
          <div className="mb-3">
            <OptionGroup
              label="Source"
              value={dialect}
              onChange={setDialect}
              options={[
                { id: "sql", label: "SQL" },
                { id: "prisma", label: "Prisma" },
              ]}
            />
          </div>
          <CodeField value={source} onChange={setSource} ariaLabel="Schema source" rows={18} />
        </Panel>

        <div className="space-y-4">
          <ToolErrorPanel error={error} />

          {layout ? (
            <>
              <Panel className="!p-4 sm:!p-5">
                <PaneLabel
                  right={
                    <div className="flex gap-2">
                      <CopyButton value={svg} label="Copy SVG" />
                      <DownloadButton value={svg} filename="erd.svg" type="image/svg+xml" />
                    </div>
                  }
                >
                  Diagram — {layout.nodes.length} table
                  {layout.nodes.length === 1 ? "" : "s"}, {layout.edges.length} relation
                  {layout.edges.length === 1 ? "" : "s"}
                </PaneLabel>

                <div className="overflow-x-auto border border-white/[0.08] bg-[#050505]">
                  <div
                    className="min-w-[36rem]"
                    role="img"
                    aria-label={`Entity relationship diagram with ${layout.nodes.length} tables`}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              </Panel>

              {/* The same information as a list — readable where the diagram is not. */}
              <Panel className="!p-4 sm:!p-5">
                <PaneLabel>Tables</PaneLabel>
                <div className="space-y-4">
                  {layout.nodes.map((node) => (
                    <div key={node.name} className="border border-white/[0.08]">
                      <p className="border-b border-white/[0.08] bg-[#ff4d1c]/[0.08] px-3 py-2 font-mono text-sm text-[#ff4d1c]">
                        {node.name}
                      </p>
                      <ul className="divide-y divide-white/[0.05]">
                        {node.columns.map((column) => (
                          <li key={column.name} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                            <span className="font-mono text-xs text-white/80">
                              {column.primaryKey ? (
                                <span className="mr-1.5 text-[0.5625rem] text-[#ff4d1c]">PK</span>
                              ) : null}
                              {column.references ? (
                                <span className="mr-1.5 text-[0.5625rem] text-sky-400">FK</span>
                              ) : null}
                              {column.name}
                            </span>
                            <span className="font-mono text-[0.625rem] text-white/35">{column.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Panel>

              {layout.edges.length > 0 ? (
                <Panel className="!p-4 sm:!p-5">
                  <PaneLabel>Relations</PaneLabel>
                  <ul className="space-y-1.5">
                    {layout.edges.map((edge, index) => (
                      <li key={index} className="font-mono text-xs text-white/70">
                        <span className="text-white/85">{edge.fromTable}</span>.
                        <span className="text-[#ff4d1c]">{edge.fromColumn}</span>
                        <span className="mx-2 text-white/30">→</span>
                        <span className="text-white/85">{edge.toTable}</span>.
                        <span className="text-[#ff4d1c]">{edge.toColumn}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : (
                <ToolNote>
                  No foreign keys were found, so the diagram shows tables without
                  connections. Inline <code>REFERENCES</code> and table-level{" "}
                  <code>FOREIGN KEY</code> clauses are both detected.
                </ToolNote>
              )}
            </>
          ) : null}
        </div>
      </div>

      <RelatedTools ids={["sql-to-prisma", "prisma-viewer", "sql-formatter"]} />
    </DevToolPage>
  );
}
