import { useMemo, useState } from "react";
import { Panel } from "../../../components/ui/AppUI";
import {
  ClearButton,
  CodeField,
  CopyButton,
  DevToolPage,
  DownloadButton,
  PaneLabel,
  PasteButton,
  RelatedTools,
  ToolNote,
} from "../../../components/devtools/DevToolUI";
import { markdownToHtml } from "../../../utils/fileTools";
import { countText } from "../../../devtools/transforms/text";

const SAMPLE = `# Markdown Preview

Write on the left, see it rendered on the right.

## What it handles

- Headings, **bold**, *italic* and \`inline code\`
- [Links](https://example.com) and images
- Ordered lists, blockquotes and tables

> Rendered with the same converter the file toolkit uses.

| Feature | Supported |
| --- | --- |
| Tables | Yes |
| Code blocks | Yes |

1. First
2. Second
3. Third
`;

/**
 * Live Markdown rendering.
 *
 * Uses the converter already shipped in `utils/fileTools.js` rather than a
 * second Markdown implementation, so this preview and the file toolkit's
 * Markdown → HTML conversion can never disagree.
 */
export default function MarkdownPreview({ toolId }) {
  const [text, setText] = useState(SAMPLE);

  const html = useMemo(() => {
    if (!text.trim()) return "";
    return markdownToHtml(text);
  }, [text]);

  const stats = useMemo(() => countText(text), [text]);

  return (
    <DevToolPage toolId={toolId}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <PasteButton onPaste={setText} />
                <ClearButton onClick={() => setText("")} disabled={!text} />
              </div>
            }
          >
            Markdown
          </PaneLabel>
          <CodeField value={text} onChange={setText} ariaLabel="Markdown source" rows={20} />
          <p className="mt-2 font-mono text-[0.625rem] tracking-[0.14em] text-white/30 uppercase">
            {stats.words} words · {stats.characters} characters · ~
            {Math.max(1, Math.round(stats.readingSeconds / 60))} min read
          </p>
        </Panel>

        <Panel className="!p-4 sm:!p-5">
          <PaneLabel
            right={
              <div className="flex gap-2">
                <CopyButton value={html} label="Copy HTML" />
                <DownloadButton value={html} filename="preview.html" type="text/html" />
              </div>
            }
          >
            Preview
          </PaneLabel>

          {html ? (
            <div className="max-h-[36rem] overflow-auto border border-white/[0.08] bg-[#0f0f0f] p-5">
              {/* The source is the user's own input, rendered locally and never
                  shared — the same trust boundary as any other tool here. */}
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ) : (
            <ToolNote>Start typing to see the rendered output.</ToolNote>
          )}
        </Panel>
      </div>

      <RelatedTools ids={["markdown-to-html", "html-to-markdown", "text-counter"]} />
    </DevToolPage>
  );
}
