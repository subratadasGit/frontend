/**
 * Verifies the vendored ThreeUI `halftone-flow` files against the hashes
 * published in the registry. Run after any dependency bump or merge that
 * touches `src/shaders/`:
 *
 *   npm run verify:shader
 *
 * Exits non-zero if a registered file has drifted.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Published at https://threeui.com/source-code/halftone-flow.json
const REGISTERED = {
  "src/shaders/neuform-isolated/NeuformCraftEffects.tsx":
    "0a1680c3c119dba8c61d946322afa0b64d36dfd80956fb5e7c3fd017d7bfa450",
  "src/shaders/neuform-isolated/sources/nexus-unified-flow.html":
    "fa1a015ae407dc2091c3c96239d28107e973cbc03aa7abef37dd5da791d5428b",
  "src/shaders/threeui.css":
    "efe4447139f1358dd8e9be68edf6fa46cbefbd1de423a4d6c439ca61d2c8eccf",
};

let failed = false;

for (const [path, expected] of Object.entries(REGISTERED)) {
  let actual;
  try {
    actual = createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
  } catch (error) {
    console.error(`MISSING  ${path} — ${error.message}`);
    failed = true;
    continue;
  }

  if (actual === expected) {
    console.log(`OK       ${path}`);
  } else {
    console.error(`MODIFIED ${path}\n  expected ${expected}\n  actual   ${actual}`);
    failed = true;
  }
}

if (failed) {
  console.error(
    "\nThe vendored ThreeUI source has been modified. Restore it from the registry.",
  );
  process.exit(1);
}

console.log("\nAll registered ThreeUI files match the published hashes.");
