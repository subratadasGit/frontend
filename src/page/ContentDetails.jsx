import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contentWithId } from "../services/content";
import { Copy, ErrorIcon, LoadingIcon } from "../components/Icon";
import moment from "moment";
import { capitalizeWord, getColorType, handleCopy } from "../utils/global";

export default function ContentDetails() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getContentDetails();
  }, []);

  async function getContentDetails() {
    try {
      setIsLoading(true);
      setError(null);

      const { data: res } = await contentWithId(id);
      setContent(res?.data?.content);
    } catch (error) {
      console.log("Error in fetching content details: ", error);
      setError("Failed to load content. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingIcon style="animate-spin h-12 w-12 text-indigo-600 mb-4" />
            <p className="text-gray-600 text-lg">Loading content...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-600 text-center flex items-center justify-center gap-2">
              <ErrorIcon style="w-5 h-5" />
              {error}
            </p>
            <button
              onClick={getContentDetails}
              className="mt-4 mx-auto block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && content && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">
                  Content Detail
                </h1>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${getColorType(
                    content.type,
                  )}`}
                >
                  {capitalizeWord(content?.type)}
                </span>
              </div>
              <p className="text-white text-sm opacity-90">
                {moment(content?.createdAt).endOf("day").fromNow()}
              </p>
            </div>

            <div className="p-8">
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 mb-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                  {content.output}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(content.output)}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy style="w-5 h-5" />
                  Copy
                </button>
                <button
                  onClick={() => {
                    navigate("/content/history");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back to History
                </button>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Original Content
                </h2>
                <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                    {content.input}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}