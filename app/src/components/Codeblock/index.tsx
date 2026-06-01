import { use, Suspense } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import type { CodeblockProps } from "./types";
import { THEME, LANGUAGES, CODEBLOCK_CLASSES } from "./constants";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function CodeblockContent({
  code,
  language,
  lineNumbers,
}: {
  code: string;
  language: string;
  lineNumbers: boolean;
}) {
  const highlighter = use(getHighlighter());
  let html: string;
  try {
    html = highlighter.codeToHtml(code, {
      lang: language,
      theme: THEME,
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
      ],
    });
  } catch {
    html = `<pre><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
  }

  return (
    <div
      className={cn(
        "shiki-content overflow-x-auto text-sm",
        "[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:pt-12",
        lineNumbers && "[&_.line]:table-row",
        lineNumbers &&
          "[&_.line::before]:table-cell [&_.line::before]:pr-4 [&_.line::before]:text-right [&_.line::before]:select-none [&_.line::before]:text-muted-foreground/40 [&_.line::before]:border-r [&_.line::before]:border-white/10 [&_.line::before]:sticky [&_.line::before]:left-0 [&_.line::before]:bg-[#282a36]",
        lineNumbers && "[&_code]:table [&_code]:w-full",
        "[&_.line>span:first-child]:pl-4",
        "[&_.diff.add]:bg-green-500/20 [&_.diff.add::before]:text-green-400",
        "[&_.diff.remove]:bg-red-500/20 [&_.diff.remove::before]:text-red-400",
        "[&_.highlighted]:bg-primary/20",
        "[&_.highlighted-word]:bg-primary/30 [&_.highlighted-word]:rounded [&_.highlighted-word]:px-1",
      )}
      style={{ counterReset: lineNumbers ? "line" : undefined }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function Codeblock({
  code,
  language = "json",
  className = "",
  showLineNumbers = true,
  showLanguage = true,
  showCopy = true,
  title,
}: CodeblockProps) {
  const trimmedCode = code.trim();
  const lineNumbers = showLineNumbers && trimmedCode.split("\n").length > 1;

  return (
    <div className={cn(CODEBLOCK_CLASSES.wrapper, className)}>
      {title && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      )}

      {showLanguage && <Badge variant="outline" className={CODEBLOCK_CLASSES.languageBadge}>{language}</Badge>}

      {showCopy && <CopyButton code={trimmedCode} />}

      <Suspense
        fallback={
          <pre className="overflow-x-auto p-4 pt-12 text-sm">
            <code>{trimmedCode}</code>
          </pre>
        }
      >
        <CodeblockContent code={trimmedCode} language={language} lineNumbers={lineNumbers} />
      </Suspense>
    </div>
  );
}

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: [...LANGUAGES],
    });
  }
  return highlighterPromise;
}

export { THEME, LANGUAGES, CODEBLOCK_CLASSES } from "./constants";
export { CopyButton } from "./CopyButton";
export { CodeCard } from "./CodeCard";
export type { CodeblockProps, Language, CodeCardProps } from "./types";
