/**
 * Everyday developer lookups and calculators.
 *
 * Cron parsing, chmod maths and user-agent detection are implemented here
 * rather than pulled in as three more dependencies — each is small, and the
 * scope they need to cover is well defined.
 */

/* ---------------------------------- Cron ---------------------------------- */

const CRON_FIELDS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day of month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] },
  { name: "day of week", min: 0, max: 6, names: ["sun","mon","tue","wed","thu","fri","sat"] },
];

const MACROS = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/** Expands one cron field into the explicit set of values it matches. */
function parseField(expression, field) {
  const values = new Set();

  for (const part of expression.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) {
      throw new Error(`"${part}" has an invalid step in the ${field.name} field.`);
    }

    const toNumber = (token) => {
      const lower = token.toLowerCase();
      const named = field.names?.indexOf(lower);
      if (named !== undefined && named >= 0) return named + (field.name === "month" ? 1 : 0);
      const parsed = Number(token);
      if (!Number.isInteger(parsed)) {
        throw new Error(`"${token}" is not valid in the ${field.name} field.`);
      }
      return parsed;
    };

    let from;
    let to;
    if (range === "*") {
      from = field.min;
      to = field.max;
    } else if (range.includes("-")) {
      const [start, end] = range.split("-");
      from = toNumber(start);
      to = toNumber(end);
    } else {
      from = toNumber(range);
      to = stepText === undefined ? from : field.max;
    }

    // Sunday is both 0 and 7 in most cron implementations.
    if (field.name === "day of week") {
      if (from === 7) from = 0;
      if (to === 7) to = 0;
    }

    if (from < field.min || to > field.max || from > to) {
      throw new Error(
        `"${part}" is out of range for the ${field.name} field (${field.min}–${field.max}).`,
      );
    }
    for (let value = from; value <= to; value += step) values.add(value);
  }

  return [...values].sort((a, b) => a - b);
}

/** Parses a 5-field cron expression (or a @macro) into matching value sets. */
export function parseCron(expression) {
  const text = expression.trim().toLowerCase();
  if (!text) throw new Error("Enter a cron expression.");

  const normalised = MACROS[text] || text;
  const parts = normalised.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      `A cron expression has 5 fields (minute hour day month weekday); this has ${parts.length}.`,
    );
  }

  const fields = CRON_FIELDS.map((field, index) => ({
    field,
    raw: parts[index],
    values: parseField(parts[index], field),
  }));

  return { fields, normalised, macro: MACROS[text] ? text : null };
}

const ORDINALS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** Plain-English description of what a cron expression means. */
export function describeCron(expression) {
  const { fields } = parseCron(expression);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const isEvery = (entry) => entry.raw === "*";
  const list = (values, format) => {
    const rendered = values.map(format);
    if (rendered.length === 1) return rendered[0];
    return `${rendered.slice(0, -1).join(", ")} and ${rendered[rendered.length - 1]}`;
  };

  let time;
  if (isEvery(minute) && isEvery(hour)) time = "Every minute";
  else if (isEvery(minute)) time = `Every minute during ${list(hour.values, (h) => `${String(h).padStart(2, "0")}:00`)}`;
  else if (isEvery(hour)) time = `At minute ${list(minute.values, String)} of every hour`;
  else if (minute.values.length === 1 && hour.values.length === 1)
    time = `At ${String(hour.values[0]).padStart(2, "0")}:${String(minute.values[0]).padStart(2, "0")}`;
  else
    time = `At minute ${list(minute.values, String)} past hour ${list(hour.values, String)}`;

  const parts = [time];
  if (!isEvery(dayOfMonth)) parts.push(`on day ${list(dayOfMonth.values, String)} of the month`);
  if (!isEvery(dayOfWeek)) parts.push(`on ${list(dayOfWeek.values, (d) => ORDINALS[d])}`);
  if (!isEvery(month)) parts.push(`in ${list(month.values, (m) => MONTHS[m - 1])}`);

  return `${parts.join(", ")}.`;
}

/**
 * Next occurrences after `from`.
 *
 * Steps a minute at a time, which is simple and exact. The 4-year ceiling
 * stops a never-matching expression (e.g. Feb 30) from spinning forever.
 */
