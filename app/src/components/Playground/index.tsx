import { useState, useEffect, useRef, useCallback } from "react"
import Editor from "react-simple-code-editor"
import { Minimize2, Maximize2 } from "lucide-react"
import { Codeblock } from "@/components/Codeblock"
import { SectionHeader } from "@/components/SectionHeader"
import type { Format } from "./types"
import { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS } from "./constants"
import { runEvaluation, highlightCode } from "./utils"

interface PlaygroundState {
  format: Format
  input: string
  expression: string
  isMinified: boolean
}

interface EvaluationState {
  output: string
  error: string | null
}

function usePlaygroundEvaluation(state: PlaygroundState) {
  const [evaluation, setEvaluation] = useState<EvaluationState>({ output: "", error: null })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    const timeoutId = setTimeout(() => {
      if (signal.aborted) return
      const result = runEvaluation(state.input, state.expression, state.format)
      if (!signal.aborted) {
        setEvaluation(result)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      abortRef.current?.abort()
    }
  }, [state.input, state.expression, state.format])

  return evaluation
}

export function Playground() {
  const [state, setState] = useState<PlaygroundState>({
    format: "json",
    input: FORMAT_CONFIGS.json.placeholder,
    expression: DEFAULT_EXPRESSION,
    isMinified: false,
  })

  const { output, error } = usePlaygroundEvaluation(state)

  const handleFormatChange = useCallback((newFormat: Format) => {
    setState((prev) => {
      const newInput = FORMAT_CONFIGS[newFormat].placeholder
      return {
        ...prev,
        format: newFormat,
        input: prev.isMinified ? minifyInput(newInput, newFormat) : newInput,
        expression: FORMAT_CONFIGS[newFormat].suggestions[0]?.expression || ".",
      }
    })
  }, [])

  const handleMinifyToggle = useCallback(() => {
    setState((prev) => {
      const newMinified = !prev.isMinified
      return {
        ...prev,
        isMinified: newMinified,
        input: newMinified
          ? minifyInput(prev.input, prev.format)
          : FORMAT_CONFIGS[prev.format].placeholder,
      }
    })
  }, [])

  const handleInputChange = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input }))
  }, [])

  const handleExpressionChange = useCallback((expression: string) => {
    setState((prev) => ({ ...prev, expression }))
  }, [])

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Try It Live"
          description="Edit the input data and expression to see results in real-time"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <InputPanel
            format={state.format}
            input={state.input}
            expression={state.expression}
            isMinified={state.isMinified}
            onFormatChange={handleFormatChange}
            onInputChange={handleInputChange}
            onExpressionChange={handleExpressionChange}
            onMinifyToggle={handleMinifyToggle}
            onSuggestionClick={handleExpressionChange}
          />
          <OutputPanel output={output} error={error} />
        </div>
      </div>
    </section>
  )
}

function minifyInput(input: string, format: Format): string {
  if (format === "json") {
    try {
      return JSON.stringify(JSON.parse(input))
    } catch {
      return input
    }
  }
  return input.split("\n").map(l => l.trim()).filter(Boolean).join("\n")
}

interface InputPanelProps {
  format: Format
  input: string
  expression: string
  isMinified: boolean
  onFormatChange: (format: Format) => void
  onInputChange: (input: string) => void
  onExpressionChange: (expression: string) => void
  onMinifyToggle: () => void
  onSuggestionClick: (expression: string) => void
}

function InputPanel({
  format,
  input,
  expression,
  isMinified,
  onFormatChange,
  onInputChange,
  onExpressionChange,
  onMinifyToggle,
  onSuggestionClick,
}: InputPanelProps) {
  const suggestions = FORMAT_CONFIGS[format].suggestions

  return (
    <div className="space-y-4">
      <FormatTabs format={format} onFormatChange={onFormatChange} />
      <div className="rounded-xl border border-border/10 bg-card shadow-md shadow-black/5 overflow-hidden dark:shadow-black/20">
        <div className="flex items-center justify-between border-b border-border/10 bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Input</span>
          <button
            onClick={onMinifyToggle}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            title={isMinified ? "Expand" : "Minify"}
          >
            {isMinified ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            {isMinified ? "Expand" : "Minify"}
          </button>
        </div>
        <Editor
          value={input}
          onValueChange={onInputChange}
          highlight={highlightCode}
          padding={16}
          className="font-mono text-sm"
          style={{
            minHeight: isMinified ? "80px" : "240px",
            maxHeight: "400px",
            overflow: "auto",
            backgroundColor: "transparent",
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
      <div className="rounded-xl border border-border/10 bg-card shadow-md shadow-black/5 overflow-hidden dark:shadow-black/20">
        <div className="border-b border-border/10 bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Expression</span>
        </div>
        <Editor
          value={expression}
          onValueChange={onExpressionChange}
          highlight={highlightCode}
          padding={16}
          className="font-mono text-sm"
          style={{ backgroundColor: "transparent" }}
          textareaClassName="focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground py-1">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s.expression}
            onClick={() => onSuggestionClick(s.expression)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              expression === s.expression
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
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
    <div className="flex gap-1 rounded-xl border border-border/10 bg-muted p-1 shadow-sm">
      {FORMATS.map((f) => (
        <button
          key={f}
          onClick={() => onFormatChange(f)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
      <div className="h-[42px]" />
      <div className="rounded-xl border border-border/10 bg-card shadow-md shadow-black/5 overflow-hidden dark:shadow-black/20">
        <div className="border-b border-border/10 bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Output</span>
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
