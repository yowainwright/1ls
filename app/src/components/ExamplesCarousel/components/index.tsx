"use client"

import { useEffect, useState } from "react"
import { Code, highlightCode } from "@/lib/codehike"
import type { HighlightedCode } from "@/lib/codehike"
import type { CodeExample } from "../types"

interface SpotlightCardProps {
  example: CodeExample
}

export function SpotlightCard({ example }: SpotlightCardProps) {
  const [inputCode, setInputCode] = useState<HighlightedCode | null>(null)
  const [outputCode, setOutputCode] = useState<HighlightedCode | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function highlight() {
      setIsLoading(true)
      const [input, output] = await Promise.all([
        highlightCode(
          { value: example.input, lang: example.language, meta: "" },
          "github-dark"
        ),
        highlightCode(
          { value: example.output, lang: "json", meta: "" },
          "github-dark"
        ),
      ])
      setInputCode(input)
      setOutputCode(output)
      setIsLoading(false)
    }

    highlight()
  }, [example])

  if (isLoading || !inputCode || !outputCode) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full space-y-4 rounded-lg border border-border bg-card p-6">
      <SpotlightCardHeader
        title={example.title}
        description={example.description}
        format={example.format}
      />
      <SpotlightCardContent
        inputCode={inputCode}
        outputCode={outputCode}
        command={example.command}
      />
    </div>
  )
}

interface SpotlightCardHeaderProps {
  title: string
  description: string
  format: string
}

function SpotlightCardHeader({ title, description, format }: SpotlightCardHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {format}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

interface SpotlightCardContentProps {
  inputCode: HighlightedCode
  outputCode: HighlightedCode
  command: string
}

function SpotlightCardContent({ inputCode, outputCode, command }: SpotlightCardContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Input:</div>
        <Code codeblock={inputCode} />
      </div>

      <div className="flex items-center justify-center">
        <div className="rounded-lg bg-muted px-3 py-1.5 font-mono text-sm">
          <span className="text-muted-foreground">$</span>{" "}
          <span className="text-primary">{command}</span>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Output:</div>
        <Code codeblock={outputCode} />
      </div>
    </div>
  )
}
