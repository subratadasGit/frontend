import { useCallback, useEffect, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  PaneLabel,
  RangeField,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { generateUuids } from "../../../devtools/transforms/security";

/** Random (version 4) UUIDs from the platform CSPRNG. */
export default function UuidGenerator({ toolId }) {
  const [count, setCount] = useState(10);
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [uuids, setUuids] = useState([]);

  const generate = useCallback(() => {
    setUuids(generateUuids(count, { uppercase, braces }));
  }, [count, uppercase, braces]);

  // Generate on mount and whenever the options change, so the page is never
  // sitting empty waiting for a click.
  useEffect(() => {
    generate();
  }, [generate]);

  const text = uuids.join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Options</PaneLabel>
          <div className="space-y-5">
            <RangeField label="How many" value={count} onChange={setCount} min={1} max={200} />
            <CheckField label="Uppercase" checked={uppercase} onChange={setUppercase} />
            <CheckField label="Wrap in braces" checked={braces} onChange={setBraces} />
            <Btn onClick={generate} className="w-full">
              Regenerate
            </Btn>
          </div>
          <div className="mt-4">
            <ToolNote>
              Version 4 (random) UUIDs, drawn from the browser's cryptographic
              random number generator — not <code>Math.random()</code>.
            </ToolNote>
          </div>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <CopyButton value={text} label="Copy all" />
                <DownloadButton value={text} filename="uuids.txt" />
              </div>
            }
          >
            {uuids.length} UUID{uuids.length === 1 ? "" : "s"}
          </PaneLabel>
          <CodeField value={text} readOnly ariaLabel="Generated UUIDs" rows={16} />
        </Panel>
      </div>

      <RelatedTools ids={["password-generator", "hash-generator", "random-data-generator"]} />
    </DevToolPage>
  );
}
