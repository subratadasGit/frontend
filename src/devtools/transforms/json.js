/**
 * JSON transforms.
 *
 * Every function here is pure: text in, text (or a structured result) out, so
 * the tool pages stay presentational and the logic is testable on its own.
 *
 * Parse failures are normalised into a `JsonError` carrying line, column and
 * an explanation, because "Unexpected token } in JSON at position 42" is not
 * something you can act on without counting characters by hand.
 */

/** A parse failure with the position resolved to a line and column. */
export class JsonError extends Error {
  constructor(message, { line, column, position, hint } = {}) {
    super(message);
    this.name = "JsonError";
    this.line = line;
    this.column = column;
    this.position = position;
    this.hint = hint;
  }
}

/** Turns a character offset into a 1-based line and column. */
export function positionToLineColumn(text, position) {
  const upTo = text.slice(0, Math.max(0, position));
  const lines = upTo.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

/**
 * Guesses at *why* the parse failed, from the message and the offending
 * character. Engines word these differently, so the check is on the shape of
 * the problem rather than the exact string.
 */
function explain(message, text, position) {
  const character = text[position];
  const before = text.slice(Math.max(0, position - 40), position);

  if (/unexpected end|end of (json|data|input)/i.test(message)) {
    const open = (text.match(/[[{]/g) || []).length;
    const close = (text.match(/[\]}]/g) || []).length;
    if (open > close) {
      return `The document ends while ${open - close} bracket${
        open - close === 1 ? " is" : "s are"
      } still open. Check for a missing closing } or ].`;
    }
    return "The document ends before the value is complete.";
  }
  if (character === "'" || /'/.test(before.slice(-1))) {
    return "JSON strings must use double quotes (\"), never single quotes.";
  }
  if (/,\s*[}\]]/.test(text.slice(Math.max(0, position - 20), position + 2))) {
    return "There is a trailing comma before a closing bracket, which JSON does not allow.";
  }
  if (/^[A-Za-z_$]/.test(character || "") && /[{,]\s*$/.test(before)) {
    return "Object keys must be double-quoted strings.";
  }
  if (character === undefined) {
    return "The document ended unexpectedly.";
  }
  return `Unexpected ${JSON.stringify(character)} at this position.`;
}

/** Parses JSON, raising a `JsonError` with line/column/hint on failure. */
export function parseJson(text) {
  if (!text.trim()) {
    throw new JsonError("There is nothing to parse.", { hint: "Paste some JSON to begin." });
  }
  try {
    return JSON.parse(text);
  } catch (caught) {
    const match = /position (\d+)/i.exec(caught.message);
    const position = match ? Number(match[1]) : 0;
    const { line, column } = positionToLineColumn(text, position);
    throw new JsonError(caught.message.replace(/\s*in JSON at position.*$/i, ""), {
      line,
      column,
      position,
      hint: explain(caught.message, text, position),
    });
  }
}

export const formatJson = (text, indent = 2) =>
  JSON.stringify(parseJson(text), null, indent);

export const minifyJson = (text) => JSON.stringify(parseJson(text));

/** Sorts object keys recursively — useful before diffing two documents. */
export function sortJsonKeys(value) {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJsonKeys(value[key])]),
    );
  }
  return value;
}

/* ------------------------------ Type inference ---------------------------- */

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const pascalCase = (name) =>
  name
    .replace(/[^A-Za-z0-9]+(.)?/g, (unused, character) =>
      character ? character.toUpperCase() : "",
    )
    .replace(/^[a-z]/, (character) => character.toUpperCase()) || "Root";

const singular = (name) => name.replace(/ies$/i, "y").replace(/s$/i, "");

/**
 * Walks a value and describes its shape.
 *
 * Arrays are merged across every element so a list of objects yields one
 * interface with optional markers on keys that are not present throughout,
 * rather than a union of near-identical shapes.
 */
function describe(value) {
  if (value === null) return { kind: "null" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", of: { kind: "unknown" } };
    const shapes = value.map(describe);
    return { kind: "array", of: shapes.reduce(mergeShapes) };
  }
  if (typeof value === "object") {
    const fields = {};
    for (const [key, entry] of Object.entries(value)) {
      fields[key] = { ...describe(entry), optional: false };
    }
    return { kind: "object", fields };
  }
  if (typeof value === "number") {
    return { kind: Number.isInteger(value) ? "integer" : "number" };
  }
  return { kind: typeof value };
}

