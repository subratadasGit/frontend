/**
 * Prisma schema parsing, relation inference and layout.
 *
 * Everything here is pure and runs in the browser — a schema describes your
 * database, so it never leaves the page.
 *
 * The parser is written against the parts of the Prisma schema language that
 * describe *shape*: models, fields, types, attributes, enums and relations.
 * It deliberately does not evaluate `generator`/`datasource` blocks beyond
 * reading the provider, and it is not a validator — Prisma itself does that
 * far better. What it does do is report where it could not understand
 * something, with a line number, rather than failing silently.
 */

/** A parse failure carrying the position and a readable explanation. */
export class PrismaParseError extends Error {
  constructor(message, { line, column, cause, hint } = {}) {
    super(message);
    this.name = "PrismaParseError";
    this.line = line;
    this.column = column;
    this.hint = hint;
    this.cause = cause;
  }
}

/* --------------------------------- Scanner -------------------------------- */

/** Strips comments but keeps line numbering intact for error reporting. */
function stripComments(source) {
  return source
    .split("\n")
    .map((line) => {
      // `//` starts a comment unless it is inside a string literal.
      let inString = false;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') inString = !inString;
        if (!inString && character === "/" && line[index + 1] === "/") {
          return line.slice(0, index);
        }
      }
      return line;
    })
    .join("\n");
}

/** Finds the block that opens at `openIndex`, respecting nesting. */
function readBlock(text, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    else if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return { body: text.slice(openIndex + 1, index), end: index };
    }
  }
  return null;
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/**
 * Splits attributes off a field line.
 *
 * Attribute arguments can contain spaces, brackets and commas
 * (`@relation(fields: [authorId], references: [id])`), so the split walks the
 * string rather than using a regex.
 */
function splitAttributes(rest) {
  const attributes = [];
  let index = 0;

  while (index < rest.length) {
    if (rest[index] !== "@") {
      index += 1;
      continue;
    }
    const start = index;
    index += 1;
    if (rest[index] === "@") index += 1; // block attribute
    while (index < rest.length && /[\w.]/.test(rest[index])) index += 1;

    if (rest[index] === "(") {
      let depth = 0;
      while (index < rest.length) {
        if (rest[index] === "(") depth += 1;
        else if (rest[index] === ")") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        }
        index += 1;
      }
    }
    attributes.push(rest.slice(start, index).trim());
  }

  return attributes;
}

