import { useEffect, useState } from "react";
import moment from "moment";
import { imageHistory } from "../services/image";
import { Download, ErrorIcon, LoadingIcon, WriteIcon } from "../components/Icon";
import { downloadImage } from "../utils/global";
import { Btn, EmptyState, Page, PageHeader } from "../components/ui/AppUI";
import ImageEditor from "../components/image/ImageEditor";

export default function ImageHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [editing, setEditing] = useState(null);

  async function getImages() {
    try {
      setIsLoading(true);
      setError(null);
      const { data: res } = await imageHistory();
      setGeneratedImages(res?.data?.images || []);
    } catch {
      setError("Failed to load image history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getImages();
  }, []);

  // Editing takes over the page rather than opening in a dialog, so the crop
  // handles and the slider stack get the full width.
  if (editing) {
    return (
      <Page>
        <PageHeader
          eyebrow="Images"
          title="Edit & export"
          description={editing.prompt || "Crop, grade and export a saved image."}
          actions={
            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Back to history
            </Btn>
          }
        />
        {/* Keyed by source: a new image remounts the editor with clean state. */}
        <ImageEditor
          key={editing.url}
          src={editing.url}
          onClose={() => setEditing(null)}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Images"
        title="History"
        description="Every image you have generated, served from the CDN and ready to download."
        actions={
          <>
            <Btn to="/image/generate">Generate image</Btn>
            <Btn to="/image" variant="ghost">
              All tools
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
          <span className="sr-only">Loading image history</span>
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
          <Btn variant="ghost" onClick={getImages} className="mt-4">
            Try again
          </Btn>
        </div>
      ) : null}

      {!isLoading && !error && generatedImages.length === 0 ? (
        <EmptyState
          title="No images yet."
          description="Generate your first image and it will appear here."
          action={<Btn to="/image/generate">Generate image</Btn>}
        />
      ) : null}

      {!isLoading && !error && generatedImages.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {generatedImages.map((image, index) => (
            <li
              key={image._id || image.id || index}
              className="tile card group overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden bg-black">
                <img
                  src={image.url}
                  alt={image.prompt || `Generated image ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="tile__image h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"
                />
                {/* Always reachable: visible on hover, and on keyboard focus. */}
                <div className="tile__meta absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-4 max-sm:!translate-y-0 max-sm:!opacity-100">
                  <Btn onClick={() => setEditing(image)} className="!px-4 !py-2">
                    <WriteIcon style="w-4 h-4" />
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    href={image.url}
                    onClick={(event) => {
                      event.preventDefault();
                      downloadImage(image.url);
                    }}
                    className="!px-4 !py-2 !bg-black/70"
                  >
                    <Download style="w-4 h-4" />
                    Download
                  </Btn>
                </div>
              </div>

              <div className="p-4">
                <p className="font-mono text-[0.625rem] tracking-[0.14em] text-white/30 uppercase">
                  {moment(image.createdAt).fromNow()}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65">
                  {image.prompt}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Page>
  );
}
