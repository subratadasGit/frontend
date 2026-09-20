import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
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
import { decodeJwt, describeJwtClaims, jwtExpiry } from "../../../devtools/transforms/security";

const formatTime = (seconds) => {
  if (typeof seconds !== "number") return null;
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
};

const relative = (seconds) => {
  const delta = seconds * 1000 - Date.now();
  const absolute = Math.abs(delta);
  const units = [
    { limit: 60000, divisor: 1000, unit: "second" },
    { limit: 3600000, divisor: 60000, unit: "minute" },
    { limit: 86400000, divisor: 3600000, unit: "hour" },
    { limit: Infinity, divisor: 86400000, unit: "day" },
  ];
  const { divisor, unit } = units.find((entry) => absolute < entry.limit);
  const amount = Math.round(absolute / divisor);
  return delta >= 0
    ? `in ${amount} ${unit}${amount === 1 ? "" : "s"}`
    : `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
};

/**
 * Decodes a JWT in the browser and explains its claims.
 *
 * The signature is displayed but never verified: doing so would mean asking
 * for the signing secret, and a dev tool has no business holding one.
 */
export default function JwtInspector({ toolId }) {
  const [token, setToken] = useState("");

  const { decoded, error } = useMemo(() => {
    if (!token.trim()) return { decoded: null, error: null };
    try {
      return { decoded: decodeJwt(token), error: null };
    } catch (caught) {
      return { decoded: null, error: { message: caught.message } };
    }
  }, [token]);

  const claims = decoded ? describeJwtClaims(decoded.payload) : null;
  const expiry = decoded ? jwtExpiry(decoded.payload) : null;

  return (
    <DevToolPage toolId={toolId}>
      <Panel className="mb-4">
        <PaneLabel
          right={
            <div className="flex gap-2">
              <PasteButton onPaste={setToken} />
              <ClearButton onClick={() => setToken("")} disabled={!token} />
            </div>
          }
        >
          Token
        </PaneLabel>
        <CodeField
          value={token}
          onChange={setToken}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.signature"
          ariaLabel="JWT to decode"
          rows={5}
        />
        <div className="mt-3">
          <ToolNote>
            Decoding happens entirely in this browser. The signature is shown but
            not verified — that would require the signing secret, which this tool
            never asks for and never transmits.
          </ToolNote>
        </div>
      </Panel>

      <ToolErrorPanel error={error} />

      {decoded ? (
        <>
          {expiry ? (
            <div
              className={`mb-4 border px-4 py-3 text-sm ${
                expiry.expired
                  ? "border-red-500/30 bg-red-500/[0.06] text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
              }`}
              role="status"
            >
              {expiry.expired ? "This token has expired" : "This token is still valid"} —{" "}
              {formatTime(decoded.payload.exp)} ({relative(decoded.payload.exp)}).
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel
                right={<CopyButton value={JSON.stringify(decoded.header, null, 2)} />}
              >
                Header
              </PaneLabel>
              <CodeField
                value={JSON.stringify(decoded.header, null, 2)}
                readOnly
                ariaLabel="Decoded header"
                rows={6}
              />
              <dl className="mt-3">
                <DataRow label="Algorithm" value={decoded.header.alg || "—"} />
                <DataRow label="Type" value={decoded.header.typ || "—"} />
                {decoded.header.kid ? <DataRow label="Key ID" value={decoded.header.kid} /> : null}
              </dl>
            </Panel>

            <Panel className="!p-4 sm:!p-5">
              <PaneLabel
                right={<CopyButton value={JSON.stringify(decoded.payload, null, 2)} />}
              >
                Payload
              </PaneLabel>
              <CodeField
                value={JSON.stringify(decoded.payload, null, 2)}
                readOnly
                ariaLabel="Decoded payload"
                rows={10}
              />
            </Panel>
          </div>

          {claims.registered.length > 0 ? (
            <Panel className="mt-4">
              <PaneLabel>Registered claims</PaneLabel>
              <dl>
                {claims.registered.map((claim) => (
                  <DataRow key={claim.key} label={claim.key} mono={false}>
                    <span className="font-mono text-sm text-white/85">
                      {typeof claim.value === "object"
                        ? JSON.stringify(claim.value)
                        : String(claim.value)}
                    </span>
                    {["exp", "iat", "nbf"].includes(claim.key) && typeof claim.value === "number" ? (
                      <span className="mt-0.5 block text-xs text-white/45">
                        {formatTime(claim.value)} · {relative(claim.value)}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-white/35">{claim.description}</span>
                  </DataRow>
                ))}
              </dl>
            </Panel>
          ) : null}

          {claims.custom.length > 0 ? (
            <Panel className="mt-4">
              <PaneLabel>Custom claims</PaneLabel>
              <dl>
                {claims.custom.map((claim) => (
                  <DataRow
                    key={claim.key}
                    label={claim.key}
                    value={
                      typeof claim.value === "object"
                        ? JSON.stringify(claim.value)
                        : String(claim.value)
                    }
                  />
                ))}
              </dl>
            </Panel>
          ) : null}

          <Panel className="mt-4">
            <PaneLabel right={<CopyButton value={decoded.signature} />}>Signature</PaneLabel>
            <code className="block font-mono text-xs break-all text-white/60">
              {decoded.signature}
            </code>
          </Panel>
        </>
      ) : null}

      <RelatedTools ids={["base64", "hash-generator", "env-validator"]} />
    </DevToolPage>
  );
}
