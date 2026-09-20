import { useEffect, useRef, useState } from "react";
import {
  Btn,
  INPUT,
  LABEL,
  Page,
  PageHeader,
  Panel,
} from "../../components/ui/AppUI";
import { PrivacyNote, ToolError } from "../../components/tools/FileTools";
import { Download } from "../../components/Icon";
import { downloadBlob } from "../../utils/global";
import {
  ERROR_LEVELS,
  QR_TYPES,
  buildPayload,
  qrToSvgString,
  renderQrToCanvas,
} from "../../utils/qrTools";

const DEFAULT_FIELDS = {
  text: { text: "https://creates.io" },
  wifi: { ssid: "", password: "", security: "WPA", hidden: false },
  email: { to: "", subject: "", body: "" },
  sms: { number: "", body: "" },
  phone: { number: "" },
  vcard: { name: "", phone: "", email: "", org: "", title: "", url: "" },
};

/** QR codes, built from plain text or one of five structured content types. */
export default function QrGenerator() {
  const canvasRef = useRef(null);
  const [type, setType] = useState("text");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState("M");
  const [dark, setDark] = useState("#050505");
  const [light, setLight] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState("");

  const values = fields[type];
  const setField = (key, value) =>
    setFields((current) => ({ ...current, [type]: { ...current[type], [key]: value } }));

  // Chained through promises end to end — including the synchronous
  // `buildPayload` validation — so every state update happens inside a
  // `.then()`/`.catch()` callback rather than directly in the effect body.
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;

    Promise.resolve()
      .then(() => buildPayload(type, values))
      .then((built) =>
        renderQrToCanvas(canvas, built, {
          size,
          margin,
          errorCorrectionLevel: level,
          dark,
          light,
        }).then(() => built),
      )
      .then((built) => {
        if (cancelled) return;
        setPayload(built);
        setError(null);
      })
      .catch((caught) => {
        if (cancelled) return;
        setPayload("");
        setError(caught.message || "This content could not be encoded.");
        const ctx = canvas?.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      });

    return () => {
      cancelled = true;
    };
  }, [type, values, size, margin, level, dark, light]);

  const exportPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "qr-code.png");
    }, "image/png");
  };

  const exportSvg = async () => {
    try {
      const svg = await qrToSvgString(payload, { margin, errorCorrectionLevel: level, dark, light });
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg");
    } catch (caught) {
      setError(caught.message);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="QR Code Generator"
        description="Text, a link, Wi-Fi credentials, a contact card — pick what you're encoding and it renders as you type."
        actions={
          <Btn to="/tools" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap gap-1.5">
              {QR_TYPES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setType(entry.id)}
                  aria-pressed={type === entry.id}
                  className={`border px-3 py-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors ${
                    type === entry.id
                      ? "border-[#ff4d1c] text-[#ff4d1c]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {type === "text" ? (
                <Field label="Text or URL">
                  <textarea
                    rows={4}
                    value={values.text}
                    onChange={(event) => setField("text", event.target.value)}
                    placeholder="https://example.com"
                    className={`${INPUT} resize-y`}
                  />
                </Field>
              ) : null}

              {type === "wifi" ? (
                <>
                  <Field label="Network name (SSID)">
                    <input
                      value={values.ssid}
                      onChange={(event) => setField("ssid", event.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Security">
                      <select
                        value={values.security}
                        onChange={(event) => setField("security", event.target.value)}
                        className={`${INPUT} appearance-none`}
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Open (no password)</option>
                      </select>
                    </Field>
                    {values.security !== "nopass" ? (
                      <Field label="Password">
                        <input
                          value={values.password}
                          onChange={(event) => setField("password", event.target.value)}
                          className={INPUT}
                        />
                      </Field>
                    ) : null}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input
                      type="checkbox"
                      checked={values.hidden}
                      onChange={(event) => setField("hidden", event.target.checked)}
                      className="h-3.5 w-3.5 accent-[#ff4d1c]"
                    />
                    Hidden network
                  </label>
                </>
              ) : null}

              {type === "email" ? (
                <>
                  <Field label="To">
                    <input
                      type="email"
                      value={values.to}
                      onChange={(event) => setField("to", event.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Subject (optional)">
                    <input
                      value={values.subject}
                      onChange={(event) => setField("subject", event.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Body (optional)">
                    <textarea
                      rows={3}
                      value={values.body}
                      onChange={(event) => setField("body", event.target.value)}
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                </>
              ) : null}

              {type === "sms" ? (
                <>
                  <Field label="Phone number">
                    <input
                      value={values.number}
                      onChange={(event) => setField("number", event.target.value)}
                      placeholder="+1 415 555 0100"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Message (optional)">
                    <textarea
                      rows={3}
                      value={values.body}
                      onChange={(event) => setField("body", event.target.value)}
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                </>
              ) : null}

              {type === "phone" ? (
                <Field label="Phone number">
                  <input
                    value={values.number}
                    onChange={(event) => setField("number", event.target.value)}
                    placeholder="+1 415 555 0100"
                    className={INPUT}
                  />
                </Field>
              ) : null}

              {type === "vcard" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={values.name}
                        onChange={(event) => setField("name", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Title (optional)">
                      <input
                        value={values.title}
                        onChange={(event) => setField("title", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Organization (optional)">
                      <input
                        value={values.org}
                        onChange={(event) => setField("org", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Phone (optional)">
                      <input
                        value={values.phone}
                        onChange={(event) => setField("phone", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email (optional)">
                      <input
                        type="email"
                        value={values.email}
                        onChange={(event) => setField("email", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Website (optional)">
                      <input
                        value={values.url}
                        onChange={(event) => setField("url", event.target.value)}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                </>
              ) : null}
            </div>
          </Panel>

          <ToolError>{error}</ToolError>
        </div>

        <Panel className="h-fit">
          <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Preview
          </h2>

          <div className="mt-5 flex items-center justify-center border border-white/[0.08] bg-white p-6">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="qr-size" className={LABEL}>
                Size — {size}px
              </label>
              <input
                id="qr-size"
                type="range"
                min="160"
                max="1024"
                step="16"
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="editor-range w-full"
              />
            </div>

            <div>
              <label htmlFor="qr-margin" className={LABEL}>
                Margin — {margin} modules
              </label>
              <input
                id="qr-margin"
                type="range"
                min="0"
                max="8"
                step="1"
                value={margin}
                onChange={(event) => setMargin(Number(event.target.value))}
                className="editor-range w-full"
              />
            </div>

            <div>
              <span className={LABEL}>Error correction</span>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_LEVELS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setLevel(entry.id)}
                    title={entry.hint}
                    aria-pressed={level === entry.id}
                    className={`border px-3 py-1.5 font-mono text-[0.625rem] uppercase transition-colors ${
                      level === entry.id
                        ? "border-[#ff4d1c] text-[#ff4d1c]"
                        : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Foreground">
                <input
                  type="color"
                  value={dark}
                  onChange={(event) => setDark(event.target.value)}
                  className="h-10 w-full cursor-pointer border border-white/10 bg-transparent"
                />
              </Field>
              <Field label="Background">
                <input
                  type="color"
                  value={light}
                  onChange={(event) => setLight(event.target.value)}
                  className="h-10 w-full cursor-pointer border border-white/10 bg-transparent"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Btn onClick={exportPng} disabled={!payload}>
              <Download style="w-4 h-4" />
              PNG
            </Btn>
            <Btn variant="ghost" onClick={exportSvg} disabled={!payload}>
              <Download style="w-4 h-4" />
              SVG
            </Btn>
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <PrivacyNote />
          </div>
        </Panel>
      </div>
    </Page>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}
