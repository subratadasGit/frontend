/**
 * SQL formatting and schema transforms.
 *
 * `sql-formatter` handles the pretty-printing — it is a focused, well-tested
 * library and a hand-rolled SQL tokeniser would be the wrong kind of clever.
 * It is loaded lazily so it only costs bytes on the database pages.
 *
 * The schema parsing below reads `CREATE TABLE` statements. It is a pragmatic
 * parser, not a full SQL grammar: it understands column definitions, primary
 * keys, foreign keys, NOT NULL, UNIQUE and DEFAULT across the MySQL/Postgres/
 * SQLite dialects people paste. Statements it does not recognise are reported
 * rather than silently dropped.
 */

let formatterPromise = null;
const getFormatter = () => {
  if (!formatterPromise) formatterPromise = import("sql-formatter");
  return formatterPromise;
};

export const SQL_DIALECTS = [
  { id: "sql", label: "Standard SQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL" },
  { id: "sqlite", label: "SQLite" },
  { id: "mariadb", label: "MariaDB" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "tsql", label: "SQL Server" },
];

/** Pretty-prints SQL for the chosen dialect. */
export async function formatSql(sql, { dialect = "sql", uppercase = true, tabWidth = 2 } = {}) {
  if (!sql.trim()) throw new Error("There is nothing to format.");
  const { format } = await getFormatter();
  try {
    return format(sql, { language: dialect, keywordCase: uppercase ? "upper" : "preserve", tabWidth });
  } catch (caught) {
    throw new Error(caught?.message || "This SQL could not be parsed.", { cause: caught });
  }
}

export const minifySql = (sql) =>
  sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([(),;])\s*/g, "$1 ")
    .trim();

/**
 * Structural checks, not a full parser.
 *
 * Catches the errors that actually stop a statement running — unbalanced
 * parentheses or quotes, a missing FROM, a stray trailing comma — and says so
 * plainly rather than claiming to validate the whole grammar.
 */
export function validateSql(sql) {
  const issues = [];
  if (!sql.trim()) throw new Error("There is nothing to validate.");

  // Strip comments and string literals so their contents cannot trip the checks.
  const stripped = sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:""|[^"])*"/g, '""');

  const open = (stripped.match(/\(/g) || []).length;
  const close = (stripped.match(/\)/g) || []).length;
  if (open !== close) {
    issues.push({
      level: "error",
      message: `Unbalanced parentheses — ${open} opening and ${close} closing.`,
    });
  }

  const singleQuotes = (sql.replace(/''/g, "").match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    issues.push({ level: "error", message: "Unbalanced single quote in a string literal." });
  }

  const statements = stripped.split(";").map((part) => part.trim()).filter(Boolean);
  statements.forEach((statement, index) => {
    const label = statements.length > 1 ? `Statement ${index + 1}: ` : "";
    const first = statement.split(/\s+/)[0]?.toUpperCase();

    if (!/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|TRUNCATE|EXPLAIN|GRANT|REVOKE|BEGIN|COMMIT|ROLLBACK|SET|USE|PRAGMA)$/.test(first || "")) {
      issues.push({ level: "error", message: `${label}starts with "${first}", which is not a SQL statement keyword.` });
    }
    if (first === "SELECT" && !/\bFROM\b/i.test(statement) && !/^SELECT\s+[\d'"]/i.test(statement)) {
      issues.push({ level: "warning", message: `${label}SELECT without a FROM clause.` });
    }
    if (first === "UPDATE" && !/\bWHERE\b/i.test(statement)) {
      issues.push({ level: "warning", message: `${label}UPDATE without a WHERE clause updates every row.` });
    }
    if (first === "DELETE" && !/\bWHERE\b/i.test(statement)) {
      issues.push({ level: "warning", message: `${label}DELETE without a WHERE clause removes every row.` });
    }
    if (/,\s*(FROM|WHERE|\))/i.test(statement)) {
      issues.push({ level: "error", message: `${label}trailing comma before FROM, WHERE or a closing bracket.` });
    }
  });

  return { issues, statements: statements.length };
}

/* ------------------------------ Schema parsing ----------------------------- */

const stripQuotes = (name) => name.replace(/^[`"[]|[`"\]]$/g, "").trim();

/** Splits a column list on commas that are not inside parentheses. */
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const character of body) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Extracts the balanced parenthesised block that starts at `from`.
 *
 * A regex cannot do this: `\(([\s\S]*?)\)` stops at the first closing paren,
 * which is the one inside `VARCHAR(255)`, and everything after it — including
 * the FOREIGN KEY clauses — is silently lost.
 */
function readBalanced(text, from) {
  let depth = 0;
  for (let index = from; index < text.length; index += 1) {
    const character = text[index];
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return { body: text.slice(from + 1, index), end: index };
    }
  }
  return null;
}

