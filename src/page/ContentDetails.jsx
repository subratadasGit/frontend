import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import { contentWithId } from "../services/content";
import { Copy, ErrorIcon, LoadingIcon } from "../components/Icon";
import { capitalizeWord, handleCopy } from "../utils/global";
import { Btn, Page, PageHeader, Panel, Tag } from "../components/ui/AppUI";

export default function ContentDetails() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function getContentDetails() {
    try {
      setIsLoading(true);
      setError(null);
      const { data: res } = await contentWithId(id);
      setContent(res?.data?.content);
    } catch {
      setError("Failed to load content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getContentDetails();
    // Re-fetch when navigating between two history items.
  }, [id]);

  return (
    <Page>
      <PageHeader
        eyebrow="Content"
        title="Generated result"
        description={
          content
            ? `${capitalizeWord(content.type)} · ${moment(content.createdAt).format(
                "MMMM Do YYYY, h:mm a",
              )}`
            : undefined
        }
        actions={
          <>
            {content ? (
              <Btn onClick={() => handleCopy(content.output)}>
                <Copy style="w-4 h-4" />
                Copy
              </Btn>
            ) : null}
            <Btn to="/content/history" variant="ghost">
              Back to history
            </Btn>
          </>
        }
      />

      {isLoading ? (
        <div
          className="flex items-center justify-center py-24"
          role="status"
          aria-live="polite"
        >
          <LoadingIcon style="animate-spin h-8 w-8 text-[#ff4d1c]" />
          <span className="sr-only">Loading content</span>
        </div>
      ) : null}

      {error && !isLoading ? (
        <div
          role="alert"
          className="border border-red-500/30 bg-red-500/5 px-4 py-4 text-sm text-red-300"
        >
          <p className="flex items-center gap-2">
            <ErrorIcon style="w-5 h-5 shrink-0" />
            {error}
          </p>
          <Btn variant="ghost" onClick={getContentDetails} className="mt-4">
            Try again
          </Btn>
        </div>
      ) : null}

      {!isLoading && !error && content ? (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <Panel as="section" aria-labelledby="output-heading">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2
                id="output-heading"
                className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
              >
                Output
              </h2>
              <Tag>{capitalizeWord(content.type)}</Tag>
            </div>
            <div className="border border-white/[0.08] bg-black p-5 text-sm leading-relaxed whitespace-pre-wrap text-white/80 sm:p-6">
              {content.output}
            </div>
          </Panel>

          <Panel as="section" aria-labelledby="prompt-heading">
            <h2
              id="prompt-heading"
              className="mb-6 font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
            >
              Original prompt
            </h2>
            <div className="border-l border-white/[0.12] pl-5 text-sm leading-relaxed whitespace-pre-wrap text-white/50">
              {content.input}
            </div>
            <p className="mt-6 border-t border-white/[0.08] pt-4 font-mono text-[0.625rem] tracking-[0.14em] text-white/30 uppercase">
              {moment(content.createdAt).format("MMM D, YYYY · h:mm a")}
            </p>
          </Panel>
        </div>
      ) : null}
    </Page>
  );
}
