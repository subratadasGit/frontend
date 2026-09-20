import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Btn, EmptyState, Page, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  PaneLabel,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import DiagramCanvas from "../../../components/devtools/DiagramCanvas";
import ExportMenu from "../../../components/devtools/ExportMenu";
import Breadcrumbs from "../../../components/devtools/Breadcrumbs";
import { downloadBlob } from "../../../utils/global";
import { useRecents } from "../../../devtools/useToolPrefs";
import {
  layoutSchema,
  parsePrismaSchema,
  prismaToPlantUml,
  schemaStats,
} from "../../../devtools/transforms/prisma";
import { renderSchemaSvg } from "../../../devtools/diagramSvg";
import {
  TEMPLATES,
  parsePlantUmlEntities,
  plantUmlServerUrl,
} from "../../../devtools/transforms/plantuml";

const SAMPLE = `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
}

model Profile {
  id     String  @id @default(uuid())
  bio    String?
  userId String  @unique
  user   User    @relation(fields: [userId], references: [id])
}

model Post {
  id        String   @id @default(uuid())
  title     String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  tags      Tag[]
  createdAt DateTime @default(now())
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
}`;

const TABS = [
  { id: "schema", label: "Schema" },
  { id: "diagram", label: "Diagram" },
  { id: "plantuml", label: "PlantUML" },
  { id: "relations", label: "Relations" },
];

/**
 * The Prisma workspace: schema in, diagram and PlantUML out, exports from one
 * menu.
 *
 * Built as one page with tabs rather than four separate tools, because the
 * whole value is the path between them — you paste a schema once and every
 * view is derived from it. Tabs double as the mobile layout, so the split view
 * never has to be squeezed onto a phone.
 */
