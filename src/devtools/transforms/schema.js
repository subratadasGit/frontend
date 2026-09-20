/**
 * JSON Schema validation.
 *
 * A focused implementation of the draft-07 keywords that documents in the wild
 * actually use, rather than a dependency. What it covers is listed in
 * `SUPPORTED_KEYWORDS` and shown in the tool, so the boundary is visible
 * instead of being discovered through a schema that silently passes.
 *
 * Not covered: `$ref` to external documents, `if`/`then`/`else`,
 * `dependentSchemas`, `contentEncoding` and custom `format` assertions beyond
 * the common ones below.
 */

export const SUPPORTED_KEYWORDS = [
  "type", "enum", "const", "required", "properties", "additionalProperties",
  "patternProperties", "items", "prefixItems", "minItems", "maxItems",
  "uniqueItems", "contains", "minimum", "maximum", "exclusiveMinimum",
  "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "pattern",
  "format", "minProperties", "maxProperties", "allOf", "anyOf", "oneOf", "not",
  "$ref (internal, #/…)",
];

const FORMATS = {
  "date-time": /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  hostname: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  ipv6: /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:\S*$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

const typeOf = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
};

/** `integer` also satisfies `number`, which `typeof` alone does not express. */
const matchesType = (value, expected) => {
  const actual = typeOf(value);
  if (expected === "number") return actual === "number" || actual === "integer";
  return actual === expected;
};

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => deepEqual(a[key], b[key]));
};

/** Resolves an internal `#/a/b` pointer against the root schema. */
function resolveRef(ref, root) {
  if (!ref.startsWith("#")) {
    throw new Error(`Only internal $ref pointers are supported — "${ref}" is external.`);
  }
  const segments = ref.slice(1).split("/").filter(Boolean);
  let current = root;
  for (const segment of segments) {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    current = current?.[key];
    if (current === undefined) throw new Error(`$ref "${ref}" does not resolve.`);
  }
  return current;
}

/**
 * Validates `value` against `schema`, returning every error rather than
 * stopping at the first — a list of what is wrong is more useful than one
 * message at a time.
 */
