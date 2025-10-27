import { Sandpack } from "@codesandbox/sandpack-react"
import type { TerminalExample } from "../types"
import { createCommandString, createSandpackFiles } from "../utils"
import { SANDPACK_OPTIONS } from "../constants"

interface TerminalCardProps {
  example: TerminalExample
}

export function TerminalCard({ example }: TerminalCardProps) {
  const files = createSandpackFiles(example.input, example.command)
  const commandString = createCommandString(example.input, example.command)

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <TerminalCardHeader title={example.title} description={example.description} />
      <TerminalCardContent files={files} />
      <TerminalCardFooter command={commandString} output={example.output} />
    </div>
  )
}

interface TerminalCardHeaderProps {
  title: string
  description: string
}

function TerminalCardHeader({ title, description }: TerminalCardHeaderProps) {
  return (
    <div className="border-b border-border bg-muted/50 px-4 py-3">
      <h3 className="font-mono text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

interface TerminalCardContentProps {
  files: Record<string, { code: string; active?: boolean }>
}

function TerminalCardContent({ files }: TerminalCardContentProps) {
  return (
    <div className="relative bg-[#1e1e1e]">
      <Sandpack
        template="static"
        files={files}
        options={SANDPACK_OPTIONS}
        theme="dark"
      />
    </div>
  )
}

interface TerminalCardFooterProps {
  command: string
  output?: string
}

function TerminalCardFooter({ command, output }: TerminalCardFooterProps) {
  return (
    <div className="space-y-2 border-t border-border bg-muted/30 px-4 py-3">
      <div>
        <div className="text-xs font-medium text-muted-foreground">Command:</div>
        <code className="mt-1 block font-mono text-xs text-foreground">
          {command}
        </code>
      </div>
      {output && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Output:</div>
          <code className="mt-1 block font-mono text-xs text-primary">
            {output}
          </code>
        </div>
      )}
    </div>
  )
}
