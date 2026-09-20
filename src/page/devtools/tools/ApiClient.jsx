import { useMemo, useRef, useState } from "react";
import { Btn, INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  OptionGroup,
  PaneLabel,
  RelatedTools,
  TextField,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { LoadingIcon, CrossIcon } from "../../../components/Icon";
import { formatJson } from "../../../devtools/transforms/json";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODYLESS = new Set(["GET", "HEAD"]);

const TABS = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "auth", label: "Auth" },
  { id: "body", label: "Body" },
];

const emptyRow = () => ({ key: "", value: "", enabled: true, id: crypto.randomUUID() });

const statusTone = (status) => {
  if (status >= 200 && status < 300) return "text-emerald-300 border-emerald-500/40";
  if (status >= 300 && status < 400) return "text-sky-300 border-sky-500/40";
  if (status >= 400 && status < 500) return "text-amber-300 border-amber-500/40";
  return "text-red-300 border-red-500/40";
};

const formatBytes = (bytes) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

/**
 * A real HTTP client.
 *
 * The request goes straight from the browser with `fetch`, which means the
 * same-origin policy applies exactly as it would in your own app: an endpoint
 * without permissive CORS headers will fail, and that failure is explained
 * rather than shown as a generic error. There is no proxy, so nothing you send
 * passes through this application's server.
 */