/** Pulls a bracketed list out of an attribute: `fields: [a, b]` → ["a","b"]. */
const listArgument = (attribute, name) => {
  const match = new RegExp(`${name}\\s*:\\s*\\[([^\\]]*)\\]`).exec(attribute);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const SCALAR_TYPES = new Set([
  "String", "Boolean", "Int", "BigInt", "Float", "Decimal",
  "DateTime", "Json", "Bytes", "Unsupported",
]);

/* --------------------------------- Parser --------------------------------- */

/**
 * Parses a Prisma schema into models, enums and relations.
 *
 * Returns `{ models, enums, relations, provider, warnings }`. Structural
 * problems throw a `PrismaParseError` with a line number; things that are
 * merely suspicious (a relation pointing at an unknown model) come back as
 * warnings so the diagram still renders.
 */
export function parsePrismaSchema(source) {
  if (!source || !source.trim()) {
    throw new PrismaParseError("There is no schema to parse.", {
      hint: "Paste a Prisma schema or upload a schema.prisma file.",
    });
  }

  const text = stripComments(source);
  const models = [];
  const enums = [];
  const warnings = [];

  const provider = (/provider\s*=\s*"([^"]+)"/.exec(text) || [])[1] || null;

  /* Enums first, so field types can be recognised as enum references. */
  const enumPattern = /\benum\s+(\w+)\s*\{/g;
  let match;
  while ((match = enumPattern.exec(text)) !== null) {
    const block = readBlock(text, enumPattern.lastIndex - 1);
    if (!block) {
      throw new PrismaParseError(`The enum "${match[1]}" is missing its closing brace.`, {
        line: lineOf(text, match.index),
        hint: "Every enum block must be closed with }.",
      });
    }
    enums.push({
      name: match[1],
      values: block.body
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("@@")),
      line: lineOf(text, match.index),
    });
    enumPattern.lastIndex = block.end;
  }

  const enumNames = new Set(enums.map((entry) => entry.name));

  /* Models. */
  const modelPattern = /\bmodel\s+(\w+)\s*\{/g;
  while ((match = modelPattern.exec(text)) !== null) {
    const modelName = match[1];
    const modelLine = lineOf(text, match.index);
    const block = readBlock(text, modelPattern.lastIndex - 1);

    if (!block) {
      throw new PrismaParseError(`The model "${modelName}" is missing its closing brace.`, {
        line: modelLine,
        hint: "Every model block must be closed with }.",
      });
    }
    modelPattern.lastIndex = block.end;

    const fields = [];
    const blockAttributes = [];
    const bodyStart = match.index + match[0].length;

    block.body.split("\n").forEach((rawLine, offset) => {
      const line = rawLine.trim();
      if (!line) return;

      const lineNumber = lineOf(text, bodyStart) + offset;

      if (line.startsWith("@@")) {
        blockAttributes.push(line);
        return;
      }

      // name  Type[]?  @attributes…
      const fieldMatch = /^(\w+)\s+([\w.]+)(\[\])?(\?)?\s*(.*)$/.exec(line);
      if (!fieldMatch) {
        warnings.push({
          line: lineNumber,
          message: `Could not read "${line}" as a field — it was skipped.`,
        });
        return;
      }

      const [, name, type, array, optional, rest] = fieldMatch;
      const attributes = splitAttributes(rest || "");
      const relationAttribute = attributes.find((entry) => entry.startsWith("@relation"));

      fields.push({
        name,
        type,
        isArray: Boolean(array),
        isOptional: Boolean(optional),
        isId: attributes.some((entry) => /^@id\b/.test(entry)),
        isUnique: attributes.some((entry) => /^@unique\b/.test(entry)),
        isUpdatedAt: attributes.some((entry) => /^@updatedAt\b/.test(entry)),
        default: (/@default\(([\s\S]*)\)\s*$/.exec(attributes.find((entry) => entry.startsWith("@default")) || "") || [])[1] || null,
        dbName: (/@map\("([^"]+)"\)/.exec(rest || "") || [])[1] || null,
        relation: relationAttribute
          ? {
              name: (/@relation\(\s*"([^"]+)"/.exec(relationAttribute) || [])[1] || null,
              fields: listArgument(relationAttribute, "fields") || [],
              references: listArgument(relationAttribute, "references") || [],
              onDelete: (/onDelete\s*:\s*(\w+)/.exec(relationAttribute) || [])[1] || null,
            }
          : null,
        attributes,
        isScalar: SCALAR_TYPES.has(type),
        isEnum: enumNames.has(type),
        line: lineNumber,
      });
    });

    // @@id / @@unique mark fields that carry no inline attribute.
    blockAttributes.forEach((attribute) => {
      const compoundId = listArgument(attribute, "") || /@@id\(\s*\[([^\]]*)\]/.exec(attribute);
      if (/^@@id\b/.test(attribute)) {
        const names = (/\[([^\]]*)\]/.exec(attribute) || [])[1];
        names?.split(",").map((entry) => entry.trim()).forEach((fieldName) => {
          const field = fields.find((entry) => entry.name === fieldName);
          if (field) field.isId = true;
        });
      }
      if (/^@@unique\b/.test(attribute)) {
        const names = (/\[([^\]]*)\]/.exec(attribute) || [])[1];
        names?.split(",").map((entry) => entry.trim()).forEach((fieldName) => {
          const field = fields.find((entry) => entry.name === fieldName);
          if (field) field.isUnique = true;
        });
      }
      void compoundId;
    });

    models.push({
      name: modelName,
      fields,
      blockAttributes,
      dbName: (/@@map\("([^"]+)"\)/.exec(blockAttributes.join(" ")) || [])[1] || null,
      line: modelLine,
    });
  }

  if (models.length === 0 && enums.length === 0) {
    throw new PrismaParseError("No models or enums were found in this schema.", {
      hint: "A Prisma schema needs at least one `model Name { … }` block.",
    });
  }

  const modelNames = new Set(models.map((model) => model.name));

  /* Mark relation-scalar fields (the foreign keys) so they render as 🔗. */
  models.forEach((model) => {
    model.fields.forEach((field) => {
      if (!field.relation) return;
      field.relation.fields.forEach((fkName) => {
        const fk = model.fields.find((entry) => entry.name === fkName);
        if (fk) {
          fk.isForeignKey = true;
          fk.pointsTo = { model: field.type, field: field.relation.references[0] };
        } else {
          warnings.push({
            line: field.line,
            message: `Relation field "${field.name}" references "${fkName}", which is not a field on ${model.name}.`,
          });
        }
      });
      if (!modelNames.has(field.type) && !enumNames.has(field.type) && !field.isScalar) {
        warnings.push({
          line: field.line,
          message: `"${field.name}" has type ${field.type}, which is not a model or enum in this schema.`,
        });
      }
    });
  });

  const relations = inferRelations(models, modelNames);

  return { models, enums, relations, provider, warnings };
}

