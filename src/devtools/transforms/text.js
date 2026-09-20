/**
 * Text utilities: case conversion, slugs, counting, generation and diffing.
 *
 * The diff is a hand-rolled LCS rather than a dependency — line diffing is a
 * well-understood algorithm and the project already avoids pulling in a
 * package for something this contained.
 */

/* ------------------------------ Case conversion --------------------------- */

/** Splits any casing style into its constituent words. */
export function splitWords(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

export const CASE_STYLES = [
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "constant", label: "CONSTANT_CASE" },
  { id: "kebab", label: "kebab-case" },
  { id: "dot", label: "dot.case" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
  { id: "lower", label: "lower case" },
  { id: "upper", label: "UPPER CASE" },
];

export function convertCase(text, style) {
  // Line structure is meaningful in most pasted input, so each line converts
  // on its own rather than the whole block collapsing into one token.
  return text
    .split(/\r?\n/)
    .map((line) => {
      const words = splitWords(line);
      if (words.length === 0) return line;
      const lower = words.map((word) => word.toLowerCase());

      switch (style) {
        case "camel":
          return lower
            .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
            .join("");
        case "pascal":
          return lower.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
        case "snake":
          return lower.join("_");
        case "constant":
          return lower.join("_").toUpperCase();
        case "kebab":
          return lower.join("-");
        case "dot":
          return lower.join(".");
        case "title":
          return lower.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
        case "sentence": {
          const joined = lower.join(" ");
          return joined[0].toUpperCase() + joined.slice(1);
        }
        case "upper":
          return line.toUpperCase();
        case "lower":
        default:
          return line.toLowerCase();
      }
    })
    .join("\n");
}

/* ----------------------------------- Slug --------------------------------- */

export function slugify(text, { separator = "-", lowercase = true, maxLength = 0 } = {}) {
  let slug = text
    .normalize("NFKD")
    // Strip accents so "café" becomes "cafe" rather than losing the letter.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, separator)
    .replace(new RegExp(`\\${separator}{2,}`, "g"), separator)
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, "g"), "");
  if (lowercase) slug = slug.toLowerCase();
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(new RegExp(`\\${separator}[^\\${separator}]*$`), "");
  }
  return slug;
}

/* --------------------------------- Counting -------------------------------- */

