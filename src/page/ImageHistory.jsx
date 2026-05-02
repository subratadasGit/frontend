import React, { useEffect, useState } from "react";
import { imageHistory } from "../services/image";
import {
  Download,
  ErrorIcon,
  ImageIcon,
  LoadingIcon,
} from "../components/Icon";
import moment from "moment";
import { downloadImage } from "../utils/global";

export default function ImageHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);

  async function getImage() {
    try {
      setIsLoading(true);
      setError(null);
      const { data: res } = await imageHistory();
      setGeneratedImages(res?.data?.images);
    } catch (error) {
      console.error("Error in fetching image history", error);
      setError("Failed to load image history. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getImage();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Image history
          </h1>
          <p className="text-gray-600 text-lg">
            View all your generated images
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingIcon style="animate-spin h-12 w-12 text-indigo-600 mb-4" />
            <p className="text-gray-600 text-lg">Loading images...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-600 text-center flex items-center justify-center gap-2">
              <ErrorIcon style="w-5 h-5" />
              {error}
            </p>
            <button
              onClick={getImage}
              className="mt-4 mx-auto block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && generatedImages.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon style="w-24 h-24 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No images yet</p>
              <p className="text-sm text-center">
                Start generating images to see them here
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && generatedImages?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {generatedImages.map((image, index) => (
              <div
                key={image._id || image.id || index}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative bg-gray-50">
                  <img
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-1 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        downloadImage(image.url);
                      }}
                      href={image.url}
                      download
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Download style="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">
                      {moment(image.createdAt).endOf("day").fromNow()}
                    </p>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      AI Generated
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mt-2">
                    {image.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}