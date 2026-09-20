/**
 * Barcode generation, on top of JsBarcode.
 *
 * JsBarcode renders directly onto a canvas or SVG element and throws
 * synchronously on invalid input, so this module is mostly a thin,
 * error-message-friendly wrapper plus the format catalogue the picker needs.
 */

import JsBarcode from "jsbarcode";

/** Every format JsBarcode ships, with a hint on what input it accepts. */
export const BARCODE_FORMATS = [
  { id: "CODE128", label: "Code 128", hint: "Any text — the general-purpose default." },
  { id: "EAN13", label: "EAN-13", hint: "12 or 13 digits (retail products)." },
  { id: "EAN8", label: "EAN-8", hint: "7 or 8 digits." },
  { id: "UPC", label: "UPC-A", hint: "11 or 12 digits (US retail)." },
  { id: "CODE39", label: "Code 39", hint: "Letters, digits, and - . $ / + % space." },
  { id: "ITF14", label: "ITF-14", hint: "Exactly 14 digits (shipping cartons)." },
  { id: "MSI", label: "MSI", hint: "Digits only." },
  { id: "pharmacode", label: "Pharmacode", hint: "A single number from 3 to 131070." },
  { id: "codabar", label: "Codabar", hint: "Digits and - $ : / . + (older logistics/medical)." },
];

/**
 * Renders `value` onto `canvas` as `format`. Throws with JsBarcode's own
 * message (e.g. `"12345" is not a valid input for EAN13`) on bad input,
 * which is specific enough to show directly.
 */
export function renderBarcodeToCanvas(canvas, value, options = {}) {
  const {
    format = "CODE128",
    width = 2,
    height = 100,
    displayValue = true,
    background = "#ffffff",
    lineColor = "#050505",
    fontSize = 20,
    margin = 12,
  } = options;

  try {
    JsBarcode(canvas, value, {
      format,
      width,
      height,
      displayValue,
      background,
      lineColor,
      fontSize,
      margin,
    });
  } catch (caught) {
    // JsBarcode throws a bare string here rather than an Error — its own
    // ErrorHandler docs this as a workaround for a Babel `extends Error`
    // limitation ("if babel supported extending of Error correctly,
    // instanceof would be used here"). Normalised so callers can rely on
    // `.message` either way.
    throw caught instanceof Error ? caught : new Error(String(caught));
  }
}
