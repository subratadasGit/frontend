/**
 * Encoding, hashing and token inspection.
 *
 * Everything runs locally. Nothing here sends a token, a secret or a password
 * anywhere — JWTs are split and base64-decoded in the browser, and signatures
 * are shown but never verified against a secret, because that would mean
 * asking for the secret in the first place.
 */

/* --------------------------------- Base64 --------------------------------- */

/** UTF-8 safe base64 encode. `btoa` alone throws on anything outside Latin-1. */
export function encodeBase64(text, { urlSafe = false } = {}) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

/** Accepts both standard and URL-safe base64, with or without padding. */
export function decodeBase64(text) {
  const normalised = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("This is not valid base64 — check for stray characters or truncation.");
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/* ----------------------------------- URL ---------------------------------- */

export const encodeUrlComponent = (text) => encodeURIComponent(text);
export const encodeUrlFull = (text) => encodeURI(text);

export function decodeUrlComponent(text) {
  try {
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    throw new Error("This is not a valid percent-encoded string — check for a stray % sign.");
  }
}

/* --------------------------------- Hashing -------------------------------- */

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export const WEB_CRYPTO_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

/* MD5 — not offered by the Web Crypto API, so implemented here. It is broken
   for security purposes and is included only for checksums and legacy
   interop; the UI says so. Reference: RFC 1321. */
function md5(bytes) {
  const rotate = (value, shift) => (value << shift) | (value >>> (32 - shift));

  const K = new Int32Array(64);
  for (let i = 0; i < 64; i += 1) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  const SHIFTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const originalBits = bytes.length * 8;
  const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  new DataView(padded.buffer).setUint32(padded.length - 8, originalBits >>> 0, true);

  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const view = new DataView(padded.buffer);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Int32Array(16);
    for (let i = 0; i < 16; i += 1) M[i] = view.getUint32(offset + i * 4, true);

    let [A, B, C, D] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i += 1) {
      let F;
      let g;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotate(F, SHIFTS[i])) | 0;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  const out = new Uint8Array(16);
  new DataView(out.buffer).setUint32(0, a0 >>> 0, true);
  new DataView(out.buffer).setUint32(4, b0 >>> 0, true);
  new DataView(out.buffer).setUint32(8, c0 >>> 0, true);
  new DataView(out.buffer).setUint32(12, d0 >>> 0, true);
  return toHex(out.buffer);
}

/** Hashes text with the named algorithm. `MD5` is handled locally. */
export async function hashText(text, algorithm = "SHA-256") {
  const bytes = new TextEncoder().encode(text);
  if (algorithm === "MD5") return md5(bytes);
  if (!WEB_CRYPTO_ALGORITHMS.includes(algorithm)) {
    throw new Error(`${algorithm} is not available in this browser.`);
  }
  return toHex(await crypto.subtle.digest(algorithm, bytes));
}

/* ---------------------------------- UUIDs --------------------------------- */

/** Random (v4) UUIDs from the platform CSPRNG. */
export function generateUuids(count = 1, { uppercase = false, braces = false } = {}) {
  return Array.from({ length: Math.max(1, Math.min(count, 500)) }, () => {
    const uuid =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : // Fallback for older browsers, still using the CSPRNG.
          "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
            (
              character ^
              (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (character / 4)))
            ).toString(16),
          );
    const cased = uppercase ? uuid.toUpperCase() : uuid;
    return braces ? `{${cased}}` : cased;
  });
}

/* -------------------------------- Passwords ------------------------------- */

const SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

const AMBIGUOUS = /[Il1O0o]/g;

/**
 * Generates a password from the platform CSPRNG.
 *
 * Rejection sampling keeps the distribution uniform — `% alphabet.length`
 * on a raw byte would quietly bias toward the start of the alphabet.
 */
export function generatePassword({
  length = 20,
  lowercase = true,
  uppercase = true,
  digits = true,
  symbols = true,
  avoidAmbiguous = false,
} = {}) {
  let alphabet = [
    lowercase && SETS.lowercase,
    uppercase && SETS.uppercase,
    digits && SETS.digits,
    symbols && SETS.symbols,
  ]
    .filter(Boolean)
    .join("");

  if (avoidAmbiguous) alphabet = alphabet.replace(AMBIGUOUS, "");
  if (!alphabet) throw new Error("Choose at least one character set.");

  const size = Math.max(4, Math.min(length, 256));
  const limit = 256 - (256 % alphabet.length);
  const out = [];
  while (out.length < size) {
    const byte = crypto.getRandomValues(new Uint8Array(1))[0];
    if (byte < limit) out.push(alphabet[byte % alphabet.length]);
  }
  return out.join("");
}