/* Types whose name is more than one word, so the parser does not mistake the
   second word for a constraint (or `PRIMARY` for part of the type). */
const MULTI_WORD_TYPES = [
  "DOUBLE PRECISION", "CHARACTER VARYING", "CHARACTER LARGE OBJECT",
  "BIT VARYING", "TIME WITH TIME ZONE", "TIME WITHOUT TIME ZONE",
  "TIMESTAMP WITH TIME ZONE", "TIMESTAMP WITHOUT TIME ZONE",
  "UNSIGNED BIG INT",
];

/** Splits a column definition into its name, its type and the rest. */
function splitColumn(definition) {
  const nameMatch = /^([`"[\]\w]+)\s+([\s\S]*)$/.exec(definition.trim());
  if (!nameMatch) return null;

  const remainder = nameMatch[2].trim();
  const upper = remainder.toUpperCase();

  let type = null;
  const multi = MULTI_WORD_TYPES.find((candidate) => upper.startsWith(candidate));
  if (multi) {
    type = remainder.slice(0, multi.length);
  } else {
    const single = /^([A-Za-z_]\w*)/.exec(remainder);
    if (!single) return null;
    type = single[1];
  }

  let rest = remainder.slice(type.length);
  // Length/precision arguments belong to the type, not to the constraints.
  const args = /^\s*\(([^)]*)\)/.exec(rest);
  if (args) {
    type += `(${args[1].trim()})`;
    rest = rest.slice(args[0].length);
  }

  return { name: stripQuotes(nameMatch[1]), type: type.replace(/\s+/g, " "), rest };
}

/** Parses every `CREATE TABLE` in a script into tables, columns and relations. */
export function parseSqlSchema(sql) {
  if (!sql.trim()) throw new Error("Paste a schema containing CREATE TABLE statements.");

  const clean = sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const tables = [];
  const relations = [];

  const header = /CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"[\]\w.]+)\s*\(/gi;
  let match;

  while ((match = header.exec(clean)) !== null) {
    const tableName = stripQuotes(match[1].split(".").pop());
    const block = readBalanced(clean, header.lastIndex - 1);
    if (!block) continue;
    // Continue scanning after this table's own closing bracket.
    header.lastIndex = block.end;

    const columns = [];

    for (const definition of splitTopLevel(block.body)) {
      const upper = definition.toUpperCase();

      // Table-level constraints rather than a column.
      if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|KEY|INDEX|CONSTRAINT|CHECK)\b/.test(upper)) {
        const primary = /PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(definition);
        if (primary) {
          primary[1].split(",").map(stripQuotes).forEach((name) => {
            const column = columns.find((entry) => entry.name === name);
            if (column) {
              column.primaryKey = true;
              column.nullable = false;
            }
          });
        }

        const foreign = /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"[\]\w.]+)\s*\(([^)]+)\)/i.exec(definition);
        if (foreign) {
          const from = stripQuotes(foreign[1].split(",")[0]);
          const toTable = stripQuotes(foreign[2].split(".").pop());
          const toColumn = stripQuotes(foreign[3].split(",")[0]);
          relations.push({ fromTable: tableName, fromColumn: from, toTable, toColumn });
          const column = columns.find((entry) => entry.name === from);
          if (column) column.references = { table: toTable, column: toColumn };
        }

        const unique = /^UNIQUE\s*(?:KEY\s+\S+\s*)?\(([^)]+)\)/i.exec(definition);
        if (unique) {
          unique[1].split(",").map(stripQuotes).forEach((name) => {
            const column = columns.find((entry) => entry.name === name);
            if (column) column.unique = true;
          });
        }
        continue;
      }

      const parsed = splitColumn(definition);
      if (!parsed) continue;

      const rest = parsed.rest || "";
      const restUpper = rest.toUpperCase();
      const inlineReference = /REFERENCES\s+([`"[\]\w.]+)\s*\(([^)]+)\)/i.exec(rest);

      const column = {
        name: parsed.name,
        type: parsed.type,
        nullable: !/NOT\s+NULL/.test(restUpper),
        primaryKey: /PRIMARY\s+KEY/.test(restUpper),
        unique: /\bUNIQUE\b/.test(restUpper),
        autoIncrement: /AUTO_?INCREMENT|IDENTITY/i.test(rest) || /^(SERIAL|BIGSERIAL)/i.test(parsed.type),
        default: (/DEFAULT\s+('[^']*'|[^\s,]+)/i.exec(rest) || [])[1] || null,
      };

      if (inlineReference) {
        const toTable = stripQuotes(inlineReference[1].split(".").pop());
        const toColumn = stripQuotes(inlineReference[2].split(",")[0]);
        column.references = { table: toTable, column: toColumn };
        relations.push({ fromTable: tableName, fromColumn: column.name, toTable, toColumn });
      }

      if (column.primaryKey) column.nullable = false;
      columns.push(column);
    }

    tables.push({ name: tableName, columns });
  }

  if (tables.length === 0) {
    throw new Error(
      "No CREATE TABLE statements were found. This reads table definitions, not queries.",
    );
  }

  return { tables, relations };
}

/* ------------------------------ SQL → Prisma ------------------------------- */

const PRISMA_TYPE_MAP = [
  { pattern: /^(BIGINT|BIGSERIAL)/i, type: "BigInt" },
  { pattern: /^(INT|INTEGER|SMALLINT|TINYINT|MEDIUMINT|SERIAL)/i, type: "Int" },
  { pattern: /^(DECIMAL|NUMERIC)/i, type: "Decimal" },
  { pattern: /^(FLOAT|DOUBLE|REAL)/i, type: "Float" },
  { pattern: /^(BOOL|BOOLEAN|BIT)/i, type: "Boolean" },
  { pattern: /^(TIMESTAMP|DATETIME)/i, type: "DateTime" },
  { pattern: /^DATE/i, type: "DateTime" },
  { pattern: /^TIME/i, type: "DateTime" },
  { pattern: /^(JSON|JSONB)/i, type: "Json" },
  { pattern: /^(BLOB|BYTEA|BINARY|VARBINARY)/i, type: "Bytes" },
  { pattern: /^UUID/i, type: "String" },
];

const pascal = (name) =>
  name
    .replace(/[^A-Za-z0-9]+(.)?/g, (unused, character) => (character ? character.toUpperCase() : ""))
    .replace(/^[a-z]/, (character) => character.toUpperCase());

const prismaType = (sqlType) =>
  PRISMA_TYPE_MAP.find((entry) => entry.pattern.test(sqlType))?.type || "String";

/** Converts parsed tables into a Prisma schema, including relation fields. */
export function sqlToPrisma(sql) {
  const { tables, relations } = parseSqlSchema(sql);

  const models = tables.map((table) => {
    const modelName = pascal(table.name);
    const lines = table.columns.map((column) => {
      let type = prismaType(column.type);
      if (column.nullable && !column.primaryKey) type += "?";

      const attributes = [];
      if (column.primaryKey) attributes.push("@id");
      if (column.autoIncrement && type.startsWith("Int")) attributes.push("@default(autoincrement())");
      else if (column.default) {
        const value = column.default.replace(/^'|'$/g, "");
        if (/^(CURRENT_TIMESTAMP|NOW\(\))$/i.test(column.default)) attributes.push("@default(now())");
        else if (type.startsWith("Boolean")) attributes.push(`@default(${/^(1|true)$/i.test(value)})`);
        else if (type.startsWith("Int") || type.startsWith("Float")) attributes.push(`@default(${value})`);
        else if (!/^NULL$/i.test(value)) attributes.push(`@default("${value}")`);
      }
      if (column.unique && !column.primaryKey) attributes.push("@unique");

      const fieldName = column.name;
      const mapped = fieldName !== column.name ? ` @map("${column.name}")` : "";
      return `  ${fieldName} ${type}${attributes.length ? ` ${attributes.join(" ")}` : ""}${mapped}`;
    });

    // Relation fields for outgoing foreign keys...
    relations
      .filter((relation) => relation.fromTable === table.name)
      .forEach((relation) => {
        const target = pascal(relation.toTable);
        lines.push(
          `  ${relation.toTable} ${target}? @relation(fields: [${relation.fromColumn}], references: [${relation.toColumn}])`,
        );
      });

    // ...and the back-reference on the other side.
    relations
      .filter((relation) => relation.toTable === table.name)
      .forEach((relation) => {
        const source = pascal(relation.fromTable);
        lines.push(`  ${relation.fromTable}s ${source}[]`);
      });

    const hasId = table.columns.some((column) => column.primaryKey);
    if (!hasId) {
      lines.unshift("  // No PRIMARY KEY found — Prisma requires one.");
    }

    return `model ${modelName} {\n${lines.join("\n")}\n\n  @@map("${table.name}")\n}`;
  });

  return `// Generated from CREATE TABLE statements.\n// Review types and relations before using — see the notes in the tool.\n\n${models.join(
    "\n\n",
  )}\n`;
}

/* ---------------------------- Prisma schema reader ------------------------- */

/** Parses a `schema.prisma` into models, fields, enums and datasource info. */
export function parsePrismaSchema(source) {
  if (!source.trim()) throw new Error("Paste a Prisma schema.");

  const models = [];
  const enums = [];

  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = modelPattern.exec(source)) !== null) {
    const fields = [];
    for (const rawLine of match[2].split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
      const fieldMatch = /^(\w+)\s+(\S+)(.*)$/.exec(line);
      if (!fieldMatch) continue;
      const type = fieldMatch[2];
      const attributes = (fieldMatch[3] || "").trim();
      fields.push({
        name: fieldMatch[1],
        type: type.replace(/[?[\]]/g, ""),
        optional: type.endsWith("?"),
        list: type.includes("[]"),
        isId: /@id\b/.test(attributes),
        unique: /@unique\b/.test(attributes),
        relation: /@relation\b/.test(attributes),
        default: (/@default\(([^)]*)\)/.exec(attributes) || [])[1] || null,
        attributes,
      });
    }
    models.push({ name: match[1], fields });
  }

  const enumPattern = /enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  while ((match = enumPattern.exec(source)) !== null) {
    enums.push({
      name: match[1],
      values: match[2]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//")),
    });
  }

  const provider = (/provider\s*=\s*"([^"]+)"/.exec(source) || [])[1] || null;

  if (models.length === 0 && enums.length === 0) {
    throw new Error("No models or enums were found in this schema.");
  }

  // A model referenced as another model's field type is a relation.
  const names = new Set(models.map((model) => model.name));
  const relations = [];
  models.forEach((model) => {
    model.fields.forEach((field) => {
      if (names.has(field.type)) {
        relations.push({
          fromTable: model.name,
          fromColumn: field.name,
          toTable: field.type,
          toColumn: "id",
          list: field.list,
        });
      }
    });
  });

  return { models, enums, provider, relations };
}

