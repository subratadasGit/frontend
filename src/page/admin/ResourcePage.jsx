import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { emptyRecord, getResourceModel } from "../../cms/models";
import { useResource } from "../../cms/queries";
import { deleteRecord, saveRecord } from "../../cms/services";
import Field from "../../components/admin/Field";
import Drawer from "../../components/admin/Drawer";

/**
 * One screen for every CMS resource.
 *
 * The content model in `cms/models.js` supplies the fields, the table columns
 * and whether a resource is a singleton, so singletons render as an inline form
 * and collections render as a table plus an editing drawer — with no
 * per-resource code.
 */

/** Renders a value for the table, kept short enough not to break the layout. */
function cellValue(record, column) {
  const value = record[column];
  if (typeof value === "boolean") {
    return (
      <span
        className={`font-mono text-[0.6875rem] tracking-[0.16em] uppercase ${
          value ? "text-emerald-400" : "text-white/30"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }
  if (value == null || value === "") return <span className="text-white/25">—</span>;
  if (typeof value === "object") return <span className="text-white/40">{"{…}"}</span>;

  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/** Guards against saving a record whose JSON field is mid-edit and invalid. */
function hasInvalidJson(record) {
  return Object.values(record || {}).some(
    (value) => value && typeof value === "object" && value.__invalid,
  );
}

export default function ResourcePage() {
  const { resource: resourceKey } = useParams();
  const model = getResourceModel(resourceKey);

  const { data, status, refresh } = useResource(resourceKey, {
    singleton: Boolean(model?.singleton),
  });

  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  // Singletons edit in place, so the draft mirrors whatever was last loaded.
  useEffect(() => {
    if (model?.singleton && status === "ready") setDraft(data || {});
  }, [model, status, data]);

  // Reset transient UI when switching between resources.
  useEffect(() => {
    setEditing(null);
    setQuery("");
  }, [resourceKey]);

  const onFieldChange = useCallback((name, value) => {
    setDraft((current) => ({ ...(current || {}), [name]: value }));
  }, []);

  const records = useMemo(() => {
    if (model?.singleton || !Array.isArray(data)) return [];
    if (!query.trim()) return data;
    const needle = query.toLowerCase();
    return data.filter((record) =>
      JSON.stringify(record).toLowerCase().includes(needle),
    );
  }, [data, model, query]);

  if (!model) {
    return (
      <p className="text-sm text-white/60">
        Unknown content type “{resourceKey}”.
      </p>
    );
  }

  const handleSave = async (event) => {
    event?.preventDefault?.();
    if (hasInvalidJson(draft)) {
      toast.error("Fix the invalid JSON before saving");
      return;
    }

    setSaving(true);
    try {
      await saveRecord(resourceKey, {
        singleton: model.singleton,
        id: editing?._id,
        data: draft,
      });
      toast.success(`${model.label} saved`);
      if (!model.singleton) setEditing(null);
      await refresh();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || `Could not save ${model.label}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const title = record[model.titleField] || "this item";
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

    try {
      await deleteRecord(resourceKey, record._id);
      toast.success("Deleted");
      await refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not delete");
    }
  };

  const openCreate = () => {
    setDraft(emptyRecord(model));
    setEditing({ _id: null });
  };

  const openEdit = (record) => {
    setDraft({ ...record });
    setEditing(record);
  };

  const header = (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          {model.group}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{model.label}</h1>
        {model.description ? (
          <p className="mt-1.5 text-sm text-white/45">{model.description}</p>
        ) : null}
      </div>

      {!model.singleton ? (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="resource-search">
            Search {model.label}
          </label>
          <input
            id="resource-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            className="w-full border border-white/10 bg-black px-3 py-2 text-sm outline-none placeholder:text-white/25 focus:border-[#ff4d1c] sm:w-56"
          />
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 bg-[#ff4d1c] px-4 py-2 text-sm font-medium text-[#0a0000] transition-colors hover:bg-[#ff6a3d]"
          >
            New
          </button>
        </div>
      ) : null}
    </header>
  );

  if (status === "loading" && !draft && records.length === 0) {
    return (
      <>
        {header}
        <p className="text-sm text-white/40">Loading…</p>
      </>
    );
  }

  /* ------------------------------- Singleton ------------------------------ */

  if (model.singleton) {
    return (
      <>
        {header}
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {model.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={draft?.[field.name]}
              onChange={onFieldChange}
            />
          ))}

          <div className="flex items-center gap-3 border-t border-white/10 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff4d1c] px-5 py-2.5 text-sm font-medium text-[#0a0000] transition-colors hover:bg-[#ff6a3d] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={refresh}
              className="border border-white/10 px-5 py-2.5 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              Discard
            </button>
          </div>
        </form>
      </>
    );
  }

  /* ------------------------------ Collection ------------------------------ */

  const columns = model.columns || [model.titleField];

  return (
    <>
      {header}

      {records.length === 0 ? (
        <div className="border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-sm text-white/45">
            {query ? "Nothing matches that search." : `No ${model.label.toLowerCase()} yet.`}
          </p>
          {!query ? (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 bg-[#ff4d1c] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#ff6a3d]"
            >
              Create the first one
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 font-mono text-[0.625rem] tracking-[0.16em] text-white/40 uppercase"
                  >
                    {column}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record._id}
                  className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 align-middle text-white/75">
                      {cellValue(record, column)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(record)}
                      className="border border-white/10 px-3 py-1.5 text-xs transition-colors hover:border-[#ff4d1c]/60 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record)}
                      className="ml-2 border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={Boolean(editing)}
        title={editing?._id ? `Edit ${model.label}` : `New ${model.label}`}
        description={model.description}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="resource-form"
              disabled={saving}
              className="bg-[#ff4d1c] px-5 py-2.5 text-sm font-medium text-[#0a0000] transition-colors hover:bg-[#ff6a3d] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="border border-white/10 px-5 py-2.5 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              Cancel
            </button>
          </div>
        }
      >
        <form id="resource-form" onSubmit={handleSave} className="space-y-6">
          {model.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={draft?.[field.name]}
              onChange={onFieldChange}
            />
          ))}
        </form>
      </Drawer>
    </>
  );
}
