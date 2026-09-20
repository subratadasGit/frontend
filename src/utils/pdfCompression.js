/**
 * PDF compression.
 *
 * pdf-lib has no access to the raw image streams already embedded in a PDF,
 * so there is no way to losslessly re-encode "the pictures inside this file"
 * the way a desktop tool can. The lever that is actually available client-side
 * is the one every simple web-based PDF compressor uses: rasterise each page
 * with pdf.js and rebuild the document from those images at a chosen
 * resolution and JPEG quality.
 *
 * That trade-off is real and is surfaced rather than hidden: this produces a
 * smaller file at the cost of the text layer (no more selectable text or
 * copy-paste) and any vector crispness. It is the right tool for a scanned
 * document or an image-heavy export; a text-heavy PDF is usually already
 * small and rasterising it can make it *larger*, which is reported rather
 * than silently accepted.
 */

import { PDFDocument } from "pdf-lib";
import { baseNameOf, getPdfjs } from "./fileTools";

/** Presets shown as one-click choices; "Custom" hands the sliders to the user. */
export const COMPRESSION_PRESETS = [
  { id: "low", label: "Low", scale: 1.5, quality: 0.82 },
  { id: "medium", label: "Medium", scale: 1.15, quality: 0.68 },
  { id: "high", label: "High", scale: 0.85, quality: 0.5 },
  { id: "custom", label: "Custom", scale: null, quality: null },
];

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("This browser could not encode a page."))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Rasterises every page and rebuilds the PDF from the results.
 *
 * `scale` is relative to the page's own point size (1 ≈ 72 DPI, so 1.5 ≈
 * 108 DPI) — it is the resolution the page is rendered at before JPEG
 * encoding, independent of the page's physical size in the output, which is
 * kept identical to the source.
 */
export async function compressPdf(file, { scale = 1.15, quality = 0.68, onProgress } = {}) {
  const pdfjs = await getPdfjs();

  let sourceDoc;
  try {
    sourceDoc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch {
    throw new Error("This PDF could not be read. It may be password-protected or corrupt.");
  }

  const output = await PDFDocument.create();

  for (let number = 1; number <= sourceDoc.numPages; number += 1) {
    const page = await sourceDoc.getPage(number);
    // The page's native size (in points) is what the output page keeps —
    // only the pixel density used to rasterise it changes with `scale`.
    const nativeViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(renderViewport.width));
    canvas.height = Math.max(1, Math.ceil(renderViewport.height));
    const context = canvas.getContext("2d");
    // PDF pages have no background of their own; without this, anything
    // transparent turns black once flattened into a JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport: renderViewport }).promise;

    const jpegBlob = await canvasToJpegBlob(canvas, quality);
    const embedded = await output.embedJpg(await jpegBlob.arrayBuffer());

    const outputPage = output.addPage([nativeViewport.width, nativeViewport.height]);
    outputPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: nativeViewport.width,
      height: nativeViewport.height,
    });

    onProgress?.(number, sourceDoc.numPages);
  }

  output.setProducer("Creates.io");
  const compressedBytes = await output.save();
  const blob = new Blob([compressedBytes], { type: "application/pdf" });

  return {
    blob,
    name: `${baseNameOf(file.name)}-compressed.pdf`,
    pageCount: sourceDoc.numPages,
    originalSize: file.size,
    compressedSize: blob.size,
    grew: blob.size >= file.size,
  };
}