/**
 * Lays tables out on a grid and returns the geometry for an ER diagram.
 *
 * Kept as data rather than markup so the page can render it as SVG and still
 * make each table reachable as a list on a narrow screen.
 */
export function buildErdLayout({ tables, relations }, { columns = 3, boxWidth = 240, rowHeight = 26, gapX = 80, gapY = 70 } = {}) {
  const nodes = tables.map((table, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const height = 34 + table.columns.length * rowHeight;
    return {
      ...table,
      x: column * (boxWidth + gapX) + 20,
      y: 20 + rowsAbove(tables, index, columns, rowHeight, gapY),
      width: boxWidth,
      height,
    };
  });

  const byName = new Map(nodes.map((node) => [node.name, node]));
  const edges = relations
    .map((relation) => {
      const from = byName.get(relation.fromTable);
      const to = byName.get(relation.toTable);
      if (!from || !to) return null;
      const fromIndex = from.columns.findIndex((column) => column.name === relation.fromColumn);
      const toIndex = to.columns.findIndex((column) => column.name === relation.toColumn);
      return {
        ...relation,
        x1: from.x + from.width,
        y1: from.y + 34 + Math.max(0, fromIndex) * rowHeight + rowHeight / 2,
        x2: to.x,
        y2: to.y + 34 + Math.max(0, toIndex) * rowHeight + rowHeight / 2,
      };
    })
    .filter(Boolean);

  const width = Math.max(...nodes.map((node) => node.x + node.width), 400) + 20;
  const height = Math.max(...nodes.map((node) => node.y + node.height), 200) + 20;

  return { nodes, edges, width, height };
}

/** Cumulative vertical offset for the grid row a table sits in. */
function rowsAbove(tables, index, columns, rowHeight, gapY) {
  const row = Math.floor(index / columns);
  let offset = 0;
  for (let r = 0; r < row; r += 1) {
    const tallest = Math.max(
      ...tables
        .slice(r * columns, (r + 1) * columns)
        .map((table) => 34 + table.columns.length * rowHeight),
    );
    offset += tallest + gapY;
  }
  return offset;
}