/* ------------------------------- Relations -------------------------------- */

/**
 * Works out the cardinality of every relation.
 *
 * Prisma expresses a relation as a pair of fields, one on each model. The side
 * that carries `@relation(fields: …)` owns the foreign key; the other side is
 * the back-reference. From the two sides' list/optional markers:
 *
 *   A.b: B[]   ↔ B.a: A       → one-to-many  (A has many B)
 *   A.b: B?    ↔ B.a: A       → one-to-one
 *   A.b: B[]   ↔ B.a: A[]     → many-to-many (implicit join table)
 *
 * A relation whose other side is missing is still drawn, using the owning
 * side's markers alone, because a half-declared relation is exactly the thing
 * a diagram should make visible.
 */
function inferRelations(models, modelNames) {
  const relations = [];
  const seen = new Set();

  const relationFields = [];
  models.forEach((model) => {
    model.fields.forEach((field) => {
      if (modelNames.has(field.type)) {
        relationFields.push({ model, field });
      }
    });
  });

  relationFields.forEach(({ model, field }) => {
    // Find the field on the other model that points back here. When several
    // could match, the `@relation("name")` label disambiguates — which is why
    // Prisma requires it for multiple relations between the same two models.
    const target = models.find((entry) => entry.name === field.type);
    if (!target) return;

    const candidates = target.fields.filter((entry) => entry.type === model.name);
    const back =
      candidates.find(
        (entry) => (entry.relation?.name || null) === (field.relation?.name || null),
      ) || candidates[0];

    const key = [
      `${model.name}.${field.name}`,
      back ? `${target.name}.${back.name}` : "",
    ]
      .sort()
      .join("|");
    if (seen.has(key)) return;
    seen.add(key);

    // The owning side is the one with the foreign key.
    const owner = field.relation?.fields?.length ? { model, field } : back?.relation?.fields?.length ? { model: target, field: back } : { model, field };
    const other = owner.model === model ? { model: target, field: back } : { model, field };

    let kind;
    if (field.isArray && back?.isArray) kind = "many-to-many";
    else if (!field.isArray && !back?.isArray && back) kind = "one-to-one";
    else kind = "one-to-many";

    // For one-to-many the "one" end is the model being pointed at.
    const fromModel = kind === "one-to-many" ? (field.isArray ? model.name : target.name) : owner.model.name;
    const toModel = kind === "one-to-many" ? (field.isArray ? target.name : model.name) : other.model?.name || target.name;

    relations.push({
      kind,
      label: field.relation?.name || back?.relation?.name || null,
      fromModel,
      toModel,
      // The field that physically holds the key, when there is one.
      foreignKey: owner.field?.relation?.fields?.[0] || null,
      references: owner.field?.relation?.references?.[0] || null,
      ownerModel: owner.model.name,
      ownerField: owner.field?.name || null,
      backField: other.field?.name || null,
      optional: Boolean(field.isOptional || back?.isOptional),
      onDelete: owner.field?.relation?.onDelete || null,
      // Anchors for drawing: the row each end should attach to.
      fromField: kind === "one-to-many" ? (field.isArray ? field.name : back?.name) : owner.field?.name,
      toField: owner.field?.relation?.fields?.[0] || other.field?.name || null,
    });
  });

  return relations;
}

