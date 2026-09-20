import { useEffect, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { hashText } from "../../../devtools/transforms/security";

const ALGORITHMS = [
  { id: "MD5", note: "Broken for security — checksums and legacy interop only." },
  { id: "SHA-1", note: "Collision-prone; avoid for new signatures." },
  { id: "SHA-256", note: "The usual default." },
  { id: "SHA-384", note: null },
  { id: "SHA-512", note: null },
];

/** Hashes text with every common algorithm at once. */
export default function HashGenerator({ toolId }) {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState({});
  const [error, setError] = useState(null);

  // Hashing is async (Web Crypto), so results are sequenced with a cancel flag
  // to stop a slow earlier input overwriting a newer one.
  useEffect(() => {
    let cancelled = false;

    Promise.all(
      ALGORITHMS.map((algorithm) =>
        hashText(text, algorithm.id).then((digest) => [algorithm.id, digest]),
      ),
    )
      .then((entries) => {
        if (cancelled) return;
        setHashes(Object.fromEntries(entries));
        setError(null);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError({ message: caught.message });
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  const allHashes = ALGORITHMS.map((algorithm) => `${algorithm.id}: ${hashes[algorithm.id] || ""}`).join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setText} />
                <ClearButton onClick={() => setText("")} disabled={!text} />
              </div>
            }
          >
            Text
          </PaneLabel>
          <CodeField
            value={text}
            onChange={setText}
            placeholder="Type or paste the text to hash…"
            ariaLabel="Text to hash"
            rows={12}
          />
          <div className="mt-3">
            <ToolNote>
              Hashing runs locally through the Web Crypto API (MD5 is computed
              in JavaScript, since the platform does not offer it). Nothing you
              type is sent anywhere.
            </ToolNote>
          </div>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel right={<CopyButton value={allHashes} label="Copy all" />}>
            Digests
          </PaneLabel>

          <ToolErrorPanel error={error} />

          <div className="space-y-3">
            {ALGORITHMS.map((algorithm) => (
              <div key={algorithm.id} className="border border-white/[0.08] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[0.625rem] tracking-[0.16em] text-[#ff4d1c] uppercase">
                    {algorithm.id}
                  </span>
                  <CopyButton value={hashes[algorithm.id] || ""} label="Copy" />
                </div>
                <code className="mt-1.5 block font-mono text-xs break-all text-white/75">
                  {hashes[algorithm.id] || "—"}
                </code>
                {algorithm.note ? (
                  <p className="mt-1 text-[0.6875rem] text-white/35">{algorithm.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <RelatedTools ids={["base64", "uuid-generator", "jwt-inspector"]} />
    </DevToolPage>
  );
}
