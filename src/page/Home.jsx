import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { ImageIcon, ListIcon, ToolsIcon, WriteIcon } from "../components/Icon";
import { Btn, Page, PageHeader, Panel } from "../components/ui/AppUI";

/**
 * Product overview — the first screen after signing in.
 *
 * Deliberately a workspace, not a second landing page: the shader and oversized
 * marketing type stay on `/`, while this screen is a quiet, dense entry point
 * into the tools.
 */
const TOOLS = [
  {
    to: "/content",
    title: "Content Studio",
    description:
      "Rewrite, expand, shorten, draft articles, and generate SEO metadata.",
    icon: <WriteIcon style="w-6 h-6" />,
  },
  {
    to: "/image",
    title: "Image Generation",
    description:
      "Turn a description into original artwork at six preset resolutions.",
    icon: <ImageIcon style="w-6 h-6" />,
  },
  {
    to: "/tools",
    title: "File Toolkit",
    description:
      "Merge and split PDFs, and convert files between formats — all in your browser.",
    icon: <ToolsIcon style="w-6 h-6" />,
  },
  {
    to: "/content/history",
    title: "History",
    description:
      "Search everything you have generated and re-open any version.",
    icon: <ListIcon style="w-6 h-6" />,
  },
];

const ACTIONS = [
  { to: "/content/rewrite", label: "Rewrite content" },
  { to: "/content/expand", label: "Expand content" },
  { to: "/content/shorten", label: "Shorten content" },
  { to: "/content/generate-article", label: "Generate article" },
  { to: "/content/humanize", label: "Humanize a draft" },
  { to: "/content/seo-content", label: "SEO metadata" },
  { to: "/image/generate", label: "Generate image" },
  { to: "/tools/merge-pdf", label: "Merge PDFs" },
  { to: "/tools/split-pdf", label: "Split a PDF" },
  { to: "/tools/convert", label: "Convert a file" },
];

export default function Home() {
  const { isAuthenticated, name } = useAuth();

  if (!isAuthenticated) {
    return (
      <Page>
        <PageHeader
          eyebrow="Workspace"
          title="Sign in to start creating"
          description="Your generated content, images, and history live behind your account."
          actions={
            <>
              <Btn to="/register">Create account</Btn>
              <Btn to="/login" variant="ghost">
                Sign in
              </Btn>
            </>
          }
        />
        <Panel>
          <p className="text-sm leading-relaxed text-white/55">
            Creates.io turns a prompt into publish-ready work — rewrites,
            expansions, full articles, SEO metadata, and original imagery — and
            keeps every version in one searchable workspace.
          </p>
        </Panel>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace"
        title={name ? `Welcome back, ${name}.` : "Welcome back."}
        description="Pick a tool, or jump straight into an action."
        actions={
          <>
            <Btn to="/content">Open studio</Btn>
            <Btn to="/admin" variant="ghost">
              Manage site
            </Btn>
          </>
        }
      />

      <section aria-labelledby="tools-heading">
        <h2
          id="tools-heading"
          className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
        >
          Tools
        </h2>
        <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="card group flex min-h-[13rem] flex-col justify-between p-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs tracking-[0.2em] text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[#ff4d1c] transition-transform duration-500 group-hover:scale-110">
                  {tool.icon}
                </span>
              </div>
              <div className="mt-10">
                <h3 className="text-xl font-semibold tracking-[-0.025em]">
                  {tool.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="actions-heading" className="mt-14">
        <h2
          id="actions-heading"
          className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase"
        >
          Quick actions
        </h2>
        <div className="mt-5 grid gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center justify-between bg-[#0a0a0a] px-5 py-4 transition-colors hover:bg-white/[0.04]"
            >
              <span className="text-sm text-white/80 group-hover:text-white">
                {action.label}
              </span>
              <span
                aria-hidden="true"
                className="text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#ff4d1c]"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Page>
  );
}