/* ---------------------------------- Layout -------------------------------- */

export const ROW_HEIGHT = 24;
export const HEADER_HEIGHT = 38;
export const NODE_WIDTH = 260;
const COLLAPSED_HEIGHT = HEADER_HEIGHT + 10;

const nodeHeight = (model, collapsed) =>
  collapsed ? COLLAPSED_HEIGHT : HEADER_HEIGHT + model.fields.length * ROW_HEIGHT + 10;

/**
 * Places models on a canvas.
 *
 * A layered layout: models with no outgoing foreign key go in the first
 * column, everything they point at goes in the next, and so on. That puts
 * parents left of children, which is how people read an ER diagram, and it
 * keeps related tables near each other without a force simulation.
 *
 * Positions already in `positions` (because the user dragged that model) are
 * kept, so re-laying out never throws away manual placement.
 */
export function layoutSchema(
  schema,
  { positions = {}, collapsed = {}, gapX = 110, gapY = 50, maxColumnHeight = 900 } = {},
) {
  const { models, relations } = schema;

  // Depth = how far a model is downstream of a model with no foreign keys.
  const dependsOn = new Map(models.map((model) => [model.name, new Set()]));
  relations.forEach((relation) => {
    // The model holding the foreign key depends on the one it references.
    const owner = relation.ownerModel;
    const referenced = owner === relation.fromModel ? relation.toModel : relation.fromModel;
    if (owner !== referenced) dependsOn.get(owner)?.add(referenced);
  });

  const depth = new Map();
  const resolve = (name, guard = new Set()) => {
    if (depth.has(name)) return depth.get(name);
    if (guard.has(name)) return 0; // cycle — break it rather than recurse forever
    guard.add(name);
    const parents = [...(dependsOn.get(name) || [])];
    const value = parents.length === 0 ? 0 : Math.max(...parents.map((parent) => resolve(parent, guard) + 1));
    depth.set(name, value);
    return value;
  };
  models.forEach((model) => resolve(model.name));

  const columns = new Map();
  models.forEach((model) => {
    const level = depth.get(model.name) || 0;
    if (!columns.has(level)) columns.set(level, []);
    columns.get(level).push(model);
  });

  /*
   * Place each depth level in its own band of columns.
   *
   * A level can hold many models — a schema with no relations puts everything
   * at depth 0 — so a level wraps into as many sub-columns as it needs to stay
   * under `maxColumnHeight`. Without that, twenty unrelated models become one
   * strip four thousand pixels tall, which is unusable on screen and turns
   * into twenty PDF pages.
   */
  const nodes = [];
  let cursorX = 40;

  [...columns.keys()]
    .sort((a, b) => a - b)
    .forEach((level) => {
      const group = columns.get(level);
      const heights = group.map((model) => nodeHeight(model, collapsed[model.name]) + gapY);
      const total = heights.reduce((sum, value) => sum + value, 0);

      // Aim for a roughly square band rather than a hard row count, so a level
      // with two models stays a single column and one with twenty spreads out.
      const subColumns = Math.max(1, Math.ceil(total / maxColumnHeight));
      const target = total / subColumns;

      let y = 40;
      let usedInColumn = 0;
      let subColumn = 0;
      let widest = 0;

      group.forEach((model, index) => {
        if (usedInColumn > 0 && usedInColumn + heights[index] > target * 1.15) {
          subColumn += 1;
          y = 40;
          usedInColumn = 0;
        }

        const manual = positions[model.name];
        const x = cursorX + subColumn * (NODE_WIDTH + gapX);
        nodes.push({
          ...model,
          collapsed: Boolean(collapsed[model.name]),
          x: manual?.x ?? x,
          y: manual?.y ?? y,
          width: NODE_WIDTH,
          height: heights[index] - gapY,
        });

        widest = Math.max(widest, subColumn);
        y += heights[index];
        usedInColumn += heights[index];
      });

      cursorX += (widest + 1) * (NODE_WIDTH + gapX);
    });

  const byName = new Map(nodes.map((node) => [node.name, node]));

  const edges = relations
    .map((relation, index) => {
      const from = byName.get(relation.fromModel);
      const to = byName.get(relation.toModel);
      if (!from || !to) return null;

      const anchor = (node, fieldName) => {
        if (node.collapsed || !fieldName) return node.y + HEADER_HEIGHT / 2;
        const position = node.fields.findIndex((field) => field.name === fieldName);
        if (position < 0) return node.y + HEADER_HEIGHT / 2;
        return node.y + HEADER_HEIGHT + position * ROW_HEIGHT + ROW_HEIGHT / 2;
      };

      return {
        id: `${relation.fromModel}-${relation.toModel}-${index}`,
        ...relation,
        from,
        to,
        y1: anchor(from, relation.fromField),
        y2: anchor(to, relation.toField),
      };
    })
    .filter(Boolean);

  // Sized to the content plus a margin. No artificial minimum: padding a small
  // diagram out to a fixed canvas skews its aspect ratio, which then misleads
  // every consumer that reasons about shape — the PDF exporter decides whether
  // to tile from exactly this number.
  const width = Math.max(...nodes.map((node) => node.x + node.width), 0) + 40;
  const height = Math.max(...nodes.map((node) => node.y + node.height), 0) + 40;

  return { nodes, edges, width, height };
}

