import { Codeblock } from "@/components/Codeblock"
import type { Language } from "@/components/Codeblock"
import type { CodeExample } from "../types"

interface SpotlightCardProps {
  example: CodeExample
}

export function SpotlightCard({ example }: SpotlightCardProps) {
  return (
    <div className="h-full w-full space-y-4 rounded-lg border border-border/10 bg-card p-6 shadow-lg shadow-black/5 dark:shadow-black/20">
      <SpotlightCardHeader
        title={example.title}
        description={example.description}
        format={example.format}
      />
      <SpotlightCardContent
        input={example.input}
        output={example.output}
        command={example.command}
        language={example.language as Language}
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
  input: string
  output: string
  command: string
  language: Language
}

function SpotlightCardContent({ input, output, command, language }: SpotlightCardContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Input:</div>
        <Codeblock code={input} language={language} />
      </div>

      <div className="flex items-center justify-center">
        <div className="rounded-lg bg-muted px-3 py-1.5 font-mono text-sm">
          <span className="text-muted-foreground">$</span>{" "}
          <span className="text-primary">{command}</span>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Output:</div>
        <Codeblock code={output} language="json" />
      </div>
    </div>
  )
}
