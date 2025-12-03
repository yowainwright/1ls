import { useEffect, useState } from "react"
import { createHighlighter, type Highlighter } from "shiki"
import type { CodeblockProps } from "./types"
import { THEME, LANGUAGES, CODEBLOCK_CLASSES } from "./constants"

export function Codeblock({
  code,
  language = "json",
  className = "",
}: CodeblockProps) {
  const [html, setHtml] = useState<string>("")

  useEffect(() => {
    let cancelled = false

    getHighlighter().then((highlighter) => {
      if (cancelled) return
      const result = highlighter.codeToHtml(code, {
        lang: language,
        theme: THEME,
      })
      setHtml(result)
    })

    return () => {
      cancelled = true
    }
  }, [code, language])

  if (!html) {
    return (
      <div className={`${CODEBLOCK_CLASSES.container} ${className}`}>
        <pre className={CODEBLOCK_CLASSES.pre}>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div
      className={`${CODEBLOCK_CLASSES.container} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
export type { CodeblockProps, Language } from "./types"
