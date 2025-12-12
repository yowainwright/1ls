import { useEffect, useState } from "react"
import { createHighlighter, type Highlighter } from "shiki"
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers"
import type { CodeblockProps } from "./types"
import { THEME, LANGUAGES, CODEBLOCK_CLASSES } from "./constants"
import { CopyButton } from "./CopyButton"
import { cn } from "@/lib/utils"

export function Codeblock({
  code,
  language = "json",
  className = "",
  showLineNumbers = true,
  showLanguage = true,
  showCopy = true,
  title,
}: CodeblockProps) {
  const [html, setHtml] = useState<string>("")
  const trimmedCode = code.trim()
  const lineCount = trimmedCode.split("\n").length

  useEffect(() => {
    let cancelled = false

    getHighlighter().then((highlighter) => {
      if (cancelled) return
      const result = highlighter.codeToHtml(trimmedCode, {
        lang: language,
        theme: THEME,
        transformers: [
          transformerNotationDiff(),
          transformerNotationHighlight(),
          transformerNotationFocus(),
        ],
      })
      setHtml(result)
    })

    return () => {
      cancelled = true
    }
  }, [trimmedCode, language])

  const lineNumbers = showLineNumbers && lineCount > 1

  return (
    <div className={cn(CODEBLOCK_CLASSES.wrapper, className)}>
      {title && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      )}

      {showLanguage && (
        <span className={CODEBLOCK_CLASSES.languageBadge}>
          {language}
        </span>
      )}

      {showCopy && <CopyButton code={trimmedCode} />}

      {!html ? (
        <pre className="overflow-x-auto p-4 pt-12 text-sm">
          <code>{trimmedCode}</code>
        </pre>
      ) : (
        <div
          className={cn(
            "shiki-content overflow-x-auto text-sm",
            "[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:pt-12",
            lineNumbers && "[&_.line]:table-row",
            lineNumbers && "[&_.line::before]:table-cell [&_.line::before]:pr-4 [&_.line::before]:text-right [&_.line::before]:select-none [&_.line::before]:text-muted-foreground/40 [&_.line::before]:border-r [&_.line::before]:border-white/10 [&_.line::before]:sticky [&_.line::before]:left-0 [&_.line::before]:bg-[#282a36]",
            lineNumbers && "[&_code]:table [&_code]:w-full",
            "[&_.line>span:first-child]:pl-4",
            "[&_.diff.add]:bg-green-500/20 [&_.diff.add::before]:text-green-400",
            "[&_.diff.remove]:bg-red-500/20 [&_.diff.remove::before]:text-red-400",
            "[&_.highlighted]:bg-primary/20",
            "[&_.highlighted-word]:bg-primary/30 [&_.highlighted-word]:rounded [&_.highlighted-word]:px-1",
          )}
          style={{
            counterReset: lineNumbers ? "line" : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: [...LANGUAGES],
    })
  }
  return highlighterPromise
}

export { THEME, LANGUAGES, CODEBLOCK_CLASSES } from "./constants"
export { CopyButton } from "./CopyButton"
export type { CodeblockProps, Language } from "./types"
