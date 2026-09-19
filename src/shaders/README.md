# ThreeUI — `halftone-flow`

Vendored from the ThreeUI registry. **Do not edit the registered files.**

- **Component:** `PredictiveArcCanvas`
- **Variant:** `halftone-flow`
- **Runtime:** Canvas 2D + Raw WebGL + Three.js r128
- **Source revision:** `SHA-256 fa86582fc870`
- **Registry:** https://threeui.com/source-code/halftone-flow.json

## Registered files

Retrieved and verified on integration; the in-repo copies hash-match the registry byte for byte.

| File | SHA-256 |
| --- | --- |
| `neuform-isolated/NeuformCraftEffects.tsx` | `0a1680c3c119dba8c61d946322afa0b64d36dfd80956fb5e7c3fd017d7bfa450` |
| `neuform-isolated/sources/nexus-unified-flow.html` | `fa1a015ae407dc2091c3c96239d28107e973cbc03aa7abef37dd5da791d5428b` |
| `threeui.css` | `efe4447139f1358dd8e9be68edf6fa46cbefbd1de423a4d6c439ca61d2c8eccf` |

Re-verify at any time:

```bash
npm run verify:shader
```

## Placeholder sources

`NeuformCraftEffects.tsx` statically imports seven sibling variants, but only
`nexus-unified-flow.html` ships with the `halftone-flow` package. The other six
files under `neuform-isolated/sources/` are **placeholders** that exist solely so
those imports resolve, which lets the registered component stay byte-exact
rather than being edited down to a single effect.

Only `HalftoneFlow` (`EFFECTS.nexusUnifiedFlow`) is rendered by this
application. It has no `presentation` adapter, so the string-rewriting code
paths that would touch the placeholder sources are never executed.

## How it renders

The registered component mounts the canonical HTML document in a sandboxed
`<iframe srcDoc>` and injects a focus stylesheet + script that isolates
`#glcanvas` as a full-bleed background layer. The WebGL context, the halftone
fragment shader, the `requestAnimationFrame` loop, and the resize handling all
live inside that document exactly as authored.

## Application-side wrapper

`src/components/shader/PredictiveArcCanvas.jsx` exposes the documented public
API (`variant` / `hue` / `saturation` / `brightness`) and adds **surrounding**
performance behaviour only — viewport-gated mounting and a reduced-motion
fallback. It never modifies the registered source.