/* ------------------------------ Prisma → PlantUML -------------------------- */

const CARDINALITY = {
  "one-to-many": "||--o{",
  "one-to-one": "||--||",
  "many-to-many": "}o--o{",
};

/**
 * Emits a PlantUML entity diagram for a parsed schema.
 *
 * Uses the `entity` syntax rather than `class`, because that is what reads as
 * a database diagram — primary keys above the separator, the rest below.
 */
export function prismaToPlantUml(schema, { includeEnums = true, theme = true } = {}) {
  const lines = ["@startuml", ""];

  if (theme) {
    lines.push(
      "hide circle",
      "skinparam linetype ortho",
      "skinparam backgroundColor #050505",
      "skinparam defaultFontColor #FFFFFF",
      "skinparam entity {",
      "  BackgroundColor #0A0A0A",
      "  BorderColor #FF4D1C",
      "  FontColor #FFFFFF",
      "}",
      "skinparam ArrowColor #FF4D1C",
      "",
    );
  }

  schema.models.forEach((model) => {
    lines.push(`entity "${model.name}" as ${model.name} {`);

    const keys = model.fields.filter((field) => field.isId);
    const rest = model.fields.filter(
      (field) => !field.isId && !schema.models.some((entry) => entry.name === field.type),
    );

    keys.forEach((field) => {
      lines.push(`  * ${field.name} : ${field.type}${field.isArray ? "[]" : ""}`);
    });
    if (keys.length > 0) lines.push("  --");

    rest.forEach((field) => {
      const markers = [
        field.isForeignKey ? "<<FK>>" : "",
        field.isUnique ? "<<unique>>" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const optional = field.isOptional ? "" : "* ";
      lines.push(
        `  ${optional}${field.name} : ${field.type}${field.isArray ? "[]" : ""}${markers ? ` ${markers}` : ""}`,
      );
    });

    lines.push("}", "");
  });

  if (includeEnums) {
    schema.enums.forEach((entry) => {
      lines.push(`enum ${entry.name} {`);
      entry.values.forEach((value) => lines.push(`  ${value}`));
      lines.push("}", "");
    });
  }

  schema.relations.forEach((relation) => {
    const arrow = CARDINALITY[relation.kind] || "||--o{";
    const label = relation.label ? ` : ${relation.label}` : relation.foreignKey ? ` : ${relation.foreignKey}` : "";
    lines.push(`${relation.fromModel} ${arrow} ${relation.toModel}${label}`);
  });

  lines.push("", "@enduml");
  return lines.join("\n");
}

/** Counts used by the workspace header and the PDF metadata block. */
export function schemaStats(schema) {
  const fieldCount = schema.models.reduce((total, model) => total + model.fields.length, 0);
  return {
    models: schema.models.length,
    enums: schema.enums.length,
    relations: schema.relations.length,
    fields: fieldCount,
    oneToOne: schema.relations.filter((entry) => entry.kind === "one-to-one").length,
    oneToMany: schema.relations.filter((entry) => entry.kind === "one-to-many").length,
    manyToMany: schema.relations.filter((entry) => entry.kind === "many-to-many").length,
  };
}