export function nextCronRuns(expression, count = 5, from = new Date()) {
  const { fields } = parseCron(expression);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields.map((entry) => entry.values);
  const dayRestricted = fields[2].raw !== "*";
  const weekdayRestricted = fields[4].raw !== "*";

  const runs = [];
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = new Date(from.getTime());
  limit.setFullYear(limit.getFullYear() + 4);

  while (runs.length < count && cursor <= limit) {
    const matchesDay = dayOfMonth.includes(cursor.getDate());
    const matchesWeekday = dayOfWeek.includes(cursor.getDay());
    // When both day-of-month and day-of-week are restricted, cron matches either.
    const dayOk =
      dayRestricted && weekdayRestricted
        ? matchesDay || matchesWeekday
        : matchesDay && matchesWeekday;

    if (
      minute.includes(cursor.getMinutes()) &&
      hour.includes(cursor.getHours()) &&
      month.includes(cursor.getMonth() + 1) &&
      dayOk
    ) {
      runs.push(new Date(cursor.getTime()));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}

/* --------------------------------- chmod ---------------------------------- */

export const PERMISSION_BITS = ["read", "write", "execute"];

/** Converts an octal mode such as `755` into flags, symbolic form and meaning. */
export function parseChmod(octal) {
  const text = String(octal).trim();
  if (!/^[0-7]{3,4}$/.test(text)) {
    throw new Error("A mode is 3 or 4 octal digits, for example 755 or 0644.");
  }
  const digits = text.length === 4 ? text.slice(1) : text;
  const special = text.length === 4 ? Number(text[0]) : 0;

  const scopes = ["owner", "group", "others"].map((scope, index) => {
    const value = Number(digits[index]);
    return {
      scope,
      value,
      read: Boolean(value & 4),
      write: Boolean(value & 2),
      execute: Boolean(value & 1),
    };
  });

  const symbolic = scopes
    .map((scope) => `${scope.read ? "r" : "-"}${scope.write ? "w" : "-"}${scope.execute ? "x" : "-"}`)
    .join("");

  return {
    octal: digits,
    special,
    scopes,
    symbolic,
    setuid: Boolean(special & 4),
    setgid: Boolean(special & 2),
    sticky: Boolean(special & 1),
  };
}

/** Builds an octal mode from per-scope flags. */
export function buildChmod(scopes) {
  return scopes
    .map((scope) => (scope.read ? 4 : 0) + (scope.write ? 2 : 0) + (scope.execute ? 1 : 0))
    .join("");
}

/* ------------------------------- User agent -------------------------------- */

const BROWSERS = [
  { name: "Edge", pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
  { name: "Opera", pattern: /(?:OPR|Opera)\/([\d.]+)/ },
  { name: "Samsung Internet", pattern: /SamsungBrowser\/([\d.]+)/ },
  { name: "Firefox", pattern: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { name: "Chrome", pattern: /(?:Chrome|CriOS)\/([\d.]+)/ },
  { name: "Safari", pattern: /Version\/([\d.]+).*Safari/ },
  { name: "Internet Explorer", pattern: /(?:MSIE |rv:)([\d.]+).*Trident/ },
];

const OPERATING_SYSTEMS = [
  { name: "Windows", pattern: /Windows NT ([\d.]+)/, versions: { "10.0": "10 / 11", "6.3": "8.1", "6.2": "8", "6.1": "7" } },
  { name: "Android", pattern: /Android ([\d.]+)/ },
  { name: "iOS", pattern: /OS ([\d_]+) like Mac OS X/ },
  { name: "macOS", pattern: /Mac OS X ([\d_.]+)/ },
  { name: "Linux", pattern: /Linux/ },
];

const BOTS = /(bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|lighthouse|headless)/i;

/**
 * Identifies browser, engine, OS and device from a user-agent string.
 *
 * Detection order matters: Edge and Opera both claim to be Chrome, and Chrome
 * claims to be Safari, so the more specific tokens are tested first.
 */
export function parseUserAgent(userAgent) {
  const text = String(userAgent || "").trim();
  if (!text) throw new Error("Paste a user-agent string.");

  const browser = BROWSERS.find((entry) => entry.pattern.test(text));
  const browserMatch = browser?.pattern.exec(text);

  const os = OPERATING_SYSTEMS.find((entry) => entry.pattern.test(text));
  const osMatch = os?.pattern.exec(text);
  let osVersion = osMatch?.[1]?.replace(/_/g, ".");
  if (os?.versions && osVersion && os.versions[osVersion]) osVersion = os.versions[osVersion];

  const engine =
    /Gecko\/|rv:.*Gecko/.test(text) && !/like Gecko/.test(text) ? "Gecko"
    : /AppleWebKit/.test(text) ? (/Chrome|Chromium|Edg/.test(text) ? "Blink" : "WebKit")
    : /Trident/.test(text) ? "Trident"
    : "Unknown";

  const mobile = /Mobi|Android|iPhone|iPod/.test(text);
  const tablet = /iPad|Tablet|PlayBook|Silk/.test(text) || (/Android/.test(text) && !/Mobi/.test(text));

  return {
    browser: browser?.name || "Unknown",
    browserVersion: browserMatch?.[1] || "—",
    engine,
    os: os?.name || "Unknown",
    osVersion: osVersion || "—",
    device: tablet ? "Tablet" : mobile ? "Mobile" : "Desktop",
    bot: BOTS.test(text),
    raw: text,
  };
}

/* ------------------------------- URL parsing ------------------------------- */

/** Breaks a URL into its parts, with the query string expanded. */
export function parseUrl(input) {
  const text = String(input || "").trim();
  if (!text) throw new Error("Enter a URL.");

  let url;
  try {
    url = new URL(text);
  } catch {
    try {
      // A bare host like "example.com/path" is a common paste.
      url = new URL(`https://${text}`);
    } catch {
      throw new Error("This is not a URL that can be parsed.");
    }
  }

  const params = [...url.searchParams.entries()].map(([key, value]) => ({ key, value }));

  return {
    href: url.href,
    protocol: url.protocol.replace(":", ""),
    username: url.username,
    password: url.password ? "•".repeat(url.password.length) : "",
    host: url.host,
    hostname: url.hostname,
    port: url.port || "(default)",
    pathname: url.pathname,
    segments: url.pathname.split("/").filter(Boolean),
    search: url.search,
    params,
    hash: url.hash,
  };
}

/** Query string → entries, accepting a full URL or a bare `a=1&b=2`. */
export function parseQueryString(input) {
  const text = String(input || "").trim();
  if (!text) throw new Error("Enter a query string.");
  const query = text.includes("?") ? text.slice(text.indexOf("?") + 1) : text;
  const params = new URLSearchParams(query.replace(/^[?#]/, ""));
  return [...params.entries()].map(([key, value]) => ({ key, value }));
}

/** Entries → query string, skipping blank keys. */
export const buildQueryString = (entries) => {
  const params = new URLSearchParams();
  entries.filter((entry) => entry.key.trim()).forEach((entry) => params.append(entry.key, entry.value));
  return params.toString();
};

/* --------------------------------- Lookups -------------------------------- */

/** HTTP status codes with what they actually mean in practice. */
export const HTTP_STATUSES = [
  { code: 100, name: "Continue", category: "Informational", description: "The client should continue with the request body." },
  { code: 101, name: "Switching Protocols", category: "Informational", description: "The server is switching protocols, typically to WebSocket." },
  { code: 200, name: "OK", category: "Success", description: "Standard success response." },
  { code: 201, name: "Created", category: "Success", description: "A new resource was created; its URL is usually in the Location header." },
  { code: 202, name: "Accepted", category: "Success", description: "Accepted for processing, but not completed yet." },
  { code: 204, name: "No Content", category: "Success", description: "Success with no body — common for DELETE and PUT." },
  { code: 206, name: "Partial Content", category: "Success", description: "A range of the resource, used for resumable downloads and media." },
  { code: 301, name: "Moved Permanently", category: "Redirection", description: "The resource has a new permanent URL; caches and search engines update." },
  { code: 302, name: "Found", category: "Redirection", description: "Temporary redirect; the method may change to GET." },
  { code: 303, name: "See Other", category: "Redirection", description: "Redirect to a different resource, always with GET." },
  { code: 304, name: "Not Modified", category: "Redirection", description: "The cached copy is still fresh; no body is sent." },
  { code: 307, name: "Temporary Redirect", category: "Redirection", description: "Temporary redirect that preserves the method and body." },
  { code: 308, name: "Permanent Redirect", category: "Redirection", description: "Permanent redirect that preserves the method and body." },
  { code: 400, name: "Bad Request", category: "Client error", description: "Malformed syntax or invalid parameters." },
  { code: 401, name: "Unauthorized", category: "Client error", description: "Authentication is required or failed. Really means 'unauthenticated'." },
  { code: 402, name: "Payment Required", category: "Client error", description: "Reserved; used by some APIs for billing limits." },
  { code: 403, name: "Forbidden", category: "Client error", description: "Authenticated but not allowed to do this." },
  { code: 404, name: "Not Found", category: "Client error", description: "No resource at this URL." },
  { code: 405, name: "Method Not Allowed", category: "Client error", description: "The URL exists but not for this HTTP method." },
  { code: 406, name: "Not Acceptable", category: "Client error", description: "No representation matches the Accept headers." },
  { code: 408, name: "Request Timeout", category: "Client error", description: "The client took too long to send the request." },
  { code: 409, name: "Conflict", category: "Client error", description: "Conflicts with current state — a duplicate or a version clash." },
  { code: 410, name: "Gone", category: "Client error", description: "Deliberately removed and will not come back." },
  { code: 413, name: "Payload Too Large", category: "Client error", description: "The request body exceeds the server's limit." },
  { code: 415, name: "Unsupported Media Type", category: "Client error", description: "The Content-Type is not one the endpoint accepts." },
  { code: 418, name: "I'm a teapot", category: "Client error", description: "An April Fools' joke from RFC 2324, still implemented widely." },
  { code: 422, name: "Unprocessable Content", category: "Client error", description: "Well-formed but semantically invalid — typical for validation failures." },
  { code: 429, name: "Too Many Requests", category: "Client error", description: "Rate limited. Check the Retry-After header." },
  { code: 500, name: "Internal Server Error", category: "Server error", description: "An unhandled error on the server." },
  { code: 501, name: "Not Implemented", category: "Server error", description: "The server does not support the functionality required." },
  { code: 502, name: "Bad Gateway", category: "Server error", description: "An upstream server returned an invalid response." },
  { code: 503, name: "Service Unavailable", category: "Server error", description: "Overloaded or down for maintenance." },
  { code: 504, name: "Gateway Timeout", category: "Server error", description: "An upstream server did not respond in time." },
  { code: 507, name: "Insufficient Storage", category: "Server error", description: "The server cannot store the representation." },
];

/** Common MIME types, with extensions, for both directions of lookup. */
export const MIME_TYPES = [
  { type: "text/plain", extensions: ["txt", "log"], description: "Plain text" },
  { type: "text/html", extensions: ["html", "htm"], description: "HTML document" },
  { type: "text/css", extensions: ["css"], description: "Stylesheet" },
  { type: "text/csv", extensions: ["csv"], description: "Comma-separated values" },
  { type: "text/markdown", extensions: ["md", "markdown"], description: "Markdown" },
  { type: "application/json", extensions: ["json"], description: "JSON" },
  { type: "application/ld+json", extensions: ["jsonld"], description: "JSON-LD structured data" },
  { type: "application/xml", extensions: ["xml"], description: "XML" },
  { type: "application/javascript", extensions: ["js", "mjs"], description: "JavaScript" },
  { type: "application/pdf", extensions: ["pdf"], description: "PDF document" },
  { type: "application/zip", extensions: ["zip"], description: "ZIP archive" },
  { type: "application/gzip", extensions: ["gz"], description: "gzip archive" },
  { type: "application/x-tar", extensions: ["tar"], description: "tar archive" },
  { type: "application/octet-stream", extensions: ["bin"], description: "Arbitrary binary data" },
  { type: "application/x-www-form-urlencoded", extensions: [], description: "HTML form encoding" },
  { type: "multipart/form-data", extensions: [], description: "Form encoding with file uploads" },
  { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: ["docx"], description: "Word document" },
  { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extensions: ["xlsx"], description: "Excel spreadsheet" },
  { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extensions: ["pptx"], description: "PowerPoint presentation" },
  { type: "image/png", extensions: ["png"], description: "PNG image" },
  { type: "image/jpeg", extensions: ["jpg", "jpeg"], description: "JPEG image" },
  { type: "image/gif", extensions: ["gif"], description: "GIF image" },
  { type: "image/webp", extensions: ["webp"], description: "WebP image" },
  { type: "image/avif", extensions: ["avif"], description: "AVIF image" },
  { type: "image/svg+xml", extensions: ["svg"], description: "SVG vector image" },
  { type: "image/x-icon", extensions: ["ico"], description: "Icon" },
  { type: "audio/mpeg", extensions: ["mp3"], description: "MP3 audio" },
  { type: "audio/wav", extensions: ["wav"], description: "WAV audio" },
  { type: "audio/ogg", extensions: ["ogg", "oga"], description: "Ogg audio" },
  { type: "video/mp4", extensions: ["mp4"], description: "MP4 video" },
  { type: "video/webm", extensions: ["webm"], description: "WebM video" },
  { type: "font/woff", extensions: ["woff"], description: "Web font" },
  { type: "font/woff2", extensions: ["woff2"], description: "Web font (WOFF2)" },
  { type: "font/ttf", extensions: ["ttf"], description: "TrueType font" },
];

/* ---------------------------- Git command builder -------------------------- */

/**
 * Recipes for the git operations people look up rather than memorise.
 * `build` returns the commands for the filled-in inputs.
 */
export const GIT_RECIPES = [
  {
    id: "undo-last-commit",
    title: "Undo the last commit, keep the changes",
    inputs: [],
    build: () => ["git reset --soft HEAD~1"],
    note: "The commit disappears; your files are untouched and staged.",
  },
  {
    id: "discard-last-commit",
    title: "Discard the last commit and its changes",
    inputs: [],
    build: () => ["git reset --hard HEAD~1"],
    note: "Destructive — the changes in that commit are gone unless they are in the reflog.",
  },
  {
    id: "amend",
    title: "Change the last commit message",
    inputs: [{ id: "message", label: "New message", placeholder: "fix: correct the rounding" }],
    build: ({ message }) => [`git commit --amend -m ${JSON.stringify(message || "new message")}`],
    note: "Rewrites history — avoid on a branch others have pulled.",
  },
  {
    id: "new-branch",
    title: "Create and switch to a new branch",
    inputs: [{ id: "branch", label: "Branch name", placeholder: "feature/search" }],
    build: ({ branch }) => [`git switch -c ${branch || "new-branch"}`],
  },
  {
    id: "delete-branch",
    title: "Delete a branch locally and remotely",
    inputs: [{ id: "branch", label: "Branch name", placeholder: "feature/old" }],
    build: ({ branch }) => [
      `git branch -d ${branch || "branch"}`,
      `git push origin --delete ${branch || "branch"}`,
    ],
  },
  {
    id: "rename-branch",
    title: "Rename the current branch",
    inputs: [{ id: "branch", label: "New name", placeholder: "main" }],
    build: ({ branch }) => [
      `git branch -m ${branch || "new-name"}`,
      `git push origin -u ${branch || "new-name"}`,
      `git push origin --delete OLD_NAME`,
    ],
  },
  {
    id: "stash",
    title: "Stash work in progress and come back to it",
    inputs: [{ id: "message", label: "Label (optional)", placeholder: "wip: search filters" }],
    build: ({ message }) => [
      message ? `git stash push -u -m ${JSON.stringify(message)}` : "git stash push -u",
      "git stash list",
      "git stash pop",
    ],
    note: "-u includes untracked files, which plain `git stash` leaves behind.",
  },
  {
    id: "unstage",
    title: "Unstage a file without losing changes",
    inputs: [{ id: "path", label: "File path", placeholder: "src/App.jsx" }],
    build: ({ path }) => [`git restore --staged ${path || "path/to/file"}`],
  },
  {
    id: "revert",
    title: "Safely undo a commit that is already pushed",
    inputs: [{ id: "sha", label: "Commit SHA", placeholder: "9964712" }],
    build: ({ sha }) => [`git revert ${sha || "<sha>"}`],
    note: "Creates a new commit that reverses the old one, so shared history stays intact.",
  },
  {
    id: "cherry-pick",
    title: "Copy a commit onto the current branch",
    inputs: [{ id: "sha", label: "Commit SHA", placeholder: "9964712" }],
    build: ({ sha }) => [`git cherry-pick ${sha || "<sha>"}`],
  },
  {
    id: "sync-fork",
    title: "Sync a fork with upstream",
    inputs: [
      { id: "remote", label: "Upstream URL", placeholder: "https://github.com/owner/repo.git" },
      { id: "branch", label: "Branch", placeholder: "main" },
    ],
    build: ({ remote, branch }) => [
      `git remote add upstream ${remote || "<upstream-url>"}`,
      "git fetch upstream",
      `git switch ${branch || "main"}`,
      `git merge upstream/${branch || "main"}`,
    ],
  },
  {
    id: "squash",
    title: "Squash the last N commits into one",
    inputs: [{ id: "count", label: "How many commits", placeholder: "3" }],
    build: ({ count }) => [
      `git reset --soft HEAD~${count || 3}`,
      "git commit -m \"squashed commit message\"",
    ],
    note: "Avoids interactive rebase, which needs an editor.",
  },
  {
    id: "find-commit",
    title: "Find which commit introduced a line",
    inputs: [{ id: "path", label: "File path", placeholder: "src/api.js" }],
    build: ({ path }) => [
      `git log -p --follow ${path || "path/to/file"}`,
      `git blame ${path || "path/to/file"}`,
    ],
  },
  {
    id: "clean",
    title: "Remove untracked files and directories",
    inputs: [],
    build: () => ["git clean -nd", "git clean -fd"],
    note: "Run the -nd dry run first — the second command cannot be undone.",
  },
];
