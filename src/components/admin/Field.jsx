import { useId, useState } from "react";
import { FIELD } from "../../cms/models";

/**
 * Renders one editor control from a field definition in `cms/models.js`.
 *
 * Every control is uncontrolled-by-parent-shape: it reports changes through a
 * single `onChange(name, value)` so the form above stays a plain object and the
 * admin never needs a per-resource form component.
 */

const inputClass =
  "w-full border border-white/10 bg-black px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff4d1c]";

function Label({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase"
    >
      {children}
      {required ? <span className="ml-1 text-[#ff4d1c]">*</span> : null}
    </label>
  );
}

/** Editable rows of either plain strings or fixed-key objects. */
function ListEditor({ field, value, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const itemFields = field.itemFields;

  const update = (index, next) => {
    const copy = [...rows];
    copy[index] = next;
    onChange(field.name, copy);
  };

  const add = () =>
    onChange(field.name, [
      ...rows,
      itemFields
        ? Object.fromEntries(itemFields.map((key) => [key, ""]))
        : "",
    ]);

  const remove = (index) =>
    onChange(
      field.name,
      rows.filter((_, rowIndex) => rowIndex !== index),
    );

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          {itemFields ? (
            <div className="grid flex-1 gap-2 sm:grid-cols-3">
              {itemFields.map((key) => (
                <input
                  key={key}
                  className={inputClass}
                  placeholder={key}
                  aria-label={`${field.label} ${index + 1} ${key}`}
                  value={row?.[key] ?? ""}
                  onChange={(event) =>
                    update(index, { ...row, [key]: event.target.value })
                  }
                />
              ))}
            </div>
          ) : (
            <input
              className={inputClass}
              aria-label={`${field.label} ${index + 1}`}
              value={row ?? ""}
              onChange={(event) => update(index, event.target.value)}
            />
          )}
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove ${field.label} ${index + 1}`}
            className="shrink-0 border border-white/10 px-3 py-2.5 text-sm text-white/50 transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="border border-dashed border-white/15 px-3 py-2 font-mono text-[0.6875rem] tracking-[0.16em] text-white/50 uppercase transition-colors hover:border-[#ff4d1c]/50 hover:text-white"
      >
        + Add {field.label.toLowerCase()}
      </button>
    </div>
  );
}

/** Raw JSON with inline validation, for structured section payloads. */
function JsonEditor({ field, value, onChange, id }) {
  const [draft, setDraft] = useState(() =>
    value == null ? "" : JSON.stringify(value, null, 2),
  );
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const next = event.target.value;
    setDraft(next);

    if (next.trim() === "") {
      setError(null);
      onChange(field.name, null);
      return;
    }

    try {
      onChange(field.name, JSON.parse(next));
      setError(null);
    } catch (caught) {
      // Keep the text so the edit isn't lost; the form blocks save while invalid.
      setError(caught.message);
      onChange(field.name, { __invalid: true });
    }
  };

  return (
    <>
      <textarea
        id={id}
        rows={10}
        spellCheck={false}
        value={draft}
        onChange={handleChange}
        className={`${inputClass} font-mono text-xs leading-relaxed ${
          error ? "border-red-500/60" : ""
        }`}
      />
      {error ? (
        <p className="mt-2 text-xs text-red-400">Invalid JSON — {error}</p>
      ) : null}
    </>
  );
}

export default function Field({ field, value, onChange }) {
  const id = useId();

  const control = () => {
    switch (field.type) {
      case FIELD.TEXTAREA:
        return (
          <textarea
            id={id}
            rows={field.rows || 3}
            className={inputClass}
            value={value ?? ""}
            required={field.required}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        );

      case FIELD.NUMBER:
        return (
          <input
            id={id}
            type="number"
            className={inputClass}
            value={value ?? 0}
            onChange={(event) => onChange(field.name, Number(event.target.value))}
          />
        );

      case FIELD.BOOLEAN:
        return (
          <label className="flex cursor-pointer items-center gap-3">
            <input
              id={id}
              type="checkbox"
              className="h-4 w-4 accent-[#ff4d1c]"
              checked={Boolean(value)}
              onChange={(event) => onChange(field.name, event.target.checked)}
            />
            <span className="text-sm text-white/70">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );

      case FIELD.SELECT:
        return (
          <select
            id={id}
            className={inputClass}
            value={value ?? ""}
            onChange={(event) => onChange(field.name, event.target.value)}
          >
            <option value="">—</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case FIELD.COLOR:
        return (
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="color"
              className="h-10 w-14 cursor-pointer border border-white/10 bg-black"
              value={value || "#000000"}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
            <input
              className={inputClass}
              aria-label={`${field.label} hex value`}
              value={value ?? ""}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          </div>
        );

      case FIELD.IMAGE:
        return (
          <div className="space-y-3">
            <input
              id={id}
              className={inputClass}
              placeholder="https://… or /path.svg"
              value={value ?? ""}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
            {value ? (
              <img
                src={value}
                alt=""
                className="h-24 w-auto border border-white/10 object-cover"
              />
            ) : null}
          </div>
        );

      case FIELD.LINK:
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              id={id}
              className={inputClass}
              placeholder="Label"
              aria-label={`${field.label} label`}
              value={value?.label ?? ""}
              onChange={(event) =>
                onChange(field.name, { ...(value || {}), label: event.target.value })
              }
            />
            <input
              className={inputClass}
              placeholder="URL"
              aria-label={`${field.label} URL`}
              value={value?.url ?? ""}
              onChange={(event) =>
                onChange(field.name, { ...(value || {}), url: event.target.value })
              }
            />
          </div>
        );

      case FIELD.LIST:
        return <ListEditor field={field} value={value} onChange={onChange} />;

      case FIELD.JSON:
        return (
          <JsonEditor field={field} value={value} onChange={onChange} id={id} />
        );

      default:
        return (
          <input
            id={id}
            className={inputClass}
            value={value ?? ""}
            required={field.required}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        );
    }
  };

  return (
    <div>
      <Label htmlFor={id} required={field.required}>
        {field.label}
      </Label>
      {control()}
      {field.help ? (
        <p className="mt-2 text-xs text-white/35">{field.help}</p>
      ) : null}
    </div>
  );
}