/** Merges two shapes, marking keys missing from either side as optional. */
function mergeShapes(a, b) {
  if (a.kind === "null") return { ...b, nullable: true };
  if (b.kind === "null") return { ...a, nullable: true };
  if (a.kind !== b.kind) return { kind: "unknown" };

  if (a.kind === "array") return { kind: "array", of: mergeShapes(a.of, b.of) };

  if (a.kind === "object") {
    const fields = {};
    const keys = new Set([...Object.keys(a.fields), ...Object.keys(b.fields)]);
    for (const key of keys) {
      const left = a.fields[key];
      const right = b.fields[key];
      if (left && right) {
        fields[key] = { ...mergeShapes(left, right), optional: left.optional || right.optional };
      } else {
        fields[key] = { ...(left || right), optional: true };
      }
    }
    return { kind: "object", fields };
  }
  return a;
}

const TS_PRIMITIVES = {
  string: "string",
  number: "number",
  integer: "number",
  boolean: "boolean",
  null: "null",
  unknown: "unknown",
};

/** Emits TypeScript interfaces for the shape of a JSON document. */
export function jsonToTypeScript(text, rootName = "Root") {
  const shape = describe(parseJson(text));
  const interfaces = [];
  const seen = new Map();

  const render = (node, name) => {
    if (node.kind === "object") {
      const typeName = pascalCase(name);
      const body = Object.entries(node.fields)
        .map(([key, field]) => {
          const type = render(field, singular(key));
          const safeKey = IDENTIFIER.test(key) ? key : JSON.stringify(key);
          return `  ${safeKey}${field.optional ? "?" : ""}: ${type}${
            field.nullable ? " | null" : ""
          };`;
        })
        .join("\n");
      const declaration = `export interface ${typeName} {\n${body || "  [key: string]: unknown;"}\n}`;
      // Identical shapes reuse one interface instead of emitting duplicates.
      if (!seen.has(declaration)) {
        seen.set(declaration, typeName);
        interfaces.push(declaration);
        return typeName;
      }
      return seen.get(declaration);
    }
    if (node.kind === "array") {
      const inner = render(node.of, name);
      return inner.includes("|") ? `(${inner})[]` : `${inner}[]`;
    }
    return TS_PRIMITIVES[node.kind] || "unknown";
  };

  const rootType = render(shape, rootName);
  if (interfaces.length === 0) {
    return `export type ${pascalCase(rootName)} = ${rootType};`;
  }
  // The root interface is emitted last by the walk, so it reads top-down when reversed.
  const output = interfaces.reverse().join("\n\n");
  if (shape.kind === "object") return output;

  // A root array has already named its element interface after the root, so
  // the alias needs its own identifier rather than redeclaring that name.
  const rootAlias = pascalCase(rootName);
  const aliasName = rootType.startsWith(`${rootAlias}[`) ? `${rootAlias}List` : rootAlias;
  return `${output}\n\nexport type ${aliasName} = ${rootType};`;
}

const ZOD_PRIMITIVES = {
  string: "z.string()",
  number: "z.number()",
  integer: "z.number().int()",
  boolean: "z.boolean()",
  null: "z.null()",
  unknown: "z.unknown()",
};

/** Emits a Zod schema for the shape of a JSON document. */
export function jsonToZod(text, rootName = "root") {
  const shape = describe(parseJson(text));

  const render = (node, depth) => {
    const pad = "  ".repeat(depth);
    const inner = "  ".repeat(depth + 1);

    if (node.kind === "object") {
      const body = Object.entries(node.fields)
        .map(([key, field]) => {
          const safeKey = IDENTIFIER.test(key) ? key : JSON.stringify(key);
          let type = render(field, depth + 1);
          if (field.nullable) type += ".nullable()";
          if (field.optional) type += ".optional()";
          return `${inner}${safeKey}: ${type},`;
        })
        .join("\n");
      return `z.object({\n${body}\n${pad}})`;
    }
    if (node.kind === "array") return `z.array(${render(node.of, depth)})`;
    return ZOD_PRIMITIVES[node.kind] || "z.unknown()";
  };

  const name = rootName.replace(/[^A-Za-z0-9_$]/g, "") || "root";
  return `import { z } from "zod";\n\nexport const ${name}Schema = ${render(shape, 0)};\n\nexport type ${pascalCase(
    name,
  )} = z.infer<typeof ${name}Schema>;\n`;
}

