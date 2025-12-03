import { useState, useCallback, useEffect } from "react"
import Editor from "react-simple-code-editor"
import { Codeblock } from "@/components/Codeblock"
import type { Format } from "./types"
import { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS } from "./constants"
import { runEvaluation, highlightCode } from "./utils"

export function Playground() {
  const [format, setFormat] = useState<Format>("json")
  const [input, setInput] = useState(FORMAT_CONFIGS.json.placeholder)
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION)
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const runExpression = useCallback(() => {
    const result = runEvaluation(input, expression)
    setOutput(result.output)
    setError(result.error)
  }, [input, expression])

  useEffect(() => {
    const timeout = setTimeout(runExpression, 300)
    return () => clearTimeout(timeout)
  }, [runExpression])

  const handleFormatChange = (newFormat: Format) => {
    setFormat(newFormat)
    setInput(FORMAT_CONFIGS[newFormat].placeholder)
    setExpression(newFormat === "json" ? DEFAULT_EXPRESSION : ".")
  }

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader />
        <div className="grid gap-4 lg:grid-cols-2">
          <InputPanel
            format={format}
            input={input}
            expression={expression}
            onFormatChange={handleFormatChange}
            onInputChange={setInput}
            onExpressionChange={setExpression}
          />
          <OutputPanel output={output} error={error} />
        </div>
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="mb-8 text-center">
      <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Try It Live
      </h2>
      <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
        Edit the input data and expression to see results in real-time
      </p>
    </div>
  )
}

interface InputPanelProps {
  format: Format
  input: string
  expression: string
  onFormatChange: (format: Format) => void
  onInputChange: (input: string) => void
  onExpressionChange: (expression: string) => void
}

function InputPanel({
  format,
  input,
  expression,
  onFormatChange,
  onInputChange,
  onExpressionChange,
}: InputPanelProps) {
  return (
    <div className="space-y-4">
      <FormatTabs format={format} onFormatChange={onFormatChange} />
      <div className="rounded-lg border border-border/10 bg-card shadow-md shadow-black/5 dark:shadow-black/20">
        <div className="border-b border-border/10 px-4 py-2 text-sm text-muted-foreground">
          Input
        </div>
        <Editor
          value={input}
          onValueChange={onInputChange}
          highlight={highlightCode}
          padding={16}
          className="font-mono text-sm"
          style={{
            minHeight: "200px",
            backgroundColor: "transparent",
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
      <div className="rounded-lg border border-border/10 bg-card shadow-md shadow-black/5 dark:shadow-black/20">
        <div className="border-b border-border/10 px-4 py-2 text-sm text-muted-foreground">
          Expression
        </div>
        <Editor
          value={expression}
          onValueChange={onExpressionChange}
          highlight={highlightCode}
          padding={16}
          className="font-mono text-sm"
          style={{
            backgroundColor: "transparent",
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
    </div>
  )
}

interface FormatTabsProps {
  format: Format
  onFormatChange: (format: Format) => void
}

function FormatTabs({ format, onFormatChange }: FormatTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border/10 bg-muted p-1 shadow-sm">
      {FORMATS.map((f) => (
        <button
          key={f}
          onClick={() => onFormatChange(f)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            format === f
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {FORMAT_CONFIGS[f].label}
        </button>
      ))}
    </div>
  )
}

interface OutputPanelProps {
  output: string
  error: string | null
}

function OutputPanel({ output, error }: OutputPanelProps) {
  return (
    <div className="space-y-4">
      <div className="h-[42px]" /> {/* Spacer to align with format tabs */}
      <div className="rounded-lg border border-border/10 shadow-md shadow-black/5 dark:shadow-black/20">
        <div className="border-b border-border/10 bg-muted px-4 py-2 text-sm text-muted-foreground">
          Output
        </div>
        {error ? (
          <div className="p-4 font-mono text-sm text-red-400">{error}</div>
        ) : (
          <Codeblock code={output || "// Result will appear here"} language="json" />
        )}
      </div>
    </div>
  )
}

export { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS } from "./constants"
export { runEvaluation, highlightCode } from "./utils"
export type { Format, FormatConfig, PlaygroundState } from "./types"
