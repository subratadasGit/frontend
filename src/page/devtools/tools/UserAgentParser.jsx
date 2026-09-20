import { useMemo, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DataRow,
  DevToolPage,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { parseUserAgent } from "../../../devtools/transforms/dev";

const SAMPLES = [
  {
    label: "Chrome on Windows",
    value:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  {
    label: "Safari on iPhone",
    value:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  },
  {
    label: "Firefox on macOS",
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
  },
  { label: "Googlebot", value: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
];

/** Identifies browser, engine, OS and device from a user-agent string. */
export default function UserAgentParser({ toolId }) {
  const [text, setText] = useState("");

  const { parsed, error } = useMemo(() => {
    if (!text.trim()) return { parsed: null, error: null };
    try {
      return { parsed: parseUserAgent(text), error: null };
    } catch (caught) {
      return { parsed: null, error: { message: caught.message } };
    }
  }, [text]);

  const asJson = parsed ? JSON.stringify({ ...parsed, raw: undefined }, null, 2) : "";

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <PaneLabel
          right={
            <div className="flex gap-2">
              <PasteButton onPaste={setText} />
              <Btn
                variant="ghost"
                className="!px-3 !py-2"
                onClick={() => setText(navigator.userAgent)}
              >
                Use mine
              </Btn>
            </div>
          }
        >
          User-agent string
        </PaneLabel>
        <CodeField
          value={text}
          onChange={setText}
          placeholder="Mozilla/5.0 (…) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          ariaLabel="User agent string"
          rows={4}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => setText(sample.value)}
              className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </Panel>

      <ToolErrorPanel error={error} />

      {parsed ? (
        <>
          {parsed.bot ? (
            <div className="mb-4 border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
              This looks like a bot or crawler rather than a person's browser.
            </div>
          ) : null}

          <Panel>
            <PaneLabel right={<CopyButton value={asJson} label="Copy JSON" />}>Parsed</PaneLabel>
            <dl>
              <DataRow label="Browser" value={`${parsed.browser} ${parsed.browserVersion}`} />
              <DataRow label="Engine" value={parsed.engine} />
              <DataRow label="Operating system" value={`${parsed.os} ${parsed.osVersion}`} />
              <DataRow label="Device type" value={parsed.device} />
              <DataRow label="Bot" value={parsed.bot ? "Yes" : "No"} />
            </dl>
            <div className="mt-4">
              <ToolNote>
                User-agent strings are deliberately misleading for historical
                reasons — Chrome claims to be Safari, Edge claims to be Chrome.
                This reads the tokens in the order that resolves those claims,
                but for feature decisions prefer feature detection or{" "}
                <code>navigator.userAgentData</code>.
              </ToolNote>
            </div>
          </Panel>
        </>
      ) : null}

      <RelatedTools ids={["headers-inspector", "http-status-lookup", "url-parser"]} />
    </DevToolPage>
  );
}
