import React from "react";
import { LoadingIcon } from "./Icon";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <LoadingIcon style="h-12 w-12 animate-spin text-indigo-600" />
        <p className="mt-2 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}