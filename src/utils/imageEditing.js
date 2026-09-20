/**
 * Canvas helpers behind the image editor.
 *
 * Two kinds of operation, kept deliberately separate:
 *
 *   - Geometry (rotate, flip, crop) is *baked*: each one produces a new working
 *     canvas, so what the preview shows is literally the pixels that will be
 *     exported.
 *   - Adjustments (brightness, contrast, …) stay live as a `ctx.filter` string
 *     and are re-applied on every render, so dragging a slider never
 *     accumulates loss.
 */

/** Neutral values — also what "Reset" restores. */
export const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

/** Slider definitions, in the order they appear in the panel. */
export const ADJUSTMENT_CONTROLS = [
  { key: "brightness", label: "Brightness", min: 0, max: 200, step: 1, unit: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 200, step: 1, unit: "%" },
  { key: "saturate", label: "Saturation", min: 0, max: 200, step: 1, unit: "%" },
  { key: "hueRotate", label: "Hue", min: -180, max: 180, step: 1, unit: "°" },
  { key: "blur", label: "Blur", min: 0, max: 12, step: 0.1, unit: "px" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%" },
  { key: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%" },
];

/** One-click looks, expressed as partial adjustment sets. */
export const PRESETS = [
  { id: "none", label: "Original", values: {} },
  {
    id: "punch",
    label: "Punch",
    values: { contrast: 128, saturate: 132, brightness: 104 },
  },
  {
    id: "mono",
    label: "Mono",
    values: { grayscale: 100, contrast: 118, brightness: 104 },
  },
  {
    id: "ember",
    label: "Ember",
    values: { sepia: 42, saturate: 140, hueRotate: -12, contrast: 112 },
  },
  {
    id: "cool",
    label: "Cool",
    values: { hueRotate: 18, saturate: 108, brightness: 102, contrast: 106 },
  },
  {
    id: "faded",
    label: "Faded",
    values: { contrast: 84, saturate: 78, brightness: 110 },
  },
];

/** Export targets. `jpg` and `jpeg` are the same encoder, different extension. */
export const EXPORT_FORMATS = [
  { id: "png", label: "PNG", mime: "image/png", extension: "png", lossy: false },
  { id: "jpg", label: "JPG", mime: "image/jpeg", extension: "jpg", lossy: true },
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", extension: "jpeg", lossy: true },
  { id: "webp", label: "WEBP", mime: "image/webp", extension: "webp", lossy: true },
];

/** Builds the `ctx.filter` string for a set of adjustments. */
export function toFilterString(adjustments) {
  const a = { ...DEFAULT_ADJUSTMENTS, ...adjustments };
  const parts = [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturate}%)`,
    `hue-rotate(${a.hueRotate}deg)`,
    `grayscale(${a.grayscale}%)`,
    `sepia(${a.sepia}%)`,
    `invert(${a.invert}%)`,
  ];
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
  return parts.join(" ");
}

/** True when every adjustment is still at its neutral value. */
export function isNeutral(adjustments) {
  return Object.entries(DEFAULT_ADJUSTMENTS).every(
    ([key, value]) => Number(adjustments[key]) === value,
  );
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

/**
 * Loads an image into a canvas without tainting it.
 *
 * The generated images live on a CDN, so the bytes are fetched and handed to
 * the decoder as a same-origin blob URL. That keeps `toBlob` usable even if the
 * CDN's CORS headers change; a direct cross-origin load is only the fallback.
 */
export async function loadImageToCanvas(src) {
  let objectUrl = null;
  try {
    const response = await fetch(src, { mode: "cors" });
    if (response.ok) {
      objectUrl = URL.createObjectURL(await response.blob());
    }
  } catch {
    // Fall through to a direct load below.
  }

  const image = new Image();
  if (!objectUrl) image.crossOrigin = "anonymous";

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The image could not be loaded."));
      image.src = objectUrl || src;
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }

  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  canvas.getContext("2d").drawImage(image, 0, 0);
  return canvas;
}

/** Reads a local `File` into a canvas. */
export async function loadFileToCanvas(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadImageToCanvas(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Returns a new canvas rotated by a multiple of 90°. */
export function rotateCanvas(source, degrees) {
  const quarter = ((degrees / 90) % 4 + 4) % 4;
  if (quarter === 0) return source;

  const swapped = quarter % 2 === 1;
  const canvas = createCanvas(
    swapped ? source.height : source.width,
    swapped ? source.width : source.height,
  );
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((quarter * 90 * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

/** Returns a new canvas mirrored on one axis. */
export function flipCanvas(source, axis) {
  const canvas = createCanvas(source.width, source.height);
  const ctx = canvas.getContext("2d");
  ctx.translate(axis === "x" ? canvas.width : 0, axis === "y" ? canvas.height : 0);
  ctx.scale(axis === "x" ? -1 : 1, axis === "y" ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/**
 * Cuts `rect` (normalised 0–1, relative to `source`) out into a new canvas.
 * Returns the source unchanged when the rectangle is the whole image.
 */
export function cropCanvas(source, rect) {
  const x = Math.round(rect.x * source.width);
  const y = Math.round(rect.y * source.height);
  const width = Math.round(rect.width * source.width);
  const height = Math.round(rect.height * source.height);

  if (width < 1 || height < 1) return source;
  if (x === 0 && y === 0 && width === source.width && height === source.height) {
    return source;
  }

  const canvas = createCanvas(width, height);
  canvas
    .getContext("2d")
    .drawImage(source, x, y, width, height, 0, 0, width, height);
  return canvas;
}

/** Scales a canvas to an exact pixel size. */
export function resizeCanvas(source, width, height) {
  if (width === source.width && height === source.height) return source;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Draws `source` through the adjustment filter onto `target`, sizing the
 * target to match. Used for both the on-screen preview and the export.
 */
export function paintWithAdjustments(target, source, adjustments) {
  const canvas = target || createCanvas(source.width, source.height);
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = toFilterString(adjustments);
  ctx.drawImage(source, 0, 0);
  ctx.filter = "none";
  return canvas;
}

/**
 * Renders the final image and encodes it.
 *
 * Formats without an alpha channel (JPEG) are flattened onto `background`
 * first, otherwise transparent pixels encode as black.
 */
export async function exportCanvas(
  source,
  { format, quality = 0.92, adjustments, background = "#ffffff" } = {},
) {
  const target = EXPORT_FORMATS.find((entry) => entry.id === format) ||
    EXPORT_FORMATS[0];

  const rendered = paintWithAdjustments(null, source, adjustments);

  let output = rendered;
  if (target.mime === "image/jpeg") {
    output = createCanvas(rendered.width, rendered.height);
    const ctx = output.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(rendered, 0, 0);
  }

  const blob = await new Promise((resolve, reject) => {
    output.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error(`This browser cannot export ${target.label}.`)),
      target.mime,
      target.lossy ? quality : undefined,
    );
  });

  return { blob, extension: target.extension, mime: target.mime };
}
