import { useCallback, useEffect, useState } from "react";
import { Btn, Panel } from "../../../components/ui/AppUI";
import {
  CheckField,
  CodeField,
  CopyButton,
  DevToolPage,
  PaneLabel,
  RangeField,
  RelatedTools,
  ToolErrorPanel,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { generatePassword, passwordEntropy } from "../../../devtools/transforms/security";

const SET_SIZES = { lowercase: 26, uppercase: 26, digits: 10, symbols: 24 };

/** Bands chosen to match how long an offline attack would plausibly take. */
const strengthOf = (bits) => {
  if (bits < 50) return { label: "Weak", tone: "text-red-400", bar: "bg-red-500", width: "25%" };
  if (bits < 75) return { label: "Fair", tone: "text-amber-400", bar: "bg-amber-500", width: "50%" };
  if (bits < 110) return { label: "Strong", tone: "text-emerald-400", bar: "bg-emerald-500", width: "75%" };
  return { label: "Very strong", tone: "text-emerald-300", bar: "bg-emerald-400", width: "100%" };
};

export default function PasswordGenerator({ toolId }) {
  const [length, setLength] = useState(20);
  const [count, setCount] = useState(5);
  const [sets, setSets] = useState({ lowercase: true, uppercase: true, digits: true, symbols: true });
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [error, setError] = useState(null);

  const alphabetSize =
    Object.entries(sets).reduce((total, [key, on]) => total + (on ? SET_SIZES[key] : 0), 0) -
    (avoidAmbiguous ? 6 : 0);

  const generate = useCallback(() => {
    try {
      setPasswords(
        Array.from({ length: Math.max(1, Math.min(count, 50)) }, () =>
          generatePassword({ length, ...sets, avoidAmbiguous }),
        ),
      );
      setError(null);
    } catch (caught) {
      setPasswords([]);
      setError({ message: caught.message });
    }
  }, [length, count, sets, avoidAmbiguous]);

  useEffect(() => {
    generate();
  }, [generate]);

  const bits = passwordEntropy("x".repeat(length), Math.max(1, alphabetSize));
  const strength = strengthOf(bits);
  const text = passwords.join("\n");

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel>Options</PaneLabel>
          <div className="space-y-5">
            <RangeField label="Length" value={length} onChange={setLength} min={8} max={64} />
            <RangeField label="How many" value={count} onChange={setCount} min={1} max={50} />

            <div className="space-y-2">
              <span className="block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase">
                Character sets
              </span>
              <CheckField
                label="Lowercase (a–z)"
                checked={sets.lowercase}
                onChange={(value) => setSets((current) => ({ ...current, lowercase: value }))}
              />
              <CheckField
                label="Uppercase (A–Z)"
                checked={sets.uppercase}
                onChange={(value) => setSets((current) => ({ ...current, uppercase: value }))}
              />
              <CheckField
                label="Digits (0–9)"
                checked={sets.digits}
                onChange={(value) => setSets((current) => ({ ...current, digits: value }))}
              />
              <CheckField
                label="Symbols (!@#…)"
                checked={sets.symbols}
                onChange={(value) => setSets((current) => ({ ...current, symbols: value }))}
              />
              <CheckField
                label="Avoid look-alikes (I l 1 O 0 o)"
                checked={avoidAmbiguous}
                onChange={setAvoidAmbiguous}
              />
            </div>

            <Btn onClick={generate} className="w-full">
              Regenerate
            </Btn>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="!p-4 sm:!p-5">
            <PaneLabel>Strength</PaneLabel>
            <ToolErrorPanel error={error} />
            {!error ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-lg font-semibold tracking-[-0.02em] ${strength.tone}`}>
                    {strength.label}
                  </span>
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-white/40 uppercase">
                    ~{bits} bits of entropy
                  </span>
                </div>
                <div className="mt-2 h-1 w-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${strength.bar}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/40">
                  Entropy assumes each character is drawn uniformly at random
                  from the {alphabetSize}-character alphabet, which is true for
                  these passwords. A password you invent yourself has far less,
                  however long it looks.
                </p>
              </>
            ) : null}
          </Panel>

          <Panel className="!p-4 sm:!p-5">
            <PaneLabel right={<CopyButton value={text} label="Copy all" />}>
              Passwords
            </PaneLabel>
            <ul className="divide-y divide-white/[0.06] border border-white/[0.08]">
              {passwords.map((password, index) => (
                <li key={index} className="flex items-center gap-3 p-2.5">
                  <code className="min-w-0 flex-1 font-mono text-sm break-all text-white/85">
                    {password}
                  </code>
                  <CopyButton value={password} label="Copy" />
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <ToolNote>
                Generated locally with <code>crypto.getRandomValues</code> and
                rejection sampling, so the distribution is uniform. Nothing is
                sent anywhere and nothing is stored.
              </ToolNote>
            </div>
            <div className="sr-only" aria-live="polite">
              {passwords.length} passwords generated.
            </div>
            <CodeField value={text} readOnly ariaLabel="Generated passwords" rows={4} className="mt-3 hidden" />
          </Panel>
        </div>
      </div>

      <RelatedTools ids={["uuid-generator", "hash-generator", "env-validator"]} />
    </DevToolPage>
  );
}
