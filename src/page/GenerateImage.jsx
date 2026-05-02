import { useState } from "react";
import { IMAGE_RESOLUTION } from "../constant";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateImage } from "../services/image";
import {
  Download,
  DropDown,
  ErrorIcon,
  ImageIcon,
  LoadingIcon,
} from "../components/Icon";
import { downloadImage } from "../utils/global";

const schema = z.object({
  resolution: z.string().min(1, "Please select a resolution"),
  prompt: z.string().min(1, "Please enter a valid prompt"),
});

export default function GenerateImage() {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const formHandler = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { data: res } = await generateImage(data);
      setGeneratedImage(res?.data?.image);
    } catch (error) {
      console.log("Error in generating image: ", error);
      setError(
        error?.code === "ECONNABORTED"
          ? "Image generation is taking too long. Please retry with a shorter prompt."
          : 
        error?.response?.data?.message ||
          "Failed to generate image. Please try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Generate Image
          </h1>
          <p className="text-gray-600 text-lg">
            Create beautiful images using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <form onSubmit={handleSubmit(formHandler)} className="space-y-6">
              <div>
                <label
                  htmlFor="resolution"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Resolution
                </label>
                <div className="relative">
                  <select
                    id="resolution"
                    {...register("resolution")}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 appearance-none bg-white ${
                      errors?.resolution
                        ? "border-red-300 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-indigo-500 bg-gray-50 focus:bg-white"
                    }`}
                  >
                    {IMAGE_RESOLUTION.map((res) => (
                      <option key={res.value} value={res.value}>
                        {res.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <DropDown style="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {errors?.resolution?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.resolution.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Prompt
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    {...register("prompt")}
                    placeholder="Describe the image you want to generate..."
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 resize-none ${
                      errors?.prompt
                        ? "border-red-300 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-indigo-500 bg-gray-50 focus:bg-white"
                    }`}
                  />
                </div>
                {errors?.prompt?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.prompt.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <ErrorIcon style="w-5 h-5" />
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingIcon style="animate-spin h-5 w-5" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon style="w-5 h-5" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generated Image
            </h2>
            {generatedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      downloadImage(generatedImage);
                    }}
                    href={generatedImage}
                    download
                    className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download style="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      reset();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                <ImageIcon style="w-24 h-24 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  Generated image will appear here
                </p>
                <p className="text-sm mt-2">
                  Fill out the form and click generate to create an image
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}