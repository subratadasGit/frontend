import Card from "../components/Card";
import { ImageIcon, ListIcon } from "../components/Icon";
import { Page, PageHeader, Panel } from "../components/ui/AppUI";

const imageFeature = [
  {
    id: "generate",
    link: "/image/generate",
    title: "Generate Image",
    description: "Describe what you need and get original artwork back.",
    icon: <ImageIcon style="w-6 h-6" />,
  },
  {
    id: "history",
    link: "/image/history",
    title: "Image History",
    description: "Browse, re-open, and download everything you have generated.",
    icon: <ListIcon style="w-6 h-6" />,
  },
];

export default function Image() {
  return (
    <Page>
      <PageHeader
        eyebrow="Studio"
        title="Images"
        description="Text-to-image generation at six preset resolutions, stored on a CDN."
      />

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {imageFeature.map((feature, index) => (
          <Card key={feature.id} feature={feature} index={index + 1} />
        ))}
      </div>

      <Panel className="mt-12">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          About these tools
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/55">
          Prompts run through Hugging Face inference and the result is uploaded
          straight to Cloudinary, so every image keeps a permanent URL you can
          download or drop into a page. Pick a resolution up front — square,
          portrait, or landscape — and the generated file matches it exactly.
        </p>
      </Panel>
    </Page>
  );
}
