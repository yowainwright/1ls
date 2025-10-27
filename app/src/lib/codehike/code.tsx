"use client"

import { Pre, highlight } from "codehike/code"
import type { RawCode } from "codehike/code"
import { useEffect, useState } from "react"
import type { CodeProps, HighlightedCode } from "./types"
import { lineNumbers, mark, focus, diff } from "./annotations"
import { COMPONENT_CLASSES } from "./constants"

const defaultHandlers = [lineNumbers, mark, focus, diff]

export function Code({ codeblock, handlers = [] }: CodeProps) {
  const [theme, setTheme] = useState("github-dark")

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "github-dark" : "github-light")

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "github-dark" : "github-light")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const allHandlers = [...defaultHandlers, ...handlers]

  return (
    <div className={COMPONENT_CLASSES.codeBlock}>
      <Pre
        code={codeblock}
        handlers={allHandlers}
        className={COMPONENT_CLASSES.pre}
      />
    </div>
  )
}

export async function highlightCode(
  code: RawCode,
  theme: string = "github-dark"
): Promise<HighlightedCode> {
  return await highlight(code, theme)
}
