import { toast } from "react-toastify";
import { COLOR_MAP, DEFAULT_COLOR_TYPE } from "../constant";

/** Saves an in-memory blob to disk under `filename`. */
export const downloadBlob = (blob, filename) => {
  if (!blob) return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

export const downloadImage = async (image, filename = "download.jpg") => {
  // if we don't have image url then return
  if (!image) return;
  const res = await fetch(image);
  const blob = await res.blob();
  downloadBlob(blob, filename);
};

export const capitalizeWord = (str) => {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getColorType = (type) => {
  return COLOR_MAP[type] || COLOR_MAP[DEFAULT_COLOR_TYPE];
};

export const handleCopy = async (content) => {
  if (!content) return;
  try {
    await window.navigator.clipboard.writeText(content);
    toast.success("Content copied");
  } catch (error) {
    console.log(`Failed to copy. Error is ${error}`);
  }
};