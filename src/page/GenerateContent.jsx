import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, ErrorIcon, LoadingIcon, WriteIcon } from "../components/Icon";
import { toast } from "react-toastify";
import { Navigate, useParams } from "react-router-dom";
import { PAGES } from "../constant";
import { handleCopy } from "../utils/global";

const schema = z.object({
  content: z.string().min(1, "Content is required"),
});

export default function GenerateContent() {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { action } = useParams();
  const pageContent = PAGES[action];

  if (!pageContent) {
    return <Navigate to="/" replace />;
  }

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
    setGeneratedContent(null);

    try {
      const { data: res } = await pageContent.handler(data);
      setGeneratedContent(res?.data?.content);
    } catch (error) {
      console.log("Error in generating content: ", error);
      setError("Failed to generate content. Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {pageContent.header}
          </h1>
          <p className="text-gray-600 text-lg">{pageContent["sub-header"]}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <form onSubmit={handleSubmit(formHandler)} className="space-y-6">
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Content
                </label>
                <div className="relative">
                  <textarea
                    id="content"
                    {...register("content")}
                    placeholder={pageContent["input-placeholder"]}
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 resize-none ${
                      errors?.content
                        ? "border-red-300 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-indigo-500 bg-gray-50 focus:bg-white"
                    }`}
                  />
                </div>
                {errors?.content?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.content.message}
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
                    <span>{pageContent["loading-text"]}</span>
                  </>
                ) : (
                  <>
                    <WriteIcon style="w-5 h-5" />
                    <span>{pageContent["button-content"]}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {pageContent["output-header"]}
            </h2>
            {generatedContent ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 min-h-[200px]">
                  <p className="text-gray-600"> {generatedContent}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopy(generatedContent)}
                    className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy style="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedContent(null);
                      reset();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
                  >
                    {pageContent["redo-instruction"]}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                <WriteIcon style="w-24 h-24 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {pageContent["output-subheader"]}
                </p>
                <p className="text-sm mt-2">
                  {pageContent["output-form-action"]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}