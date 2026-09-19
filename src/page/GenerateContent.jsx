import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useParams } from "react-router-dom";
import { Copy, ErrorIcon, LoadingIcon, WriteIcon } from "../components/Icon";
import { PAGES } from "../constant";
import { handleCopy } from "../utils/global";
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
  content: z.string().min(1, "Content is required"),
});

export default function GenerateContent() {
  const { action } = useParams();
  const pageContent = PAGES[action];

  const [generatedContent, setGeneratedContent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  // Guard *after* the hooks so the hook order stays stable across renders.
  if (!pageContent) {
    return <Navigate to="/content" replace />;
  }

  const formHandler = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const { data: res } = await pageContent.handler(data);
      setGeneratedContent(res?.data?.content);
    } catch (caught) {
      setError(
        caught?.response?.data?.message ||
          "Failed to generate content. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Content"
        title={pageContent.header}
        description={pageContent["sub-header"]}
        actions={
          <Btn to="/content" variant="ghost">
            All tools
          </Btn>
        }
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Input */}
        <Panel as="section" aria-labelledby="input-heading">
          <h2
            id="input-heading"
            className="mb-6 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
          >
            Input
          </h2>

          <form onSubmit={handleSubmit(formHandler)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="content" className={LABEL}>
                Content
              </label>
              <textarea
                id="content"
                rows={12}
                {...register("content")}
                placeholder={pageContent["input-placeholder"]}
                aria-invalid={Boolean(errors?.content)}
                aria-describedby={errors?.content ? "content-error" : undefined}
                className={`${INPUT} resize-y leading-relaxed ${
                  errors?.content ? INPUT_ERROR : ""
                }`}
              />
              <FieldError id="content-error">{errors?.content?.message}</FieldError>
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
                  <span>{pageContent["loading-text"]}</span>
                </>
              ) : (
                <>
                  <WriteIcon style="w-4 h-4" />
                  <span>{pageContent["button-content"]}</span>
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
            {pageContent["output-header"]}
          </h2>

          {generatedContent ? (
            <div className="flex flex-1 flex-col">
              <div
                className="flex-1 border border-white/[0.08] bg-black p-5 text-sm leading-relaxed whitespace-pre-wrap text-white/80"
                aria-live="polite"
              >
                {generatedContent}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn onClick={() => handleCopy(generatedContent)}>
                  <Copy style="w-4 h-4" />
                  Copy
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    setGeneratedContent(null);
                    reset();
                  }}
                >
                  {pageContent["redo-instruction"]}
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <div className="w-full">
                <EmptyState
                  title={pageContent["output-subheader"]}
                  description={pageContent["output-form-action"]}
                />
              </div>
            </div>
          )}
        </Panel>
      </div>
    </Page>
  );
}
