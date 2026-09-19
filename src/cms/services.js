import api from "../api";

/**
 * CMS transport layer. Mirrors `backend/routes/v1/cms.js`.
 *
 * Reads for the landing page are public; every write goes through the existing
 * axios instance, which attaches the project's JWT.
 */

const BASE = "/v1/cms";

/* --------------------------------- Queries -------------------------------- */

/** Public: the entire landing page in a single request. */
export const fetchLandingContent = (config) => api.get(`${BASE}/landing`, config);

/** Admin: a whole collection, or the current value of a singleton. */
export const fetchResource = (resource) => api.get(`${BASE}/${resource}`);

export const fetchRecord = (resource, id) => api.get(`${BASE}/${resource}/${id}`);

/* -------------------------------- Mutations ------------------------------- */

export const createRecord = (resource, data) =>
  api.post(`${BASE}/${resource}`, data);

export const updateRecord = (resource, id, data) =>
  api.put(`${BASE}/${resource}/${id}`, data);

/** Singletons are addressed without an id. */
export const updateSingleton = (resource, data) =>
  api.put(`${BASE}/${resource}`, data);

export const deleteRecord = (resource, id) =>
  api.delete(`${BASE}/${resource}/${id}`);

/** Reorders a whole collection in one round trip. */
export const reorderRecords = (resource, items) =>
  api.patch(`${BASE}/${resource}/reorder`, { items });

/** Registers a media asset by URL, or uploads a base64 data URL. */
export const uploadMedia = (payload) => api.post(`${BASE}/media/upload`, payload);

/** Re-runs the idempotent seed; only fills empty collections. */
export const seedContent = () => api.post(`${BASE}/seed`);

/** Saves a record, choosing create/update/singleton automatically. */
export const saveRecord = (resource, { singleton, id, data }) => {
  if (singleton) return updateSingleton(resource, data);
  return id ? updateRecord(resource, id, data) : createRecord(resource, data);
};
