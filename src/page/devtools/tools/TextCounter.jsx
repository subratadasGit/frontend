import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { countText } from "../../../devtools/transforms/text";

/** Common platform limits, so the count means something. */
const LIMITS = [
  { label: "SMS segment", limit: 160, field: "characters" },
  { label: "Tweet", limit: 280, field: "characters" },
  { label: "Meta description", limit: 160, field: "characters" },
  { label: "Title tag", limit: 60, field: "characters" },
];

/** Characters, words, lines, sentences, bytes and reading time. */
export default function TextCounter({ toolId }) {
  const [text, setText] = useState("");

  const stats = useMemo(() => countText(text), [text]);

  const frequency = useMemo(() => {
    const words = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
    const counts = new Map();
    words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [text]);

  const readingTime =
    stats.readingSeconds < 60
      ? `${stats.readingSeconds}s`
      : `${Math.round(stats.readingSeconds / 60)} min`;

  const summary = [
    `Characters: ${stats.characters}`,
    `Characters (no spaces): ${stats.charactersNoSpaces}`,
    `Words: ${stats.words}`,
    `Lines: ${stats.lines}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Sentences: ${stats.sentences}`,
    `Bytes (UTF-8): ${stats.bytes}`,
    `Reading time: ${readingTime}`,
  ].join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
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
            placeholder="Type or paste text to count…"
            ariaLabel="Text to count"
            rows={18}
          />
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={summary} label="Copy" />}>Counts</PaneLabel>
            <div className="grid grid-cols-2 gap-px bg-white/[0.08]" aria-live="polite">
              <Stat label="Characters" value={stats.characters} />
              <Stat label="No spaces" value={stats.charactersNoSpaces} />
              <Stat label="Words" value={stats.words} />
              <Stat label="Lines" value={stats.lines} />
              <Stat label="Paragraphs" value={stats.paragraphs} />
              <Stat label="Sentences" value={stats.sentences} />
              <Stat label="Bytes (UTF-8)" value={stats.bytes} />
              <Stat label="Reading time" value={readingTime} />
            </div>
            {stats.bytes !== stats.characters ? (
              <div className="mt-3">
                <ToolNote>
                  Bytes exceed characters because some characters need more than
                  one byte in UTF-8 — worth knowing when a column has a byte limit.
                </ToolNote>
              </div>
            ) : null}
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Against common limits</PaneLabel>
            <ul className="space-y-2.5">
              {LIMITS.map((entry) => {
                const value = stats[entry.field];
                const ratio = Math.min(1, value / entry.limit);
                const over = value > entry.limit;
                return (
                  <li key={entry.label}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-white/55">{entry.label}</span>
                      <span className={`font-mono ${over ? "text-red-400" : "text-white/45"}`}>
                        {value} / {entry.limit}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-white/10">
                      <div
                        className={`h-full transition-all duration-300 ${over ? "bg-red-500" : "bg-[#ff4d1c]"}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {frequency.length > 0 ? (
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Most frequent words</PaneLabel>
              <ul className="space-y-1">
                {frequency.map(([word, count]) => (
                  <li key={word} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5 text-xs">
                    <span className="truncate font-mono text-white/70">{word}</span>
                    <span className="font-mono text-white/35">{count}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      <RelatedTools ids={["case-converter", "slug-generator", "lorem-generator"]} />
    </DevToolPage>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-[#0a0a0a] p-3">
      <span className="block font-mono text-[0.5625rem] tracking-[0.16em] text-white/30 uppercase">
        {label}
      </span>
      <span className="font-mono text-lg text-white/85 tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
