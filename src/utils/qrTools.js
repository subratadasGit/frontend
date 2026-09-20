/**
 * QR code generation.
 *
 * `qrcode` does the actual encoding; this module adds the pieces a generator
 * page needs on top of it — payload builders for the common content types
 * (plain text is not the only thing people want to encode: Wi-Fi credentials,
 * a vCard, a phone number all have a standard payload shape) and PNG/SVG
 * export.
 */

import QRCode from "qrcode";

export const ERROR_LEVELS = [
  { id: "L", label: "L", hint: "Recovers ~7% — smallest code" },
  { id: "M", label: "M", hint: "Recovers ~15% — default" },
  { id: "Q", label: "Q", hint: "Recovers ~25%" },
  { id: "H", label: "H", hint: "Recovers ~30% — best with a logo overlay" },
];

/** Content types the builder panel offers, each producing the raw QR payload. */
export const QR_TYPES = [
  { id: "text", label: "Text / URL" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "phone", label: "Phone" },
  { id: "vcard", label: "Contact card" },
];

/** Escapes the characters that are structural in a Wi-Fi or vCard payload. */
const escapeField = (value = "") => String(value).replace(/([\\;,:"])/g, "\\$1");

/**
 * Builds the raw string to encode for a given content type.
 * `fields` shape depends on `type` — see each case below.
 */
export function buildPayload(type, fields = {}) {
  switch (type) {
    case "wifi": {
      const { ssid = "", password = "", security = "WPA", hidden = false } = fields;
      if (!ssid.trim()) throw new Error("A network name is required.");
      const auth = security === "nopass" ? "nopass" : security;
      return `WIFI:T:${auth};S:${escapeField(ssid)};${
        auth === "nopass" ? "" : `P:${escapeField(password)};`
      }${hidden ? "H:true;" : ""};`;
    }
    case "email": {
      const { to = "", subject = "", body = "" } = fields;
      if (!to.trim()) throw new Error("A recipient address is required.");
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      if (body) params.set("body", body);
      const query = params.toString();
      return `mailto:${to}${query ? `?${query}` : ""}`;
    }
    case "sms": {
      const { number = "", body = "" } = fields;
      if (!number.trim()) throw new Error("A phone number is required.");
      return `sms:${number}${body ? `?body=${encodeURIComponent(body)}` : ""}`;
    }
    case "phone": {
      const { number = "" } = fields;
      if (!number.trim()) throw new Error("A phone number is required.");
      return `tel:${number}`;
    }
    case "vcard": {
      const { name = "", phone = "", email = "", org = "", title = "", url = "" } = fields;
      if (!name.trim()) throw new Error("A name is required.");
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeField(name)}`,
        `FN:${escapeField(name)}`,
      ];
      if (org) lines.push(`ORG:${escapeField(org)}`);
      if (title) lines.push(`TITLE:${escapeField(title)}`);
      if (phone) lines.push(`TEL:${escapeField(phone)}`);
      if (email) lines.push(`EMAIL:${escapeField(email)}`);
      if (url) lines.push(`URL:${escapeField(url)}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "text":
    default: {
      const text = (fields.text || "").trim();
      if (!text) throw new Error("Enter some content to encode.");
      return text;
    }
  }
}

/** Draws the QR code for `payload` onto `canvas`, sized and coloured as given. */
export async function renderQrToCanvas(canvas, payload, options = {}) {
  const {
    size = 512,
    margin = 2,
    errorCorrectionLevel = "M",
    dark = "#050505",
    light = "#ffffff",
  } = options;

  try {
    await QRCode.toCanvas(canvas, payload, {
      width: size,
      margin,
      errorCorrectionLevel,
      color: { dark, light },
    });
  } catch (caught) {
    // qrcode's own message ("data too big") is already clear; anything else
    // gets a generic wrapper so the UI always has something to show.
    throw new Error(caught?.message || "This content could not be encoded as a QR code.", {
      cause: caught,
    });
  }
}

/** Renders straight to an SVG markup string, for a resolution-independent export. */
export async function qrToSvgString(payload, options = {}) {
  const {
    margin = 2,
    errorCorrectionLevel = "M",
    dark = "#050505",
    light = "#ffffff",
  } = options;

  try {
    return await QRCode.toString(payload, {
      type: "svg",
      margin,
      errorCorrectionLevel,
      color: { dark, light },
    });
  } catch (caught) {
    throw new Error(caught?.message || "This content could not be encoded as a QR code.", {
      cause: caught,
    });
  }
}
