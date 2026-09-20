import Card from "../components/Card";
import { ListIcon, WriteIcon } from "../components/Icon";
import { Page, PageHeader, Panel } from "../components/ui/AppUI";

const contentFeatures = [
  {
    id: "rewrite",
    link: "/content/rewrite",
    title: "Rewrite",
    description: "Improve clarity, grammar, and tone without losing the meaning.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    id: "expand",
    link: "/content/expand",
    title: "Expand",
    description: "Turn an outline or a few notes into a fully developed draft.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    id: "shorten",
    link: "/content/shorten",
    title: "Shorten",
    description: "Compress long copy down to the core argument.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    id: "generate-article",
    link: "/content/generate-article",
    title: "Generate Article",
    description: "Give it a topic line and get a structured, publish-ready piece.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    id: "humanize",
    link: "/content/humanize",
    title: "Humanizer",
    description: "Rewrite a machine draft so it reads like a person wrote it.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    id: "seo-content",
    link: "/content/seo-content",
    title: "SEO Metadata",
    description: "Titles, keywords, and meta descriptions from any article.",
    icon: <ListIcon style="w-6 h-6" />,
  },
  {
    id: "history",
    link: "/content/history",
    title: "History",
    description: "Search everything you have generated and re-open any version.",
    icon: <ListIcon style="w-6 h-6" />,
  },
];

export default function Content() {
  return (
    <Page>
      <PageHeader
        eyebrow="Studio"
        title="Content"
        description="Six generation actions over one editor, with every result saved to your history."
      />

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {contentFeatures.map((feature, index) => (
          <Card key={feature.id} feature={feature} index={index + 1} />
        ))}
      </div>

      <Panel className="mt-12">
        <h2 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
          About these tools
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/55">
          Each action sends your text to Google Gemini with a prompt tuned for
          that specific job, so a rewrite keeps your meaning while a summary
          strips it back. Results are written to your account as you generate
          them — nothing is lost when you close the tab.
        </p>
      </Panel>
    </Page>
  );
}