const PRISMA_TYPES = {
  string: "String",
  number: "Float",
  integer: "Int",
  boolean: "Boolean",
  unknown: "Json",
  null: "Json",
};

/**
 * Emits a Prisma model from a JSON object (or the first element of an array).
 *
 * Nested objects become `Json` columns rather than relations — inferring a
 * relational split from one sample document would be guesswork, and a wrong
 * schema is worse than an honest flat one.
 */
export function jsonToPrisma(text, modelName = "Model") {
  const parsed = parseJson(text);
  const sample = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!sample || typeof sample !== "object" || Array.isArray(sample)) {
    throw new JsonError("Prisma models are generated from a JSON object.", {
      hint: "Provide an object, or an array whose first element is an object.",
    });
  }

  const shape = describe(Array.isArray(parsed) ? parsed : [parsed]).of;
  const lines = Object.entries(shape.fields).map(([key, field]) => {
    const safeKey = IDENTIFIER.test(key) ? key : `${key.replace(/[^A-Za-z0-9_]/g, "_")}`;
    let type =
      field.kind === "array" || field.kind === "object"
        ? "Json"
        : PRISMA_TYPES[field.kind] || "Json";
    if (field.optional || field.nullable) type += "?";
    const mapping = safeKey !== key ? ` @map("${key}")` : "";
    const id = key.toLowerCase() === "id" ? " @id" : "";
    return `  ${safeKey} ${type}${id}${mapping}`;
  });

  const hasId = Object.keys(shape.fields).some((key) => key.toLowerCase() === "id");
  if (!hasId) lines.unshift("  id Int @id @default(autoincrement())");

  return `model ${pascalCase(modelName)} {\n${lines.join("\n")}\n}\n`;
}

const SQL_TYPES = {
  string: "TEXT",
  number: "REAL",
  integer: "INTEGER",
  boolean: "BOOLEAN",
};

const sqlLiteral = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
};

/** Emits CREATE TABLE plus INSERTs from a JSON array of objects. */
export function jsonToSql(text, tableName = "records") {
  const parsed = parseJson(text);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length === 0 || typeof rows[0] !== "object" || rows[0] === null) {
    throw new JsonError("SQL is generated from an array of objects.", {
      hint: "Provide a JSON array whose elements are objects.",
    });
  }

  const shape = describe(rows).of;
  const table = tableName.replace(/[^A-Za-z0-9_]/g, "_") || "records";
  const columns = Object.entries(shape.fields).map(([key, field]) => {
    const name = key.replace(/[^A-Za-z0-9_]/g, "_");
    const type =
      field.kind === "array" || field.kind === "object"
        ? "TEXT"
        : SQL_TYPES[field.kind] || "TEXT";
    return { key, name, type, required: !field.optional && !field.nullable };
  });

  const create = `CREATE TABLE ${table} (\n${columns
    .map((column) => `  ${column.name} ${column.type}${column.required ? " NOT NULL" : ""}`)
    .join(",\n")}\n);`;

  const inserts = rows
    .map(
      (row) =>
        `INSERT INTO ${table} (${columns.map((c) => c.name).join(", ")}) VALUES (${columns
          .map((c) => sqlLiteral(row?.[c.key]))
          .join(", ")});`,
    )
    .join("\n");

  return `${create}\n\n${inserts}\n`;
}

/* -------------------------------- JSONPath -------------------------------- */

/**
 * Evaluates a JSONPath expression.
 *
 * Supports the subset that covers day-to-day use: `$`, dot and bracket child
 * access, `[n]`, `[start:end]`, `*` wildcards, and `..` recursive descent.
 * Filter expressions (`?(...)`) are not supported and say so rather than
 * failing silently.
 */