/** Counts the things people actually ask for, including reading time. */
export function countText(text) {
  const characters = [...text].length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text === "" ? 0 : text.split(/\r?\n/).length;
  const nonEmptyLines = text.split(/\r?\n/).filter((line) => line.trim()).length;
  const paragraphs = text.split(/\n\s*\n/).filter((block) => block.trim()).length;
  const sentences = (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length;

  return {
    characters,
    charactersNoSpaces: [...text.replace(/\s/g, "")].length,
    words,
    lines,
    nonEmptyLines,
    paragraphs,
    sentences,
    bytes: new TextEncoder().encode(text).length,
    // 200 wpm is the usual figure for adult silent reading of prose.
    readingSeconds: Math.round((words / 200) * 60),
  };
}

/* ------------------------------- Lorem ipsum ------------------------------- */

const LOREM = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud
exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure
dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur
excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt
mollit anim id est laborum`
  .split(/\s+/)
  .filter(Boolean);

const pick = (index) => LOREM[index % LOREM.length];

export function generateLorem({ unit = "paragraphs", count = 3, startWithLorem = true } = {}) {
  let cursor = Math.floor(Math.random() * LOREM.length);
  const nextWord = () => pick(cursor++);

  const sentence = () => {
    const length = 8 + Math.floor(Math.random() * 10);
    const words = Array.from({ length }, nextWord);
    const text = words.join(" ");
    return text[0].toUpperCase() + text.slice(1) + ".";
  };

  const paragraph = () =>
    Array.from({ length: 3 + Math.floor(Math.random() * 3) }, sentence).join(" ");

  const amount = Math.max(1, Math.min(count, 200));
  let output;
  if (unit === "words") output = Array.from({ length: amount }, nextWord).join(" ");
  else if (unit === "sentences") output = Array.from({ length: amount }, sentence).join(" ");
  else output = Array.from({ length: amount }, paragraph).join("\n\n");

  if (startWithLorem) {
    output = output.replace(/^\S+(\s\S+)?/, "Lorem ipsum");
  }
  return output;
}

/* ---------------------------- Random data generator ------------------------ */

const FIRST_NAMES = ["Ada", "Grace", "Alan", "Rin", "Marcus", "Ava", "Nia", "Omar", "Sofia", "Kai"];
const LAST_NAMES = ["Lovelace", "Hopper", "Turing", "Takahashi", "Oyelaran", "Lindqvist", "Okafor", "Haddad", "Rossi", "Chen"];
const DOMAINS = ["example.com", "test.dev", "sample.io", "mail.test"];
const CITIES = ["Lisbon", "Osaka", "Nairobi", "Toronto", "Berlin", "Bogotá", "Auckland"];

const randomInt = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
const choose = (list) => list[randomInt(list.length)];

export const RANDOM_FIELDS = [
  "id", "uuid", "firstName", "lastName", "fullName", "email",
  "username", "phone", "city", "company", "jobTitle", "age",
  "price", "boolean", "date", "url", "ipv4", "color",
];

/** Builds rows of plausible fake data for seeding a UI or a fixture. */
export function generateRandomData({ count = 10, fields = ["id", "fullName", "email"] } = {}) {
  const rows = [];
  for (let index = 1; index <= Math.max(1, Math.min(count, 500)); index += 1) {
    const first = choose(FIRST_NAMES);
    const last = choose(LAST_NAMES);
    const row = {};
    for (const field of fields) {
      switch (field) {
        case "id": row.id = index; break;
        case "uuid": row.uuid = crypto.randomUUID(); break;
        case "firstName": row.firstName = first; break;
        case "lastName": row.lastName = last; break;
        case "fullName": row.fullName = `${first} ${last}`; break;
        case "email": row.email = `${first.toLowerCase()}.${last.toLowerCase()}@${choose(DOMAINS)}`; break;
        case "username": row.username = `${first.toLowerCase()}${randomInt(900) + 100}`; break;
        case "phone": row.phone = `+1 ${randomInt(800) + 200} ${String(randomInt(1000)).padStart(3, "0")} ${String(randomInt(10000)).padStart(4, "0")}`; break;
        case "city": row.city = choose(CITIES); break;
        case "company": row.company = `${choose(LAST_NAMES)} ${choose(["Labs", "Systems", "Works", "Group"])}`; break;
        case "jobTitle": row.jobTitle = choose(["Engineer", "Designer", "Analyst", "Manager", "Researcher"]); break;
        case "age": row.age = randomInt(50) + 18; break;
        case "price": row.price = Number((randomInt(100000) / 100).toFixed(2)); break;
        case "boolean": row.boolean = randomInt(2) === 1; break;
        case "date": row.date = new Date(Date.now() - randomInt(31536000000)).toISOString(); break;
        case "url": row.url = `https://${choose(DOMAINS)}/${choose(["docs", "blog", "app"])}/${randomInt(999)}`; break;
        case "ipv4": row.ipv4 = `${randomInt(223) + 1}.${randomInt(256)}.${randomInt(256)}.${randomInt(256)}`; break;
        case "color": row.color = `#${randomInt(16777215).toString(16).padStart(6, "0")}`; break;
        default: break;
      }
    }
    rows.push(row);
  }
  return rows;
}

/* ----------------------------------- Diff ---------------------------------- */

/**
 * Longest common subsequence over lines, yielding a unified list of
 * `{ type, value, leftLine, rightLine }` entries.
 *
 * The DP table is O(n·m), which is fine for the sizes a paste-in diff tool
 * sees; very large inputs are guarded by the caller.
 */
export function diffLines(leftText, rightText, { ignoreWhitespace = false, ignoreCase = false } = {}) {
  const normalise = (line) => {
    let value = line;
    if (ignoreWhitespace) value = value.trim().replace(/\s+/g, " ");
    if (ignoreCase) value = value.toLowerCase();
    return value;
  };

  const left = leftText.split(/\r?\n/);
  const right = rightText.split(/\r?\n/);
  const a = left.map(normalise);
  const b = right.map(normalise);

  // table[i][j] = LCS length of a[i..] and b[j..]
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: "equal", value: left[i], leftLine: i + 1, rightLine: j + 1 });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: "removed", value: left[i], leftLine: i + 1, rightLine: null });
      i += 1;
    } else {
      rows.push({ type: "added", value: right[j], leftLine: null, rightLine: j + 1 });
      j += 1;
    }
  }
  while (i < a.length) {
    rows.push({ type: "removed", value: left[i], leftLine: i + 1, rightLine: null });
    i += 1;
  }
  while (j < b.length) {
    rows.push({ type: "added", value: right[j], leftLine: null, rightLine: j + 1 });
    j += 1;
  }

  const added = rows.filter((row) => row.type === "added").length;
  const removed = rows.filter((row) => row.type === "removed").length;
  return { rows, added, removed, unchanged: rows.length - added - removed };
}