export default function ApiClient({ toolId }) {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [tab, setTab] = useState("params");
  const [params, setParams] = useState([emptyRow()]);
  const [headers, setHeaders] = useState([{ ...emptyRow(), key: "Accept", value: "application/json" }]);
  const [authType, setAuthType] = useState("none");
  const [bearer, setBearer] = useState("");
  const [basic, setBasic] = useState({ username: "", password: "" });
  const [body, setBody] = useState("");
  const [bodyType, setBodyType] = useState("json");

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [responseTab, setResponseTab] = useState("body");
  const abortRef = useRef(null);

  /** The URL with the enabled query parameters applied. */
  const effectiveUrl = useMemo(() => {
    const active = params.filter((row) => row.enabled && row.key.trim());
    if (active.length === 0) return url;
    try {
      const parsed = new URL(url);
      active.forEach((row) => parsed.searchParams.set(row.key, row.value));
      return parsed.toString();
    } catch {
      // Not a parseable URL yet — append manually so the preview still helps.
      const query = active
        .map((row) => `${encodeURIComponent(row.key)}=${encodeURIComponent(row.value)}`)
        .join("&");
      return `${url}${url.includes("?") ? "&" : "?"}${query}`;
    }
  }, [url, params]);

  const send = async () => {
    if (!url.trim()) {
      setError({ message: "Enter a URL to send a request." });
      return;
    }

    setSending(true);
    setError(null);
    setResponse(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const requestHeaders = {};
    headers.filter((row) => row.enabled && row.key.trim()).forEach((row) => {
      requestHeaders[row.key.trim()] = row.value;
    });

    if (authType === "bearer" && bearer.trim()) {
      requestHeaders.Authorization = `Bearer ${bearer.trim()}`;
    } else if (authType === "basic" && basic.username) {
      requestHeaders.Authorization = `Basic ${btoa(`${basic.username}:${basic.password}`)}`;
    }

    const hasBody = !BODYLESS.has(method) && body.trim();
    if (hasBody && !Object.keys(requestHeaders).some((key) => key.toLowerCase() === "content-type")) {
      requestHeaders["Content-Type"] =
        bodyType === "json" ? "application/json" : bodyType === "form" ? "application/x-www-form-urlencoded" : "text/plain";
    }

    const started = performance.now();
    try {
      const result = await fetch(effectiveUrl, {
        method,
        headers: requestHeaders,
        body: hasBody ? body : undefined,
        signal: controller.signal,
      });

      const elapsed = Math.round(performance.now() - started);
      const text = await result.text();
      const responseHeaders = [...result.headers.entries()].map(([key, value]) => ({ key, value }));

      setResponse({
        status: result.status,
        statusText: result.statusText,
        elapsed,
        size: new TextEncoder().encode(text).length,
        headers: responseHeaders,
        body: text,
        type: result.headers.get("content-type") || "",
        url: result.url,
      });
      setResponseTab("body");
    } catch (caught) {
      const elapsed = Math.round(performance.now() - started);
      if (caught.name === "AbortError") {
        setError({ message: "Request cancelled." });
      } else {
        setError({
          message: caught.message || "The request failed.",
          hint:
            "This runs in the browser, so the same-origin policy applies. A request to another origin needs that server to send permissive CORS headers — check the browser console for the exact rejection. A wrong URL, an offline host or a blocked mixed-content request look the same from here.",
          line: null,
        });
      }
      setResponse((current) => current || { failedAfter: elapsed });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const prettyBody = useMemo(() => {
    if (!response?.body) return "";
    try {
      return formatJson(response.body, 2);
    } catch {
      return response.body;
    }
  }, [response]);

  const isJson = response?.type?.includes("json") || (() => {
    try {
      JSON.parse(response?.body || "");
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <DevToolPage toolId={toolId}>
      {/* Request line */}
      <Panel className="mb-4 !p-4 sm:!p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="api-method">
            Method
          </label>
          <select
            id="api-method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className={`${INPUT} w-full appearance-none font-mono sm:w-36`}
          >
            {METHODS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="api-url">
            URL
          </label>
          <input
            id="api-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder="https://api.example.com/v1/items"
            spellCheck={false}
            className={`${INPUT} min-w-0 flex-1 font-mono`}
          />

          <div className="flex gap-2">
            <Btn onClick={send} disabled={sending} className="flex-1 sm:flex-none">
              {sending ? (
                <>
                  <LoadingIcon style="animate-spin h-4 w-4" />
                  Sending
                </>
              ) : (
                "Send"
              )}
            </Btn>
            {sending ? (
              <Btn variant="ghost" onClick={() => abortRef.current?.abort()}>
                Cancel
              </Btn>
            ) : null}
          </div>
        </div>

        {effectiveUrl !== url ? (
          <p className="mt-2 font-mono text-[0.6875rem] break-all text-white/35">{effectiveUrl}</p>
        ) : null}
      </Panel>

      {/* Request configuration */}
      <Panel className="mb-4 !p-4 sm:!p-5">
        <div className="mb-4">
          <OptionGroup
            options={TABS.map((entry) => ({
              id: entry.id,
              label:
                entry.id === "params"
                  ? `Params (${params.filter((row) => row.key.trim()).length})`
                  : entry.id === "headers"
                    ? `Headers (${headers.filter((row) => row.key.trim()).length})`
                    : entry.label,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "params" ? (
          <KeyValueEditor rows={params} onChange={setParams} keyPlaceholder="page" valuePlaceholder="2" />
        ) : null}

        {tab === "headers" ? (
          <KeyValueEditor
            rows={headers}
            onChange={setHeaders}
            keyPlaceholder="Content-Type"
            valuePlaceholder="application/json"
          />
        ) : null}

        {tab === "auth" ? (
          <div className="space-y-4">
            <OptionGroup
              label="Type"
              value={authType}
              onChange={setAuthType}
              options={[
                { id: "none", label: "None" },
                { id: "bearer", label: "Bearer" },
                { id: "basic", label: "Basic" },
              ]}
            />
            {authType === "bearer" ? (
              <TextField label="Token" value={bearer} onChange={setBearer} placeholder="eyJhbGci…" />
            ) : null}
            {authType === "basic" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Username"
                  value={basic.username}
                  onChange={(value) => setBasic((current) => ({ ...current, username: value }))}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={basic.password}
                  onChange={(value) => setBasic((current) => ({ ...current, password: value }))}
                />
              </div>
            ) : null}
            {authType !== "none" ? (
              <ToolNote>
                Credentials are used to build the Authorization header for this
                request only. They stay in the page and are never stored.
              </ToolNote>
            ) : null}
          </div>
        ) : null}

        {tab === "body" ? (
          BODYLESS.has(method) ? (
            <ToolNote>
              {method} requests do not carry a body. Switch the method to send one.
            </ToolNote>
          ) : (
            <div className="space-y-3">
              <OptionGroup
                label="Content type"
                value={bodyType}
                onChange={setBodyType}
                options={[
                  { id: "json", label: "JSON" },
                  { id: "text", label: "Text" },
                  { id: "form", label: "Form" },
                ]}
              />
              <CodeField
                value={body}
                onChange={setBody}
                placeholder={bodyType === "json" ? '{\n  "name": "Ada"\n}' : "key=value&other=1"}
                ariaLabel="Request body"
                rows={8}
              />
            </div>
          )
        ) : null}
      </Panel>

      <ToolErrorPanel error={error} />

      {/* Response */}
      {response && response.status !== undefined ? (
        <Panel className="!p-4 sm:!p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`border px-3 py-1.5 font-mono text-xs tracking-[0.1em] ${statusTone(response.status)}`}
            >
              {response.status} {response.statusText}
            </span>
            <span className="border border-white/10 px-3 py-1.5 font-mono text-xs text-white/60">
              {response.elapsed} ms
            </span>
            <span className="border border-white/10 px-3 py-1.5 font-mono text-xs text-white/60">
              {formatBytes(response.size)}
            </span>
            <div className="ml-auto flex gap-2">
              <CopyButton value={isJson ? prettyBody : response.body} label="Copy" />
              <DownloadButton
                value={isJson ? prettyBody : response.body}
                filename={isJson ? "response.json" : "response.txt"}
                type={isJson ? "application/json" : "text/plain"}
              />
            </div>
          </div>

          <div className="mb-3">
            <OptionGroup
              value={responseTab}
              onChange={setResponseTab}
              options={[
                { id: "body", label: isJson ? "JSON" : "Body" },
                { id: "raw", label: "Raw" },
                { id: "headers", label: `Headers (${response.headers.length})` },
              ]}
            />
          </div>

          {responseTab === "body" ? (
            <CodeField value={prettyBody} readOnly ariaLabel="Response body" rows={16} />
          ) : null}

          {responseTab === "raw" ? (
            <CodeField value={response.body} readOnly ariaLabel="Raw response" rows={16} />
          ) : null}

          {responseTab === "headers" ? (
            <dl className="border border-white/[0.08] px-3">
              {response.headers.map((header) => (
                <div
                  key={header.key}
                  className="flex flex-col gap-1 border-b border-white/[0.06] py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <dt className="shrink-0 font-mono text-[0.6875rem] text-[#ff4d1c] sm:w-56">
                    {header.key}
                  </dt>
                  <dd className="min-w-0 flex-1 font-mono text-xs break-all text-white/75">
                    {header.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-3">
            <ToolNote>
              Browsers only expose a limited set of response headers to scripts
              unless the server sends <code>Access-Control-Expose-Headers</code>,
              so this list can be shorter than what the server actually sent.
            </ToolNote>
          </div>
        </Panel>
      ) : null}

      <RelatedTools ids={["curl-to-fetch", "curl-to-axios", "headers-inspector", "http-status-lookup"]} />
    </DevToolPage>
  );
}

/** Editable list of enabled key/value pairs, used for params and headers. */
function KeyValueEditor({ rows, onChange, keyPlaceholder, valuePlaceholder }) {
  const update = (id, patch) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const remove = (id) => {
    const next = rows.filter((row) => row.id !== id);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => update(row.id, { enabled: event.target.checked })}
            aria-label={`Enable ${row.key || "row"}`}
            className="h-3.5 w-3.5 shrink-0 accent-[#ff4d1c]"
          />
          <input
            value={row.key}
            onChange={(event) => update(row.id, { key: event.target.value })}
            placeholder={keyPlaceholder}
            aria-label="Name"
            spellCheck={false}
            className={`${INPUT} min-w-0 flex-1 font-mono !py-2`}
          />
          <input
            value={row.value}
            onChange={(event) => update(row.id, { value: event.target.value })}
            placeholder={valuePlaceholder}
            aria-label="Value"
            spellCheck={false}
            className={`${INPUT} min-w-0 flex-1 font-mono !py-2`}
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            aria-label="Remove row"
            className="shrink-0 p-2 text-white/30 transition-colors hover:text-red-400"
          >
            <CrossIcon style="w-4 h-4" />
          </button>
        </div>
      ))}
      <Btn variant="ghost" onClick={() => onChange([...rows, emptyRow()])} className="!px-3 !py-2">
        Add row
      </Btn>
    </div>
  );
}
