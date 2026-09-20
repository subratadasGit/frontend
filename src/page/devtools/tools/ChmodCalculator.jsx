import { useMemo, useState } from "react";
import { INPUT, Panel } from "../../../components/ui/AppUI";
import {
  CopyButton,
  DataRow,
  DevToolPage,
  PaneLabel,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { buildChmod, parseChmod } from "../../../devtools/transforms/dev";

const BITS = [
  { id: "read", label: "Read", value: 4 },
  { id: "write", label: "Write", value: 2 },
  { id: "execute", label: "Execute", value: 1 },
];

const COMMON = [
  { mode: "644", use: "Regular files — owner writes, everyone reads." },
  { mode: "755", use: "Directories and executables." },
  { mode: "600", use: "Private files such as keys and .env." },
  { mode: "700", use: "Private directories." },
  { mode: "777", use: "Everything for everyone — almost always wrong." },
];

/** Octal ⇄ symbolic file permissions, in both directions. */
export default function ChmodCalculator({ toolId }) {
  const [octal, setOctal] = useState("755");

  const { parsed, error } = useMemo(() => {
    try {
      return { parsed: parseChmod(octal), error: null };
    } catch (caught) {
      return { parsed: null, error: { message: caught.message } };
    }
  }, [octal]);

  const toggle = (scopeIndex, bit) => {
    if (!parsed) return;
    const scopes = parsed.scopes.map((scope, index) =>
      index === scopeIndex ? { ...scope, [bit]: !scope[bit] } : scope,
    );
    setOctal(buildChmod(scopes));
  };

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <label htmlFor="chmod-octal" className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
              Octal mode
            </label>
            <input
              id="chmod-octal"
              value={octal}
              onChange={(event) => setOctal(event.target.value)}
              placeholder="755"
              maxLength={4}
              spellCheck={false}
              aria-invalid={Boolean(error)}
              className={`${INPUT} font-mono text-lg ${error ? "border-red-500/60" : ""}`}
            />
            <ToolErrorPanel error={error} />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {COMMON.map((entry) => (
                <button
                  key={entry.mode}
                  type="button"
                  onClick={() => setOctal(entry.mode)}
                  title={entry.use}
                  className="border border-white/10 px-2.5 py-1.5 font-mono text-[0.625rem] text-white/50 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
                >
                  {entry.mode}
                </button>
              ))}
            </div>
          </Panel>

          {parsed ? (
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Permissions</PaneLabel>
              <div className="overflow-x-auto">
                <table className="w-full border border-white/[0.08] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="p-3 text-left font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase">
                        Scope
                      </th>
                      {BITS.map((bit) => (
                        <th
                          key={bit.id}
                          className="p-3 text-center font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase"
                        >
                          {bit.label} ({bit.value})
                        </th>
                      ))}
                      <th className="p-3 text-center font-mono text-[0.625rem] tracking-[0.16em] text-white/30 uppercase">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.scopes.map((scope, scopeIndex) => (
                      <tr key={scope.scope} className="border-b border-white/[0.06] last:border-0">
                        <td className="p-3 font-mono text-white/75 capitalize">{scope.scope}</td>
                        {BITS.map((bit) => (
                          <td key={bit.id} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={scope[bit.id]}
                              onChange={() => toggle(scopeIndex, bit.id)}
                              aria-label={`${bit.label} for ${scope.scope}`}
                              className="h-4 w-4 accent-[#ff4d1c]"
                            />
                          </td>
                        ))}
                        <td className="p-3 text-center font-mono text-[#ff4d1c]">{scope.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}
        </div>

        {parsed ? (
          <div className="space-y-4">
            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Result</PaneLabel>
              <dl>
                <DataRow label="Octal">
                  <span className="flex items-center justify-between gap-3">
                    <code className="font-mono text-lg text-white">{parsed.octal}</code>
                    <CopyButton value={parsed.octal} label="Copy" />
                  </span>
                </DataRow>
                <DataRow label="Symbolic">
                  <span className="flex items-center justify-between gap-3">
                    <code className="font-mono text-lg text-white">-{parsed.symbolic}</code>
                    <CopyButton value={parsed.symbolic} label="Copy" />
                  </span>
                </DataRow>
                <DataRow label="Command">
                  <span className="flex items-center justify-between gap-3">
                    <code className="font-mono text-sm text-white/85">
                      chmod {parsed.octal} file
                    </code>
                    <CopyButton value={`chmod ${parsed.octal} file`} label="Copy" />
                  </span>
                </DataRow>
              </dl>

              {parsed.special ? (
                <div className="mt-3">
                  <ToolNote>
                    Special bits set:{" "}
                    {[parsed.setuid && "setuid", parsed.setgid && "setgid", parsed.sticky && "sticky"]
                      .filter(Boolean)
                      .join(", ")}
                    .
                  </ToolNote>
                </div>
              ) : null}
            </Panel>

            <Panel className="!p-4 sm:!p-5">
              <PaneLabel>Common modes</PaneLabel>
              <ul className="space-y-2">
                {COMMON.map((entry) => (
                  <li key={entry.mode} className="border-b border-white/[0.05] pb-2 last:border-0">
                    <code className="font-mono text-sm text-[#ff4d1c]">{entry.mode}</code>
                    <p className="mt-0.5 text-xs text-white/45">{entry.use}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : null}
      </div>

      <RelatedTools ids={["git-commands", "env-validator", "mime-lookup"]} />
    </DevToolPage>
  );
}
