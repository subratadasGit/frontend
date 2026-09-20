import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMAGE_RESOLUTION } from "../constant";
import { generateImage } from "../services/image";
import {
  Download,
  DropDown,
  ErrorIcon,
  ImageIcon,
  LoadingIcon,
  WriteIcon,
} from "../components/Icon";
import { downloadImage } from "../utils/global";
import ImageEditor from "../components/image/ImageEditor";
import {
  Btn,
  EmptyState,
  FieldError,
  INPUT,
  INPUT_ERROR,
  LABEL,
  Page,
  PageHeader,
  Panel,
} from "../components/ui/AppUI";

const schema = z.object({
  resolution: z.string().min(1, "Please select a resolution"),
  prompt: z.string().min(1, "Please enter a valid prompt"),
});

export default function GenerateImage() {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const formHandler = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setGeneratedImage(null);
    setEditing(false);

    try {
      const { data: res } = await generateImage(data);
      setGeneratedImage(res?.data?.image);
    } catch (caught) {
      setError(
        caught?.code === "ECONNABORTED"
          ? "Image generation is taking too long. Please retry with a shorter prompt."
          : caught?.response?.data?.message ||
              "Failed to generate image. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editing takes over the full width — the crop handles and the slider stack
  // need the room, and the prompt form is not useful while you are retouching.
  if (editing && generatedImage) {
    return (
      <Page>
        <PageHeader
          eyebrow="Images"
          title="Edit & export"
          description="Crop, straighten and grade the result, then export it as PNG, JPG, JPEG or WEBP. Everything runs in your browser — the stored original is untouched."
          actions={
            <Btn variant="ghost" onClick={() => setEditing(false)}>
              Back to prompt
            </Btn>
          }
        />
        {/* Keyed by source: a new image remounts the editor with clean state
            rather than carrying the previous one's crop and adjustments. */}
        <ImageEditor
          key={generatedImage}
          src={generatedImage}
          onClose={() => setEditing(false)}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Images"
        title="Generate Image"
        description="Describe what you need and pick a resolution — the result is stored on a CDN."
        actions={
          <>
            <Btn to="/image/history" variant="ghost">
              History
            </Btn>
            <Btn to="/image" variant="ghost">
              All tools
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Input */}
        <Panel as="section" aria-labelledby="input-heading">
          <h2
            id="input-heading"
            className="mb-6 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
          >
            Prompt
          </h2>

          <form onSubmit={handleSubmit(formHandler)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="resolution" className={LABEL}>
                Resolution
              </label>
              <div className="relative">
                <select
                  id="resolution"
                  {...register("resolution")}
                  aria-invalid={Boolean(errors?.resolution)}
                  aria-describedby={errors?.resolution ? "resolution-error" : undefined}
                  className={`${INPUT} appearance-none pr-10 ${
                    errors?.resolution ? INPUT_ERROR : ""
                  }`}
                >
                  {IMAGE_RESOLUTION.map((res) => (
                    <option key={res.value} value={res.value}>
                      {res.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <DropDown style="w-5 h-5 text-white/35" />
                </span>
              </div>
              <FieldError id="resolution-error">
                {errors?.resolution?.message}
              </FieldError>
            </div>

            <div>
              <label htmlFor="prompt" className={LABEL}>
                Description
              </label>
              <textarea
                id="prompt"
                rows={9}
                {...register("prompt")}
                placeholder="Describe the image you want to generate…"
                aria-invalid={Boolean(errors?.prompt)}
                aria-describedby={errors?.prompt ? "prompt-error" : undefined}
                className={`${INPUT} resize-y leading-relaxed ${
                  errors?.prompt ? INPUT_ERROR : ""
                }`}
              />
              <FieldError id="prompt-error">{errors?.prompt?.message}</FieldError>
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
              >
                <ErrorIcon style="w-5 h-5 shrink-0" />
                {error}
              </p>
            ) : null}

            <Btn type="submit" disabled={isSubmitting} className="w-full !py-3.5">
              {isSubmitting ? (
                <>
                  <LoadingIcon style="animate-spin h-4 w-4" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <ImageIcon style="w-4 h-4" />
                  <span>Generate image</span>
                </>
              )}
            </Btn>
          </form>
        </Panel>

        {/* Output */}
        <Panel as="section" aria-labelledby="output-heading" className="flex flex-col">
          <h2
            id="output-heading"
            className="mb-6 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
          >
            Result
          </h2>

          {generatedImage ? (
            <div className="flex flex-1 flex-col">
              <div className="border border-white/[0.08] bg-black">
                <img
                  src={generatedImage}
                  alt="Generated result"
                  className="h-auto w-full object-contain"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn onClick={() => setEditing(true)}>
                  <WriteIcon style="w-4 h-4" />
                  Edit & export
                </Btn>
                <Btn
                  variant="ghost"
                  href={generatedImage}
                  onClick={(event) => {
                    event.preventDefault();
                    downloadImage(generatedImage);
                  }}
                >
                  <Download style="w-4 h-4" />
                  Download
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    setGeneratedImage(null);
                    reset();
                  }}
                >
                  Generate new
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <div className="w-full">
                <EmptyState
                  title="Your image will appear here"
                  description="Choose a resolution, describe the image, and generate."
                />
              </div>
            </div>
          )}
        </Panel>
      </div>
    </Page>
  );
}
