import { useCallback, useEffect, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  OptionGroup,
  PaneLabel,
  RangeField,
  RelatedTools,
} from "../../../components/devtools/DevToolUI";
import { generateLorem } from "../../../devtools/transforms/text";

const UNITS = [
  { id: "paragraphs", label: "Paragraphs" },
  { id: "sentences", label: "Sentences" },
  { id: "words", label: "Words" },
];

/** Placeholder copy, in paragraphs, sentences or words. */
export default function LoremGenerator({ toolId }) {
  const [unit, setUnit] = useState("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [wrapHtml, setWrapHtml] = useState(false);
  const [text, setText] = useState("");

  const generate = useCallback(() => {
    const output = generateLorem({ unit, count, startWithLorem });
    setText(
      wrapHtml
        ? output
            .split("\n\n")
            .map((block) => `<p>${block}</p>`)
            .join("\n")
        : output,
    );
  }, [unit, count, startWithLorem, wrapHtml]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Options</PaneLabel>
          <div className="space-y-5">
            <OptionGroup label="Unit" options={UNITS} value={unit} onChange={setUnit} />
            <RangeField
              label="How many"
              value={count}
              onChange={setCount}
              min={1}
              max={unit === "words" ? 200 : 30}
            />
            <CheckField
              label={'Start with "Lorem ipsum"'}
              checked={startWithLorem}
              onChange={setStartWithLorem}
            />
            <CheckField label="Wrap in <p> tags" checked={wrapHtml} onChange={setWrapHtml} />
            <Btn onClick={generate} className="w-full">
              Regenerate
            </Btn>
          </div>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <CopyButton value={text} label="Copy" />
                <DownloadButton
                  value={text}
                  filename={wrapHtml ? "lorem.html" : "lorem.txt"}
                  type={wrapHtml ? "text/html" : "text/plain"}
                />
              </div>
            }
          >
            Output
          </PaneLabel>
          <CodeField value={text} readOnly ariaLabel="Generated placeholder text" rows={18} />
        </Panel>
      </div>

      <RelatedTools ids={["random-data-generator", "text-counter", "case-converter"]} />
    </DevToolPage>
  );
}