export function validateAgainstSchema(value, schema, root = schema, path = "$") {
  const errors = [];
  if (schema === true || schema === undefined) return errors;
  if (schema === false) {
    return [{ path, keyword: "false", message: "No value is allowed here." }];
  }

  const fail = (keyword, message) => errors.push({ path, keyword, message });

  if (schema.$ref) {
    try {
      return validateAgainstSchema(value, resolveRef(schema.$ref, root), root, path);
    } catch (caught) {
      return [{ path, keyword: "$ref", message: caught.message }];
    }
  }

  /* Type */
  if (schema.type) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.some((entry) => matchesType(value, entry))) {
      fail("type", `Expected ${expected.join(" or ")}, got ${typeOf(value)}.`);
      // Type is wrong, so the type-specific checks below would only add noise.
      return errors;
    }
  }

  /* Universal */
  if (schema.enum && !schema.enum.some((entry) => deepEqual(entry, value))) {
    fail("enum", `Must be one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}.`);
  }
  if ("const" in schema && !deepEqual(schema.const, value)) {
    fail("const", `Must be exactly ${JSON.stringify(schema.const)}.`);
  }

  /* Numbers */
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      fail("minimum", `Must be at least ${schema.minimum}.`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      fail("maximum", `Must be at most ${schema.maximum}.`);
    }
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      fail("exclusiveMinimum", `Must be greater than ${schema.exclusiveMinimum}.`);
    }
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      fail("exclusiveMaximum", `Must be less than ${schema.exclusiveMaximum}.`);
    }
    if (schema.multipleOf !== undefined) {
      // Floating point: compare the remainder against a tolerance.
      const remainder = Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf));
      if (remainder > 1e-9) fail("multipleOf", `Must be a multiple of ${schema.multipleOf}.`);
    }
  }

  /* Strings */
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) {
      fail("minLength", `Must be at least ${schema.minLength} characters (it is ${length}).`);
    }
    if (schema.maxLength !== undefined && length > schema.maxLength) {
      fail("maxLength", `Must be at most ${schema.maxLength} characters (it is ${length}).`);
    }
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern).test(value)) {
          fail("pattern", `Must match ${schema.pattern}.`);
        }
      } catch {
        fail("pattern", `The schema's pattern "${schema.pattern}" is not a valid regular expression.`);
      }
    }
    if (schema.format && FORMATS[schema.format] && !FORMATS[schema.format].test(value)) {
      fail("format", `Must be a valid ${schema.format}.`);
    }
  }

  /* Arrays */
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      fail("minItems", `Must have at least ${schema.minItems} items (it has ${value.length}).`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      fail("maxItems", `Must have at most ${schema.maxItems} items (it has ${value.length}).`);
    }
    if (schema.uniqueItems) {
      const duplicate = value.findIndex((entry, index) =>
        value.slice(index + 1).some((other) => deepEqual(entry, other)),
      );
      if (duplicate >= 0) fail("uniqueItems", `Items must be unique — index ${duplicate} is repeated.`);
    }

    const tuple = schema.prefixItems || (Array.isArray(schema.items) ? schema.items : null);
    if (tuple) {
      tuple.forEach((entry, index) => {
        if (index < value.length) {
          errors.push(...validateAgainstSchema(value[index], entry, root, `${path}[${index}]`));
        }
      });
    } else if (schema.items) {
      value.forEach((entry, index) => {
        errors.push(...validateAgainstSchema(entry, schema.items, root, `${path}[${index}]`));
      });
    }

    if (schema.contains) {
      const any = value.some(
        (entry) => validateAgainstSchema(entry, schema.contains, root, path).length === 0,
      );
      if (!any) fail("contains", "No item matches the `contains` schema.");
    }
  }

  /* Objects */
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);

    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      fail("minProperties", `Must have at least ${schema.minProperties} properties.`);
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      fail("maxProperties", `Must have at most ${schema.maxProperties} properties.`);
    }
    for (const required of schema.required || []) {
      if (!(required in value)) {
        errors.push({
          path: `${path}.${required}`,
          keyword: "required",
          message: `Required property "${required}" is missing.`,
        });
      }
    }

    const matchedByPattern = new Set();
    for (const [pattern, subSchema] of Object.entries(schema.patternProperties || {})) {
      let expression;
      try {
        expression = new RegExp(pattern);
      } catch {
        fail("patternProperties", `"${pattern}" is not a valid regular expression.`);
        continue;
      }
      for (const key of keys) {
        if (expression.test(key)) {
          matchedByPattern.add(key);
          errors.push(...validateAgainstSchema(value[key], subSchema, root, `${path}.${key}`));
        }
      }
    }

    for (const [key, subSchema] of Object.entries(schema.properties || {})) {
      if (key in value) {
        errors.push(...validateAgainstSchema(value[key], subSchema, root, `${path}.${key}`));
      }
    }

    if (schema.additionalProperties !== undefined) {
      const declared = new Set(Object.keys(schema.properties || {}));
      const extra = keys.filter((key) => !declared.has(key) && !matchedByPattern.has(key));
      if (schema.additionalProperties === false) {
        extra.forEach((key) =>
          errors.push({
            path: `${path}.${key}`,
            keyword: "additionalProperties",
            message: `Property "${key}" is not allowed.`,
          }),
        );
      } else if (typeof schema.additionalProperties === "object") {
        extra.forEach((key) =>
          errors.push(
            ...validateAgainstSchema(value[key], schema.additionalProperties, root, `${path}.${key}`),
          ),
        );
      }
    }
  }

  /* Combinators */
  (schema.allOf || []).forEach((entry) => {
    errors.push(...validateAgainstSchema(value, entry, root, path));
  });

  if (schema.anyOf) {
    const anyValid = schema.anyOf.some(
      (entry) => validateAgainstSchema(value, entry, root, path).length === 0,
    );
    if (!anyValid) fail("anyOf", "Does not match any of the `anyOf` schemas.");
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter(
      (entry) => validateAgainstSchema(value, entry, root, path).length === 0,
    ).length;
    if (matches !== 1) {
      fail("oneOf", `Must match exactly one of the \`oneOf\` schemas — it matched ${matches}.`);
    }
  }

  if (schema.not && validateAgainstSchema(value, schema.not, root, path).length === 0) {
    fail("not", "Must not match the `not` schema.");
  }

  return errors;
}
