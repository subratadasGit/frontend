import api from "../api";
import { REWRITE_URL } from "./endpoints";

export const rewriteContent = (data) => {
  return api.post(REWRITE_URL, data);
};

export const expandContent = (data) => {
  return api.post("/v1/content/expand", data);
};

export const shortenContent = (data) => {
  return api.post("/v1/content/shorten", data);
};

export const generateArticle = (data) => {
  return api.post("/v1/content/article", data);
};

export const generateSeoContent = (data) => {
  return api.post("/v1/content/seo-content", data);
};

export const contentHistory = () => {
  return api.get("/v1/content/history");
};

export const contentWithId = (id) => {
  return api.get(`/v1/content/${id}`);
};

export const searchContent = (query) => {
  return api.get(`/v1/content/search`, {
    params: { query },
  });
};