export default function PrismaWorkspace({ toolId }) {
  const { recordUse } = useRecents();
  const [source, setSource] = useState("");
  const [tab, setTab] = useState("schema");
  const [filename, setFilename] = useState(null);
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [generatedSource, setGeneratedSource] = useState("");
  const [splitRatio, setSplitRatio] = useState(0.42);
  const [diagramSvg, setDiagramSvg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [plantUmlDraft, setPlantUmlDraft] = useState("");
  const [plantUmlEdited, setPlantUmlEdited] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [remoteError, setRemoteError] = useState(null);
  const [confirmTemplate, setConfirmTemplate] = useState(null);
  const splitRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (toolId) recordUse(toolId);
  }, [toolId, recordUse]);

  // The schema the diagram is built from: the live text, or the last text the
  // user explicitly generated from when live updates are off.
  const active = liveUpdate ? source : generatedSource;

  const parsed = useMemo(() => {
    if (!active.trim()) return { schema: null, error: null };
    try {
      return { schema: parsePrismaSchema(active), error: null };
    } catch (caught) {
      return {
        schema: null,
        error: {
          message: caught.message,
          line: caught.line,
          column: caught.column,
          hint: caught.hint,
        },
      };
    }
  }, [active]);

  const schema = parsed.schema;
  const stats = useMemo(() => (schema ? schemaStats(schema) : null), [schema]);

  // PlantUML is derived from the schema, so it simply follows along — until
  // the user edits it or picks a template, at which point their draft wins.
  const generatedPlantUml = useMemo(
    () => (schema ? prismaToPlantUml(schema) : ""),
    [schema],
  );
  const plantUml = plantUmlEdited ? plantUmlDraft : generatedPlantUml;

  const editPlantUml = (value) => {
    setPlantUmlDraft(value);
    setPlantUmlEdited(true);
    setRemoteUrl(null);
  };

  /* ------------------------------ Schema input ----------------------------- */

  const loadFile = useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    setSource(text);
    setGeneratedSource(text);
    setFilename(file.name);
    setPlantUmlEdited(false);
    setTab("diagram");
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSource(text);
      setGeneratedSource(text);
      setFilename(null);
      setPlantUmlEdited(false);
      setTab("diagram");
    } catch {
      // Permission denied — the textarea still accepts a manual paste.
      setTab("schema");
    }
  };

  const loadSample = () => {
    setSource(SAMPLE);
    setGeneratedSource(SAMPLE);
    setFilename("example.prisma");
    setPlantUmlEdited(false);
    setTab("diagram");
  };

  /* -------------------------------- Split pane ----------------------------- */

  const startResize = (event) => {
    event.preventDefault();
    const container = splitRef.current;
    if (!container) return;

    const onMove = (moveEvent) => {
      const bounds = container.getBoundingClientRect();
      const ratio = (moveEvent.clientX - bounds.left) / bounds.width;
      setSplitRatio(Math.min(0.75, Math.max(0.2, ratio)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* -------------------------------- PlantUML ------------------------------- */

  const plantUmlPreview = useMemo(() => {
    if (!plantUml.trim()) return { svg: null, error: null, meta: null };
    try {
      const entities = parsePlantUmlEntities(plantUml);
      const layout = layoutSchema(entities);
      return {
        svg: renderSchemaSvg(layout),
        error: null,
        meta: { unsupported: entities.unsupported, skipped: entities.skippedRelations },
      };
    } catch (caught) {
      return {
        svg: null,
        meta: null,
        error: { message: caught.message, line: caught.line, hint: caught.hint },
      };
    }
  }, [plantUml]);

  const renderRemotely = async () => {
    setRemoteBusy(true);
    setRemoteError(null);
    try {
      setRemoteUrl(await plantUmlServerUrl(plantUml));
    } catch (caught) {
      setRemoteUrl(null);
      setRemoteError(caught.message || "The remote renderer could not be reached.");
    } finally {
      setRemoteBusy(false);
    }
  };

  const applyTemplate = (template) => {
    // Only warn when there is hand-written work to lose.
    if (plantUmlEdited && plantUmlDraft.trim()) {
      setConfirmTemplate(template);
      return;
    }
    editPlantUml(template.code);
  };

  const empty = !active.trim();

  /* --------------------------------- Render -------------------------------- */

  return (
    <Page>
      <Breadcrumbs
        trail={[
          { label: "Dev Tools", to: "/devtools" },
          { label: "Database", to: "/devtools?category=database" },
          { label: "Prisma Schema Visualizer" },
          { label: TABS.find((entry) => entry.id === tab)?.label },
        ]}
      />

      {/* Tool header */}
      <header className="mb-6 flex flex-col gap-5 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/devtools?category=database"
            className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.2em] text-white/35 uppercase transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span> Database
          </Link>
          <h1 className="mt-2 text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.06] font-semibold tracking-[-0.035em]">
            Prisma Schema Visualizer
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Turn a Prisma schema into an interactive database diagram, PlantUML,
            or a document you can hand to a teammate.
          </p>
          {stats ? (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.625rem] tracking-[0.14em] text-white/35 uppercase">
              <span>{stats.models} models</span>
              <span>{stats.relations} relations</span>
              <span>{stats.fields} fields</span>
              {stats.enums ? <span>{stats.enums} enums</span> : null}
              <span className="text-[#ff4d1c]">● Processed locally</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".prisma,text/plain"
            className="sr-only"
            onChange={(event) => {
              loadFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Btn variant="ghost" onClick={() => fileInputRef.current?.click()}>
            Import schema
          </Btn>
          <ExportMenu
            svg={tab === "plantuml" ? plantUmlPreview.svg || diagramSvg : diagramSvg}
            stats={stats}
            filename="prisma-schema-diagram"
            sources={[
              {
                label: "PlantUML",
                value: plantUml,
                filename: "schema.puml",
                unavailable: "Generate a diagram first.",
              },
              {
                label: "Prisma schema",
                value: active,
                filename: "schema.prisma",
                unavailable: "Load a schema first.",
              },
            ]}
          />
        </div>
      </header>

      {/* Empty state */}
      {empty ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border border-dashed px-6 py-16 text-center transition-colors ${
            dragging ? "border-[#ff4d1c] bg-[#ff4d1c]/[0.06]" : "border-white/15"
          }`}
        >
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
            Create your database diagram
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
            Paste your schema, drop a <code className="font-mono">schema.prisma</code> file here, or
            start from an example. Everything is parsed in this browser.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Btn onClick={() => setTab("schema")}>Paste schema</Btn>
            <Btn variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Upload schema.prisma
            </Btn>
            <Btn variant="ghost" onClick={pasteFromClipboard}>
              Paste from clipboard
            </Btn>
            <Btn variant="ghost" onClick={loadSample}>
              Load an example
            </Btn>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      {!empty ? (
        <>
          <div
            className="mb-4 flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Prisma workspace sections"
          >
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={`border px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c] ${
                  tab === entry.id
                    ? "border-[#ff4d1c] text-[#ff4d1c]"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                }`}
              >
                {entry.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {filename ? (
                <span className="font-mono text-[0.625rem] text-white/35">{filename}</span>
              ) : null}
              <label className="flex items-center gap-1.5 text-xs text-white/50">
                <input
                  type="checkbox"
                  checked={liveUpdate}
                  onChange={(event) => {
                    setLiveUpdate(event.target.checked);
                    if (event.target.checked) setGeneratedSource(source);
                  }}
                  className="h-3.5 w-3.5 accent-[#ff4d1c]"
                />
                Live update
              </label>
              {!liveUpdate ? (
                <Btn
                  className="!px-3 !py-1.5"
                  onClick={() => {
                    setGeneratedSource(source);
                    setPlantUmlEdited(false);
                  }}
                >
                  Generate diagram
                </Btn>
              ) : null}
            </div>
          </div>

          <ToolErrorPanel error={parsed.error} />

          {parsed.error ? (
            <div className="mt-3">
              <ToolNote>
                The diagram shows the last schema that parsed. Fix the line above
                and it updates.
              </ToolNote>
            </div>
          ) : null}

          {schema && schema.warnings.length > 0 ? (
            <details className="mt-3 border border-amber-500/30 bg-amber-500/[0.05] px-4 py-3">
              <summary className="cursor-pointer text-sm text-amber-300">
                {schema.warnings.length} thing{schema.warnings.length === 1 ? "" : "s"} the parser
                could not make sense of
              </summary>
              <ul className="mt-2 space-y-1">
                {schema.warnings.map((warning, index) => (
                  <li key={index} className="text-xs text-amber-200/70">
                    <span className="font-mono">line {warning.line}</span> — {warning.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* Schema — split editor and diagram on desktop */}
          {tab === "schema" ? (
            <div ref={splitRef} className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-0">
              <div style={{ flexBasis: `${splitRatio * 100}%` }} className="min-w-0 lg:pr-2">
                <Panel className="!p-4">
                  <PaneLabel
                    right={
                      <div className="flex gap-2">
                        <CopyButton value={source} label="Copy" />
                        <Btn
                          variant="ghost"
                          className="!px-3 !py-2"
                          onClick={() =>
                            downloadBlob(
                              new Blob([source], { type: "text/plain;charset=utf-8" }),
                              filename || "schema.prisma",
                            )
                          }
                        >
                          Save
                        </Btn>
                      </div>
                    }
                  >
                    schema.prisma
                  </PaneLabel>
                  <CodeField
                    value={source}
                    onChange={(value) => {
                      setSource(value);
                      if (liveUpdate) setGeneratedSource(value);
                    }}
                    ariaLabel="Prisma schema"
                    errorLine={parsed.error?.line}
                    rows={22}
                  />
                </Panel>
              </div>

              {/* Drag handle — desktop only; the tabs are the mobile answer. */}
              <div
                onPointerDown={startResize}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panels"
                className="hidden w-2 shrink-0 cursor-col-resize items-center justify-center lg:flex"
              >
                <span className="h-16 w-px bg-white/15" />
              </div>

              <div className="min-w-0 flex-1 lg:pl-2">
                {schema ? (
                  <DiagramCanvas schema={schema} onSvgChange={setDiagramSvg} height="34rem" />
                ) : (
                  <Panel className="flex h-full items-center justify-center">
                    <p className="text-sm text-white/35">
                      The diagram appears once the schema parses.
                    </p>
                  </Panel>
                )}
              </div>
            </div>
          ) : null}

          {/* Diagram — full width */}
          {tab === "diagram" ? (
            <div className="mt-4">
              {schema ? (
                <>
                  <DiagramCanvas schema={schema} onSvgChange={setDiagramSvg} height="38rem" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn variant="ghost" onClick={() => setTab("plantuml")}>
                      Generate PlantUML
                    </Btn>
                    <Btn variant="ghost" onClick={() => setTab("relations")}>
                      Inspect relations
                    </Btn>
                    <Btn variant="ghost" to="/devtools/erd-generator">
                      Open SQL ER Diagram
                    </Btn>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Nothing to draw yet."
                  description="Fix the schema error above and the diagram returns."
                />
              )}
            </div>
          ) : null}

          {/* PlantUML */}
          {tab === "plantuml" ? (
            <div className="mt-4 space-y-4">
              <Panel className="!p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <PaneLabel>Templates</PaneLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        title={
                          template.renderable
                            ? "Renders locally"
                            : "Needs the PlantUML engine — preview with the remote renderer"
                        }
                        className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
                      >
                        {template.label}
                        {template.renderable ? "" : " ↗"}
                      </button>
                    ))}
                  </div>
                </div>

                {confirmTemplate ? (
                  <div className="mt-3 border border-amber-500/40 bg-amber-500/[0.06] px-4 py-3">
                    <p className="text-sm text-amber-200">
                      Replace the current PlantUML with the {confirmTemplate.label} template? Your
                      edits will be lost.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Btn
                        className="!px-3 !py-1.5"
                        onClick={() => {
                          editPlantUml(confirmTemplate.code);
                          setConfirmTemplate(null);
                        }}
                      >
                        Replace
                      </Btn>
                      <Btn
                        variant="ghost"
                        className="!px-3 !py-1.5"
                        onClick={() => setConfirmTemplate(null)}
                      >
                        Keep mine
                      </Btn>
                    </div>
                  </div>
                ) : null}
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                <Panel className="!p-4">
                  <PaneLabel
                    right={
                      <div className="flex gap-2">
                        <CopyButton value={plantUml} label="Copy" />
                        <Btn
                          variant="ghost"
                          className="!px-3 !py-2"
                          onClick={() =>
                            downloadBlob(
                              new Blob([plantUml], { type: "text/plain;charset=utf-8" }),
                              "schema.puml",
                            )
                          }
                        >
                          Save
                        </Btn>
                        {plantUmlEdited && schema ? (
                          <Btn
                            variant="ghost"
                            className="!px-3 !py-2"
                            onClick={() => {
                              setPlantUmlEdited(false);
                              setPlantUmlDraft("");
                              setRemoteUrl(null);
                            }}
                          >
                            Regenerate
                          </Btn>
                        ) : null}
                      </div>
                    }
                  >
                    PlantUML
                  </PaneLabel>
                  <CodeField
                    value={plantUml}
                    onChange={(value) => {
                      editPlantUml(value);
                    }}
                    ariaLabel="PlantUML source"
                    errorLine={plantUmlPreview.error?.line}
                    rows={22}
                  />
                </Panel>

                <Panel className="!p-4">
                  <PaneLabel
                    right={
                      <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-white/25 uppercase">
                        {plantUmlPreview.svg ? "Rendered locally" : "Preview"}
                      </span>
                    }
                  >
                    Diagram preview
                  </PaneLabel>

                  <ToolErrorPanel error={plantUmlPreview.error} />

                  {plantUmlPreview.svg ? (
                    <div
                      className="overflow-auto border border-white/[0.08] bg-[#050505]"
                      // Local render of the user's own source — never fetched.
                      dangerouslySetInnerHTML={{ __html: plantUmlPreview.svg }}
                    />
                  ) : null}

                  {plantUmlPreview.meta?.unsupported?.length ? (
                    <div className="mt-3">
                      <ToolNote>
                        Ignored by the local renderer:{" "}
                        <code>{plantUmlPreview.meta.unsupported.join(", ")}</code>. It draws entity
                        and class diagrams; other diagram types need the PlantUML engine.
                      </ToolNote>
                    </div>
                  ) : null}

                  <div className="mt-4 border-t border-white/[0.08] pt-4">
                    <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
                      Remote renderer
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      Sequence, activity and component diagrams need the PlantUML
                      engine, which only runs on a server. Using it{" "}
                      <strong className="text-white/70">sends this diagram source to
                      plantuml.com</strong> — a third party. It is off by default
                      because a schema describes your database.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn variant="ghost" className="!px-3 !py-2" onClick={renderRemotely} disabled={remoteBusy || !plantUml.trim()}>
                        {remoteBusy ? "Preparing…" : "Render on plantuml.com"}
                      </Btn>
                      {remoteUrl ? (
                        <Btn variant="ghost" className="!px-3 !py-2" href={remoteUrl}>
                          Open rendered diagram
                        </Btn>
                      ) : null}
                    </div>
                    {remoteUrl ? (
                      <p className="mt-2 font-mono text-[0.625rem] break-all text-white/30">
                        {remoteUrl}
                      </p>
                    ) : null}
                    {remoteError ? (
                      <p
                        role="alert"
                        className="mt-2 border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300"
                      >
                        {remoteError}
                      </p>
                    ) : null}
                  </div>
                </Panel>
              </div>
            </div>
          ) : null}

          {/* Relations table */}
          {tab === "relations" ? (
            <div className="mt-4">
              {schema && schema.relations.length > 0 ? (
                <Panel className="!p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          {["From", "", "To", "Kind", "Foreign key", "On delete"].map((heading, index) => (
                            <th
                              key={index}
                              className="p-3 text-left font-mono text-[0.5625rem] tracking-[0.16em] text-white/30 uppercase"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schema.relations.map((relation, index) => (
                          <tr key={index} className="border-b border-white/[0.06] last:border-0">
                            <td className="p-3 font-mono text-xs text-white/85">{relation.fromModel}</td>
                            <td className="p-3 text-center font-mono text-xs text-[#ff4d1c]">
                              {relation.kind === "one-to-many"
                                ? "1 → N"
                                : relation.kind === "one-to-one"
                                  ? "1 → 1"
                                  : "N ↔ N"}
                            </td>
                            <td className="p-3 font-mono text-xs text-white/85">{relation.toModel}</td>
                            <td className="p-3 text-xs text-white/50">{relation.kind}</td>
                            <td className="p-3 font-mono text-xs text-white/50">
                              {relation.foreignKey || "—"}
                            </td>
                            <td className="p-3 font-mono text-xs text-white/40">
                              {relation.onDelete || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ) : (
                <EmptyState
                  title="No relations found."
                  description="Relations appear once two models reference each other."
                />
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {/* Where to go next */}
      {!empty ? (
        <Panel className="mt-6">
          <PaneLabel>Related tools</PaneLabel>
          <div className="flex flex-wrap gap-2">
            {[
              { to: "/devtools/erd-generator", label: "SQL → ER Diagram" },
              { to: "/devtools/sql-to-prisma", label: "SQL → Prisma" },
              { to: "/devtools/prisma-viewer", label: "Prisma Schema Viewer" },
              { to: "/devtools/json-to-prisma", label: "JSON → Prisma" },
            ].map((entry) => (
              <Link
                key={entry.to}
                to={entry.to}
                className="border border-white/10 px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] text-white/60 uppercase transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

    </Page>
  );
}
