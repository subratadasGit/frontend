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

/** What each header actually does, for the ones worth explaining. */
const EXPLANATIONS = {
  "content-type": "The media type of the body, and its charset.",
  "content-length": "Body size in bytes.",
  "content-encoding": "Compression applied to the body (gzip, br, deflate).",
  "cache-control": "How caches may store and reuse this response.",
  etag: "Version identifier — paired with If-None-Match for conditional requests.",
  "last-modified": "When the resource last changed; paired with If-Modified-Since.",
  expires: "Legacy expiry date. Cache-Control takes precedence.",
  vary: "Which request headers the response varies by, so caches key correctly.",
  "set-cookie": "Sets a cookie. Check for Secure, HttpOnly and SameSite.",
  authorization: "Credentials for the request (Bearer, Basic, …).",
  "access-control-allow-origin": "Which origins may read this response. CORS.",
  "access-control-allow-methods": "Methods permitted for cross-origin requests.",
  "access-control-allow-headers": "Request headers permitted cross-origin.",
  "access-control-expose-headers": "Response headers scripts are allowed to read.",
  "access-control-allow-credentials": "Whether cookies may be sent cross-origin.",
  "strict-transport-security": "Forces HTTPS for this host (HSTS).",
  "content-security-policy": "Restricts what the page may load and execute.",
  "x-content-type-options": "`nosniff` stops the browser guessing the media type.",
  "x-frame-options": "Legacy clickjacking protection; superseded by CSP frame-ancestors.",
  "referrer-policy": "How much referrer information is sent with requests.",
  "permissions-policy": "Which browser features the page may use.",
  location: "Redirect target, or the URL of a newly created resource.",
  server: "Server software. Often worth removing in production.",
  "retry-after": "How long to wait before retrying, after a 429 or 503.",
  "x-powered-by": "Framework disclosure — usually worth removing.",
  "transfer-encoding": "How the body is framed on the wire (usually chunked).",
  connection: "Whether the connection stays open.",
  date: "When the response was generated.",
  allow: "Methods the resource supports. Sent with 405 responses.",
};

/** Security headers whose absence is worth pointing out. */
const SECURITY_HEADERS = [
  { name: "strict-transport-security", why: "Forces HTTPS on later visits." },
  { name: "content-security-policy", why: "The main defence against injected scripts." },
  { name: "x-content-type-options", why: "Stops media-type sniffing." },
  { name: "referrer-policy", why: "Limits what leaks in the Referer header." },
];

const SAMPLE = `HTTP/2 200
content-type: application/json; charset=utf-8
cache-control: public, max-age=3600
etag: "a1b2c3"
access-control-allow-origin: *
server: nginx
x-powered-by: Express`;

/** Parses a pasted header block and explains what each header does. */
export default function HeadersInspector({ toolId }) {
  const [text, setText] = useState(SAMPLE);

  const { statusLine, headers } = useMemo(() => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let status = null;
    const parsed = [];

    for (const line of lines) {
      if (/^HTTP\/[\d.]+\s/i.test(line) || /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/i.test(line)) {
        status = line;
        continue;
      }
      const separator = line.indexOf(":");
      if (separator <= 0) continue;
      const name = line.slice(0, separator).trim();
      parsed.push({
        name,
        lower: name.toLowerCase(),
        value: line.slice(separator + 1).trim(),
      });
    }

    return { statusLine: status, headers: parsed };
  }, [text]);

  const present = new Set(headers.map((header) => header.lower));
  const missing = SECURITY_HEADERS.filter((entry) => !present.has(entry.name));

  const asJson = JSON.stringify(
    Object.fromEntries(headers.map((header) => [header.name, header.value])),
    null,
    2,
  );

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
            Raw headers
          </PaneLabel>
          <CodeField
            value={text}
            onChange={setText}
            placeholder={"content-type: application/json\ncache-control: no-store"}
            ariaLabel="Raw headers"
            rows={14}
          />
          <div className="mt-3">
            <ToolNote>
              Paste from your browser's network panel, a <code>curl -i</code>{" "}
              response, or server logs. One <code>Name: value</code> per line.
            </ToolNote>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={headers.length ? <CopyButton value={asJson} label="Copy JSON" /> : null}>
              {headers.length} header{headers.length === 1 ? "" : "s"}
            </PaneLabel>

            {statusLine ? (
              <p className="mb-3 border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-xs text-white/70">
                {statusLine}
              </p>
            ) : null}

            {headers.length === 0 ? (
              <ToolNote>Nothing parsed yet — paste a header block to begin.</ToolNote>
            ) : (
              <dl className="border border-white/[0.08] px-3">
                {headers.map((header, index) => (
                  <div key={`${header.lower}-${index}`} className="border-b border-white/[0.06] py-2.5 last:border-0">
                    <dt className="font-mono text-[0.6875rem] text-[#ff4d1c]">{header.name}</dt>
                    <dd className="mt-0.5 font-mono text-xs break-all text-white/80">{header.value}</dd>
                    {EXPLANATIONS[header.lower] ? (
                      <p className="mt-1 text-xs text-white/40">{EXPLANATIONS[header.lower]}</p>
                    ) : null}
                  </div>
                ))}
              </dl>
            )}
          </Panel>

          {headers.length > 0 && missing.length > 0 ? (
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Security headers not present</PaneLabel>
              <ul className="space-y-2">
                {missing.map((entry) => (
                  <li key={entry.name} className="border-l-2 border-amber-500/50 bg-white/[0.02] px-3 py-2">
                    <code className="font-mono text-xs text-amber-300">{entry.name}</code>
                    <p className="mt-0.5 text-xs text-white/45">{entry.why}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <ToolNote>
                  Absence here is a prompt to check, not a verdict — some of
                  these are set at the CDN or only matter for HTML responses.
                </ToolNote>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <RelatedTools ids={["api-client", "http-status-lookup", "user-agent-parser"]} />
    </DevToolPage>
  );
}
