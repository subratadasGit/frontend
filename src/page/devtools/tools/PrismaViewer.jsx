import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { parsePrismaSchema } from "../../../devtools/transforms/sql";

const SAMPLE = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id       Int     @id @default(autoincrement())
  title    String
  body     String?
  author   User    @relation(fields: [authorId], references: [id])
  authorId Int
}`;

/** Reads a schema.prisma as models, fields, enums and relations. */
export default function PrismaViewer({ toolId }) {
  const [source, setSource] = useState(SAMPLE);

  const { schema, error } = useMemo(() => {
    if (!source.trim()) return { schema: null, error: null };
    try {
      return { schema: parsePrismaSchema(source), error: null };
    } catch (caught) {
      return { schema: null, error: { message: caught.message } };
    }
  }, [source]);

  const summary = schema
    ? schema.models
        .map(
          (model) =>
            `${model.name}\n${model.fields.map((field) => `  ${field.name} ${field.type}${field.optional ? "?" : ""}${field.list ? "[]" : ""}`).join("\n")}`,
        )
        .join("\n\n")
    : "";

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setSource} />
                <ClearButton onClick={() => setSource("")} disabled={!source} />
              </div>
            }
          >
            schema.prisma
          </PaneLabel>
          <CodeField value={source} onChange={setSource} ariaLabel="Prisma schema" rows={20} />
        </Panel>

        <div className="space-y-4">
          <ToolErrorPanel error={error} />

          {schema ? (
            <>
              <Panel className="!p-4 sm:!p-5">
                <PaneLabel right={<CopyButton value={summary} label="Copy summary" />}>
                  Overview
                </PaneLabel>
                <div className="flex flex-wrap gap-2">
                  {schema.provider ? (
                    <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60">
                      {schema.provider}
                    </span>
                  ) : null}
                  <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60">
                    {schema.models.length} model{schema.models.length === 1 ? "" : "s"}
                  </span>
                  <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60">
                    {schema.enums.length} enum{schema.enums.length === 1 ? "" : "s"}
                  </span>
                  <span className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60">
                    {schema.relations.length} relation{schema.relations.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Panel>

              {schema.models.map((model) => (
                <Panel key={model.name} className="!p-4 sm:!p-5">
                  <PaneLabel>{model.name}</PaneLabel>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-white/[0.08] text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          {["Field", "Type", "Attributes"].map((heading) => (
                            <th
                              key={heading}
                              className="p-2.5 text-left font-mono text-[0.5625rem] tracking-[0.16em] text-white/30 uppercase"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {model.fields.map((field) => (
                          <tr key={field.name} className="border-b border-white/[0.06] last:border-0">
                            <td className="p-2.5 font-mono text-xs text-white/85">
                              {field.name}
                              {field.isId ? (
                                <span className="ml-1.5 text-[0.5625rem] text-[#ff4d1c]">PK</span>
                              ) : null}
                            </td>
                            <td className="p-2.5 font-mono text-xs text-white/60">
                              {field.type}
                              {field.list ? "[]" : ""}
                              {field.optional ? "?" : ""}
                            </td>
                            <td className="p-2.5 font-mono text-[0.625rem] break-all text-white/35">
                              {field.attributes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ))}

              {schema.enums.length > 0 ? (
                <Panel className="!p-4 sm:!p-5">
                  <PaneLabel>Enums</PaneLabel>
                  <div className="space-y-3">
                    {schema.enums.map((entry) => (
                      <div key={entry.name}>
                        <p className="font-mono text-sm text-[#ff4d1c]">{entry.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {entry.values.map((value) => (
                            <span
                              key={value}
                              className="border border-white/10 px-2 py-0.5 font-mono text-[0.625rem] text-white/60"
                            >
                              {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              ) : null}

              <ToolNote>
                Parsed with a lightweight reader, not the Prisma engine — it
                covers models, fields, attributes and enums, which is what a
                schema review needs. It does not validate the schema.
              </ToolNote>
            </>
          ) : null}
        </div>
      </div>

      <RelatedTools ids={["erd-generator", "sql-to-prisma", "json-to-prisma"]} />
    </DevToolPage>
  );
}
