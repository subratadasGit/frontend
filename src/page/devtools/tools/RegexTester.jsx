import { Fragment, useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";

const FLAGS = [
  { id: "g", label: "g", hint: "global — find every match, not just the first" },
  { id: "i", label: "i", hint: "ignore case" },
  { id: "m", label: "m", hint: "multiline — ^ and $ match line boundaries" },
  { id: "s", label: "s", hint: "dotAll — . also matches newlines" },
  { id: "u", label: "u", hint: "unicode" },
  { id: "y", label: "y", hint: "sticky — match only from lastIndex" },
];

const CHEATSHEET = [
  { token: "\\d", meaning: "digit" },
  { token: "\\w", meaning: "word character" },
  { token: "\\s", meaning: "whitespace" },
  { token: ".", meaning: "any character" },
  { token: "^ $", meaning: "start / end" },
  { token: "*  +  ?", meaning: "0+, 1+, optional" },
  { token: "{n,m}", meaning: "n to m times" },
  { token: "(…)", meaning: "capture group" },
  { token: "(?:…)", meaning: "non-capturing" },
  { token: "(?<name>…)", meaning: "named group" },
  { token: "[abc]", meaning: "character set" },
  { token: "a|b", meaning: "alternation" },
];

const SAMPLE_TEXT = `Contact ada@example.com or grace@navy.mil.
Order #10429 shipped on 2026-03-14.
Call +1 415 555 0142 between 09:00 and 17:00.`;

/**
 * Live regular expression testing with match highlighting and capture groups.
 *
 * Matching is guarded two ways: a global regex is stepped manually so a
 * zero-length match cannot spin forever, and the number of matches is capped.
 */
export default function RegexTester({ toolId }) {
  const [pattern, setPattern] = useState("(\\w+)@([\\w.]+)");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false, y: false });
  const [text, setText] = useState(SAMPLE_TEXT);
  const [activeMatch, setActiveMatch] = useState(0);

  const flagString = Object.entries(flags)
    .filter(([, on]) => on)
    .map(([flag]) => flag)
    .join("");

  const { matches, error, regex } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, regex: null };

    let expression;
    try {
      expression = new RegExp(pattern, flagString);
    } catch (caught) {
      return { matches: [], error: { message: caught.message, hint: "Check the escaping and bracket balance." }, regex: null };
    }

    const found = [];
    if (!flags.g && !flags.y) {
      const single = expression.exec(text);
      if (single) {
        found.push({ index: single.index, value: single[0], groups: single.slice(1), named: single.groups });
      }
    } else {
      const walker = new RegExp(pattern, flagString.includes("g") ? flagString : `${flagString}g`);
      let match;
      // Cap the result set: a pathological pattern on a large paste should not
      // lock the page up building a list nobody will read.
      while (found.length < 500 && (match = walker.exec(text)) !== null) {
        found.push({ index: match.index, value: match[0], groups: match.slice(1), named: match.groups });
        // A zero-length match does not advance lastIndex on its own.
        if (match[0] === "") walker.lastIndex += 1;
      }
    }

    return { matches: found, error: null, regex: expression };
  }, [pattern, flagString, flags.g, flags.y, text]);

  // Build the highlighted view as alternating plain and marked segments.
  const segments = useMemo(() => {
    if (matches.length === 0) return [{ text, match: null }];
    const parts = [];
    let cursor = 0;
    matches.forEach((match, index) => {
      if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), match: null });
      parts.push({ text: match.value, match: index });
      cursor = match.index + match.value.length;
    });
    if (cursor < text.length) parts.push({ text: text.slice(cursor), match: null });
    return parts;
  }, [matches, text]);

  const current = matches[activeMatch] || matches[0];

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <label
          htmlFor="regex-pattern"
          className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase"
        >
          Pattern
        </label>
        <div className="flex items-stretch">
          <span className="flex items-center border border-r-0 border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white/35">
            /
          </span>
          <input
            id="regex-pattern"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="(\\w+)@([\\w.]+)"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className={`${INPUT} rounded-none border-x-0 font-mono ${error ? "border-red-500/60" : ""}`}
          />
          <span className="flex items-center border border-l-0 border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white/35">
            /{flagString}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-white/35 uppercase">
            Flags
          </span>
          {FLAGS.map((flag) => (
            <label key={flag.id} title={flag.hint} className="flex items-center gap-1.5 text-sm text-white/65">
              <input
                type="checkbox"
                checked={flags[flag.id]}
                onChange={(event) => setFlags((current_) => ({ ...current_, [flag.id]: event.target.checked }))}
                className="h-3.5 w-3.5 accent-[#ff4d1c]"
              />
              <code className="font-mono">{flag.label}</code>
            </label>
          ))}
        </div>

        {error ? (
          <div className="mt-4">
            <ToolErrorPanel error={error} />
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Test text</PaneLabel>
          <CodeField value={text} onChange={setText} ariaLabel="Test text" rows={12} />
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <span
                className={`font-mono text-[0.625rem] tracking-[0.14em] uppercase ${
                  matches.length > 0 ? "text-[#ff4d1c]" : "text-white/30"
                }`}
                aria-live="polite"
              >
                {matches.length} match{matches.length === 1 ? "" : "es"}
                {matches.length === 500 ? " (capped)" : ""}
              </span>
            }
          >
            Result
          </PaneLabel>

          <div className="max-h-72 overflow-auto border border-white/10 bg-black p-3 font-mono text-[0.8125rem] leading-[1.55rem] break-words whitespace-pre-wrap text-white/80">
            {segments.map((segment, index) =>
              segment.match === null ? (
                <Fragment key={index}>{segment.text}</Fragment>
              ) : (
                <mark
                  key={index}
                  className="match-highlight text-white"
                  data-active={segment.match === activeMatch}
                  onClick={() => setActiveMatch(segment.match)}
                >
                  {segment.text}
                </mark>
              ),
            )}
          </div>

          {matches.length > 0 ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[0.625rem] tracking-[0.16em] text-white/35 uppercase">
                  Match {activeMatch + 1} of {matches.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMatch((index) => Math.max(0, index - 1))}
                    disabled={activeMatch === 0}
                    className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60 transition-colors hover:border-white/35 hover:text-white disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMatch((index) => Math.min(matches.length - 1, index + 1))}
                    disabled={activeMatch >= matches.length - 1}
                    className="border border-white/10 px-2.5 py-1 font-mono text-[0.625rem] text-white/60 transition-colors hover:border-white/35 hover:text-white disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>

              {current ? (
                <dl className="mt-3 border border-white/[0.08] px-3">
                  <Row label="Match" value={current.value} />
                  <Row label="Index" value={String(current.index)} />
                  {current.groups.map((group, index) => (
                    <Row
                      key={index}
                      label={`Group ${index + 1}`}
                      value={group === undefined ? "(no match)" : group}
                    />
                  ))}
                  {Object.entries(current.named || {}).map(([name, value]) => (
                    <Row key={name} label={name} value={value ?? "(no match)"} />
                  ))}
                </dl>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton
                  value={matches.map((match) => match.value).join("\n")}
                  label="Copy matches"
                />
                <CopyButton value={regex ? String(regex) : ""} label="Copy regex" />
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <ToolNote>
                {pattern && !error
                  ? "No matches in the test text."
                  : "Enter a pattern to see matches highlighted as you type."}
              </ToolNote>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-4">
        <PaneLabel>Reference</PaneLabel>
        <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {CHEATSHEET.map((entry) => (
            <div key={entry.token} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5">
              <code className="font-mono text-xs text-[#ff4d1c]">{entry.token}</code>
              <span className="text-xs text-white/45">{entry.meaning}</span>
            </div>
          ))}
        </div>
      </Panel>

      <RelatedTools ids={["diff-checker", "json-schema-validator", "cron-tester"]} />
    </DevToolPage>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 font-mono text-[0.625rem] tracking-[0.14em] text-white/35 uppercase sm:w-24">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 font-mono text-xs break-all text-white/80">{value}</dd>
    </div>
  );
}