/** Rough strength estimate, in bits of entropy for a random password. */
export function passwordEntropy(password, alphabetSize) {
  if (!password) return 0;
  return Math.round(password.length * Math.log2(alphabetSize || 1));
}

/* ----------------------------------- JWT ---------------------------------- */

/** Decodes a JWT locally. The signature is shown, never verified or sent. */
export function decodeJwt(token) {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  if (!trimmed) throw new Error("Paste a token to decode.");

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `A JWT has three dot-separated parts; this has ${parts.length}. Check for a truncated copy-paste.`,
    );
  }

  const [headerPart, payloadPart, signature] = parts;

  const decodePart = (part, label) => {
    let text;
    try {
      text = decodeBase64(part);
    } catch {
      throw new Error(`The ${label} is not valid base64url.`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`The ${label} is not valid JSON once decoded.`);
    }
  };

  const header = decodePart(headerPart, "header");
  const payload = decodePart(payloadPart, "payload");

  return { header, payload, signature, raw: trimmed };
}

/** Registered claim names, with the human meaning for the inspector table. */
export const JWT_CLAIMS = {
  iss: "Issuer — who created and signed the token",
  sub: "Subject — who the token is about",
  aud: "Audience — who the token is intended for",
  exp: "Expiration — not valid at or after this time",
  nbf: "Not before — not valid before this time",
  iat: "Issued at — when the token was created",
  jti: "JWT ID — unique identifier for this token",
};

/** Splits a payload into registered claims and everything else. */
export function describeJwtClaims(payload) {
  const registered = [];
  const custom = [];
  for (const [key, value] of Object.entries(payload || {})) {
    const entry = { key, value, description: JWT_CLAIMS[key] };
    if (JWT_CLAIMS[key]) registered.push(entry);
    else custom.push(entry);
  }
  return { registered, custom };
}

/** Expiry state for a decoded payload, or null when it carries no `exp`. */
export function jwtExpiry(payload) {
  if (!payload || typeof payload.exp !== "number") return null;
  const expiresAt = new Date(payload.exp * 1000);
  const expired = expiresAt.getTime() <= Date.now();
  return { expiresAt, expired };
}

/* ------------------------------ .env validator ---------------------------- */

const SECRET_KEY_PATTERN = /(secret|token|password|passwd|api[_-]?key|private[_-]?key|credential)/i;
const PLACEHOLDER = /^(your[_-]|xxx|changeme|todo|<.*>|\.\.\.)/i;

/**
 * Checks a `.env` file for the mistakes that actually bite: duplicate keys,
 * invalid names, quoting errors, obvious placeholders left in, and secrets
 * that look like they were committed with a real value.
 */
export function validateEnv(text) {
  const issues = [];
  const keys = new Map();
  const lines = text.split(/\r?\n/);

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const number = index + 1;
    if (!line || line.startsWith("#")) return;

    const match = /^(export\s+)?([^=]+?)\s*=\s*(.*)$/.exec(line);
    if (!match) {
      issues.push({ level: "error", line: number, message: "Not a KEY=value assignment." });
      return;
    }

    const key = match[2].trim();
    const value = match[3];

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push({
        level: "error",
        line: number,
        message: `"${key}" is not a valid variable name — use letters, digits and underscores, not starting with a digit.`,
      });
    }
    if (key !== key.toUpperCase()) {
      issues.push({
        level: "warning",
        line: number,
        message: `"${key}" is not upper case, which is the convention for environment variables.`,
      });
    }
    if (keys.has(key)) {
      issues.push({
        level: "error",
        line: number,
        message: `"${key}" is already defined on line ${keys.get(key)}; the last value wins.`,
      });
    } else {
      keys.set(key, number);
    }

    const quoteCount = (value.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      issues.push({ level: "error", line: number, message: "Unbalanced double quote in the value." });
    }
    if (/^\s/.test(match[3]) === false && /\s=\s/.test(line) && !value.startsWith('"')) {
      // Spaces around `=` are fine for most parsers but not all; note it once.
      if (/\s=/.test(raw)) {
        issues.push({
          level: "warning",
          line: number,
          message: "Spaces around = are not portable across every .env parser.",
        });
      }
    }
    if (value === "") {
      issues.push({ level: "warning", line: number, message: `"${key}" has an empty value.` });
    }
    if (PLACEHOLDER.test(value.replace(/^["']|["']$/g, ""))) {
      issues.push({
        level: "warning",
        line: number,
        message: `"${key}" still looks like a placeholder.`,
      });
    }
    if (SECRET_KEY_PATTERN.test(key) && value.replace(/^["']|["']$/g, "").length > 8 && !PLACEHOLDER.test(value)) {
      issues.push({
        level: "info",
        line: number,
        message: `"${key}" holds what looks like a real secret — make sure this file is gitignored.`,
      });
    }
  });

  return { issues, count: keys.size };
}
