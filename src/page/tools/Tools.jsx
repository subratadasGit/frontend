import Card from "../../components/Card";
import {
  ConvertIcon,
  MergeIcon,
  SplitIcon,
  WriteIcon,
} from "../../components/Icon";
import { Page, PageHeader, Panel } from "../../components/ui/AppUI";

/**
 * The file toolkit hub.
 *
 * These sit apart from the Content and Image studios because they are not
 * generation: nothing here calls a model or the API. They are document
 * operations that run entirely on the client, which is also why they are fast
 * and why the files stay on the machine.
 */
const tools = [
  {
    id: "merge",
    link: "/tools/merge-pdf",
    title: "Merge PDFs",
    description: "Combine any number of PDFs into one, in the order you choose.",
    icon: <MergeIcon style="w-6 h-6" />,
  },
  {
    id: "split",
    link: "/tools/split-pdf",
    title: "Split PDF",
    description: "One file per page, fixed chunks, or the page ranges you name.",
    icon: <SplitIcon style="w-6 h-6" />,
  },
  {
    id: "convert",
    link: "/tools/convert",
    title: "Convert",
    description:
      "Images, PDFs and text or data files between formats — PNG, JPG, WEBP, PDF, TXT, MD, CSV, JSON and more.",
    icon: <ConvertIcon style="w-6 h-6" />,
  },
  {
    id: "humanize",
    link: "/content/humanize",
    title: "Humanizer",
    description: "Rewrite a machine draft so it reads like a person wrote it.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
];

export default function Tools() {
  return (
    <Page>
      <PageHeader
        eyebrow="Toolkit"
        title="Tools"
        description="Document utilities that run in your browser — no upload, no queue, no size limit beyond your own memory."
      />

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => (
          <Card key={tool.id} feature={tool} index={index + 1} />
        ))}
      </div>

      <Panel className="mt-12">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          What runs where
        </h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-white/55 md:grid-cols-2">
          <p>
            Merge, split and convert are pure client-side work: pdf-lib writes
            the documents, pdf.js reads them, and canvas handles the images. Your
            files are never sent to the API, so nothing you process here is
            stored or logged.
          </p>
          <p>
            The Humanizer is the exception — it is a generation action, so the
            text goes to Gemini like every other Content Studio tool and the
            result is saved to your history. Office formats (DOCX, XLSX, PPTX)
            are not converted here; they need a server-side converter.
          </p>
        </div>
      </Panel>
    </Page>
  );
}
