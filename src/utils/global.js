import { toast } from "react-toastify";
import { COLOR_MAP, DEFAULT_COLOR_TYPE } from "../constant";

export const downloadImage = async (image) => {
  // if we don't have image url then return
  if (!image) return;
  const res = await fetch(image);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "download.jpg"; // change file name if needed

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
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