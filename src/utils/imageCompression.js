/**
 * Client-side image compression.
 *
 * Re-encodes through canvas at a chosen quality, with an optional resize —
 * the same two levers every image compressor uses. `compressToTarget` adds a
 * binary search over JPEG/WEBP quality for people who have a size budget
 * ("under 200 KB") rather than a quality preference.
 */

import { loadFileToCanvas } from "./imageEditing";

const MIME_BY_FORMAT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

/** Downscales to fit within `maxDimension` on the longer side. No-op if smaller already. */
function fitWithin(canvas, maxDimension) {
  if (!maxDimension) return canvas;
  const longest = Math.max(canvas.width, canvas.height);
  if (longest <= maxDimension) return canvas;

  const scale = maxDimension / longest;
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(canvas.width * scale));
  output.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = output.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, output.width, output.height);
  return output;
}

/** JPEG has no alpha channel — flatten onto white first or transparency turns black. */
function flatten(canvas) {
  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height;
  const ctx = output.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.drawImage(canvas, 0, 0);
  return output;
}

function toBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`This browser cannot write ${mime}.`))),
      mime,
      quality,
    );
  });
}

/**
 * Compresses one image file at a fixed quality.
 *
 * `format: "keep"` re-encodes as the source's own format (falling back to PNG
 * for anything canvas can decode but that isn't itself a canvas export mime,
 * e.g. AVIF, GIF, SVG).
 */
export async function compressImage(file, { format = "keep", quality = 0.75, maxDimension = null } = {}) {
  const decoded = await loadFileToCanvas(file);
  const resized = fitWithin(decoded, maxDimension);

  const resolvedFormat =
    format === "keep" ? (MIME_BY_FORMAT[file.type?.split("/")[1]] ? file.type : "image/jpeg") : MIME_BY_FORMAT[format];
  const mime = MIME_BY_FORMAT[format] || resolvedFormat || "image/jpeg";
  const source = mime === "image/jpeg" ? flatten(resized) : resized;
  const isLossy = mime === "image/jpeg" || mime === "image/webp";

  const blob = await toBlob(source, mime, isLossy ? quality : undefined);

  return {
    blob,
    mime,
    width: resized.width,
    height: resized.height,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

/**
 * Binary-searches quality so the output lands at or under `targetBytes`.
 *
 * PNG has no quality knob, so a target is only meaningful for JPEG/WEBP —
 * callers should steer users there when a byte budget is the point.
 */
export async function compressToTarget(
  file,
  { format = "jpg", targetBytes, maxDimension = null, minQuality = 0.05, maxQuality = 0.95 } = {},
) {
  if (!MIME_BY_FORMAT[format] || format === "png") {
    throw new Error("A target size needs a lossy format — choose JPG or WEBP.");
  }

  const decoded = await loadFileToCanvas(file);
  const resized = fitWithin(decoded, maxDimension);
  const mime = MIME_BY_FORMAT[format];
  const source = mime === "image/jpeg" ? flatten(resized) : resized;

  let low = minQuality;
  let high = maxQuality;
  let best = await toBlob(source, mime, high);

  // The lowest quality still doesn't reach the target — that is the closest
  // this can get, so it is returned rather than silently accepted.
  const floor = await toBlob(source, mime, low);
  if (floor.size > targetBytes) {
    return {
      blob: floor,
      mime,
      width: resized.width,
      height: resized.height,
      originalSize: file.size,
      compressedSize: floor.size,
      reachedTarget: false,
      quality: low,
    };
  }

  // Each step depends on the previous one's result, so the loop is
  // intentionally sequential rather than run in parallel.
  for (let iteration = 0; iteration < 7; iteration += 1) {
    const midpoint = (low + high) / 2;
    const candidate = await toBlob(source, mime, midpoint);
    if (candidate.size > targetBytes) {
      high = midpoint;
    } else {
      low = midpoint;
      best = candidate;
    }
  }

  return {
    blob: best,
    mime,
    width: resized.width,
    height: resized.height,
    originalSize: file.size,
    compressedSize: best.size,
    reachedTarget: true,
    quality: low,
  };
}