export function evaluateJsonPath(value, path) {
  const expression = path.trim();
  if (!expression) throw new JsonError("Enter a JSONPath expression.");
  if (expression.includes("?(")) {
    throw new JsonError("Filter expressions are not supported.", {
      hint: "This tester handles $, child access, wildcards, slices and recursive descent (..).",
    });
  }
  if (!/^\$/.test(expression)) {
    throw new JsonError("A JSONPath expression starts with $.", {
      hint: "For example: $.users[0].name",
    });
  }

  // `..` is marked before the split, because splitting on "." would otherwise
  // erase it and turn a recursive descent into an ordinary child access.
  const tokens = expression
    .slice(1)
    .replace(/\.\./g, ".**.")
    .replace(/\[(['"])(.*?)\1\]/g, ".$2")
    .replace(/\[(.*?)\]/g, ".$1")
    .split(".")
    .filter((token) => token !== "");

  const childPath = (basePath, key, parent) =>
    Array.isArray(parent) ? `${basePath}[${key}]` : `${basePath}.${key}`;

  let current = [{ path: "$", value }];
  let recursive = false;

  for (const token of tokens) {
    if (token === "**") {
      recursive = true;
      continue;
    }

    const next = [];

    const collect = (entry) => {
      const { value: node, path: nodePath } = entry;
      if (node === null || typeof node !== "object") return;
      const push = (key) => next.push({ path: childPath(nodePath, key, node), value: node[key] });

      if (token === "*") {
        Object.keys(node).forEach(push);
      } else if (/^-?\d+$/.test(token) && Array.isArray(node)) {
        const index = Number(token) < 0 ? node.length + Number(token) : Number(token);
        if (index >= 0 && index < node.length) push(index);
      } else if (/^-?\d*:-?\d*$/.test(token) && Array.isArray(node)) {
        const [fromText, toText] = token.split(":");
        const from = fromText === "" ? 0 : Number(fromText);
        const to = toText === "" ? node.length : Number(toText);
        for (let index = Math.max(0, from); index < Math.min(node.length, to); index += 1) {
          push(index);
        }
      } else if (Object.prototype.hasOwnProperty.call(node, token)) {
        push(token);
      }
    };

    // Under `..` the token is matched at this level and at every level below it.
    const walk = (entry) => {
      collect(entry);
      if (!recursive) return;
      const { value: node, path: nodePath } = entry;
      if (node === null || typeof node !== "object") return;
      Object.keys(node).forEach((key) => {
        walk({ path: childPath(nodePath, key, node), value: node[key] });
      });
    };

    current.forEach(walk);
    current = next;
    recursive = false;
  }

  return current;
}

/* ---------------------------------- Diff ---------------------------------- */

/**
 * Structural diff between two JSON documents.
 *
 * Compares by key path rather than by line, so reordered keys and reformatted
 * whitespace are correctly reported as "no change".
 */
export function diffJson(leftText, rightText) {
  const left = parseJson(leftText);
  const right = parseJson(rightText);
  const changes = [];

  const walk = (a, b, path) => {
    if (Object.is(a, b)) return;

    const aIsObject = a && typeof a === "object";
    const bIsObject = b && typeof b === "object";

    if (!aIsObject || !bIsObject || Array.isArray(a) !== Array.isArray(b)) {
      changes.push({ type: "changed", path, from: a, to: b });
      return;
    }

    if (Array.isArray(a)) {
      const length = Math.max(a.length, b.length);
      for (let index = 0; index < length; index += 1) {
        if (index >= a.length) changes.push({ type: "added", path: `${path}[${index}]`, to: b[index] });
        else if (index >= b.length) changes.push({ type: "removed", path: `${path}[${index}]`, from: a[index] });
        else walk(a[index], b[index], `${path}[${index}]`);
      }
      return;
    }

    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const child = `${path}.${key}`;
      if (!(key in a)) changes.push({ type: "added", path: child, to: b[key] });
      else if (!(key in b)) changes.push({ type: "removed", path: child, from: a[key] });
      else walk(a[key], b[key], child);
    }
  };

  walk(left, right, "$");
  return changes;
}
