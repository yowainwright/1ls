import { useState, useEffect, useRef, useCallback } from "react"
import EditorModule from "react-simple-code-editor"
import { Minimize2, Maximize2, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Codeblock, CopyButton, getHighlighter, THEME, LANGUAGES } from "@/components/Codeblock"
import type { Highlighter } from "shiki"
import { SectionHeader } from "@/components/SectionHeader"
import type {
  Format,
  PlaygroundMode,
  PlaygroundState,
  EvaluationState,
  PlaygroundProps,
  InputPanelProps,
  FormatTabsProps,
  OutputPanelProps,
  PlaygroundHeaderProps,
} from "./types"
import { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS, SANDBOX_STARTER } from "./constants"
import { runEvaluation, detectFormat, minifyExpression, expandExpression } from "./utils"
import { saveState, loadState, getShareableUrl, getStateFromUrl } from "./storage"

const Editor = (EditorModule as { default?: typeof EditorModule }).default || EditorModule

const SANDBOX_PLACEHOLDER = "Paste your JSON, YAML, CSV, TOML, or plain text here..."

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

function useFormatDetection(
  input: string,
  mode: PlaygroundMode,
  onFormatDetected: (format: Format) => void
) {
  const previousInputRef = useRef<string>("")

  useEffect(() => {
    if (mode !== "sandbox") return
    if (input === previousInputRef.current) return
    if (input === SANDBOX_PLACEHOLDER || !input.trim()) return

    previousInputRef.current = input

    const timeoutId = setTimeout(() => {
      const detected = detectFormat(input)
      onFormatDetected(detected.format)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [input, mode, onFormatDetected])
}

function useShikiHighlighter() {
  const highlighterRef = useRef<Highlighter | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getHighlighter().then((h) => {
      highlighterRef.current = h
      setReady(true)
    })
  }, [])

  const highlight = useCallback((code: string, language: string): string => {
    if (!highlighterRef.current || !code) return escapeHtml(code)
    const lang = language === "csv" || language === "text" ? "txt" : language
    const validLang = LANGUAGES.includes(lang as typeof LANGUAGES[number]) ? lang : "txt"
    try {
      const html = highlighterRef.current.codeToHtml(code, {
        lang: validLang,
        theme: THEME,
      })
      const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
      return match ? match[1] : escapeHtml(code)
    } catch {
      return escapeHtml(code)
    }
  }, [])

  return { highlight, ready }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function Playground({ mode = "preset" }: PlaygroundProps) {
  const isSandbox = mode === "sandbox"
  const [isInitialized, setIsInitialized] = useState(false)
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle")

  const [state, setState] = useState<PlaygroundState>(() => ({
    format: "json",
    input: isSandbox ? SANDBOX_STARTER.json.data : FORMAT_CONFIGS.json.placeholder,
    expression: isSandbox ? SANDBOX_STARTER.json.expression : DEFAULT_EXPRESSION,
    isMinified: false,
    showMinifiedExpression: false,
  }))

  useEffect(() => {
    if (!isSandbox || isInitialized) return

    const urlState = getStateFromUrl()
    if (urlState) {
      setState(prev => ({ ...prev, ...urlState }))
      setIsInitialized(true)
      return
    }

    loadState().then(stored => {
      if (stored) {
        setState(prev => ({ ...prev, format: stored.format, input: stored.input, expression: stored.expression }))
      }
      setIsInitialized(true)
    })
  }, [isSandbox, isInitialized])

  useEffect(() => {
    if (!isSandbox || !isInitialized) return
    const timeoutId = setTimeout(() => {
      saveState({ format: state.format, input: state.input, expression: state.expression })
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [isSandbox, isInitialized, state.format, state.input, state.expression])

  const handleShare = useCallback(() => {
    const url = getShareableUrl({ format: state.format, input: state.input, expression: state.expression })
    navigator.clipboard.writeText(url).then(() => {
      setShareStatus("copied")
      setTimeout(() => setShareStatus("idle"), 2000)
    })
  }, [state.format, state.input, state.expression])

  const { output, error } = usePlaygroundEvaluation(state)

  const handleFormatDetected = useCallback((detectedFormat: Format) => {
    setState((prev) => ({ ...prev, format: detectedFormat }))
  }, [])

  useFormatDetection(state.input, mode, handleFormatDetected)

  const handleFormatChange = useCallback((newFormat: Format) => {
    setState((prev) => {
      if (isSandbox) {
        const starter = SANDBOX_STARTER[newFormat]
        return {
          ...prev,
          format: newFormat,
          input: starter.data,
          expression: starter.expression,
        }
      }
      const newInput = FORMAT_CONFIGS[newFormat].placeholder
      return {
        ...prev,
        format: newFormat,
        input: prev.isMinified ? minifyInput(newInput, newFormat) : newInput,
        expression: FORMAT_CONFIGS[newFormat].suggestions[0]?.expression || ".",
      }
    })
  }, [isSandbox])

  const handleMinifyToggle = useCallback(() => {
    setState((prev) => {
      const newMinified = !prev.isMinified
      if (isSandbox) {
        return {
          ...prev,
          isMinified: newMinified,
          input: newMinified ? minifyInput(prev.input, prev.format) : prev.input,
        }
      }
      return {
        ...prev,
        isMinified: newMinified,
        input: newMinified
          ? minifyInput(prev.input, prev.format)
          : FORMAT_CONFIGS[prev.format].placeholder,
      }
    })
  }, [isSandbox])

  const handleShowMinifiedToggle = useCallback(() => {
    setState((prev) => ({ ...prev, showMinifiedExpression: !prev.showMinifiedExpression }))
  }, [])

  const handleInputChange = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input }))
  }, [])

  const handleExpressionChange = useCallback((expression: string) => {
    setState((prev) => ({ ...prev, expression }))
  }, [])

  const title = isSandbox ? "Playground" : "Try It Live"
  const description = isSandbox
    ? "Paste your data, write expressions, and see results in real-time"
    : "Edit the input data and expression to see results in real-time"

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <PlaygroundHeader
          title={title}
          description={description}
          showShare={isSandbox}
          shareStatus={shareStatus}
          onShare={handleShare}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <InputPanel
            mode={mode}
            format={state.format}
            input={state.input}
            expression={state.expression}
            isMinified={state.isMinified}
            showMinifiedExpression={state.showMinifiedExpression}
            onFormatChange={handleFormatChange}
            onInputChange={handleInputChange}
            onExpressionChange={handleExpressionChange}
            onMinifyToggle={handleMinifyToggle}
            onShowMinifiedToggle={handleShowMinifiedToggle}
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

function InputPanel({
  mode,
  format,
  input,
  expression,
  isMinified,
  showMinifiedExpression,
  onFormatChange,
  onInputChange,
  onExpressionChange,
  onMinifyToggle,
  onShowMinifiedToggle,
  onSuggestionClick,
}: InputPanelProps) {
  const suggestions = FORMAT_CONFIGS[format].suggestions
  const isSandbox = mode === "sandbox"
  const showSuggestions = !isSandbox && suggestions.length > 0
  const minifiedExpression = minifyExpression(expression)
  const { highlight } = useShikiHighlighter()

  const highlightInput = useCallback(
    (code: string) => highlight(code, FORMAT_CONFIGS[format].language),
    [highlight, format]
  )

  const highlightExpression = useCallback(
    (code: string) => highlight(code, "javascript"),
    [highlight]
  )

  return (
    <div className="space-y-4">
      <FormatTabs format={format} onFormatChange={onFormatChange} />
      <div className="rounded-xl border border-border/10 bg-card shadow-md shadow-black/5 overflow-hidden dark:shadow-black/20">
        <div className="flex items-center justify-between border-b border-border/10 bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Input</span>
          {!isSandbox && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinifyToggle}
              title={isMinified ? "Expand" : "Minify"}
            >
              {isMinified ? <Maximize2 /> : <Minimize2 />}
              {isMinified ? "Expand" : "Minify"}
            </Button>
          )}
        </div>
        <Editor
          value={input}
          onValueChange={onInputChange}
          highlight={highlightInput}
          padding={16}
          placeholder={isSandbox ? SANDBOX_PLACEHOLDER : undefined}
          className="font-mono text-sm [&_.shiki]:!bg-transparent [&_.line]:block"
          style={{
            minHeight: "240px",
            maxHeight: "400px",
            overflow: "auto",
            backgroundColor: "transparent",
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
      <div className="rounded-xl border border-border/10 bg-card shadow-md shadow-black/5 overflow-hidden dark:shadow-black/20 relative">
        <div className="border-b border-border/10 bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Expression</span>
        </div>
        <CopyButton code={expression} className="top-2 right-2" />
        <Editor
          value={expression}
          onValueChange={onExpressionChange}
          highlight={highlightExpression}
          padding={16}
          className="font-mono text-sm [&_.shiki]:!bg-transparent [&_.line]:block"
          style={{ backgroundColor: "transparent" }}
          textareaClassName="focus:outline-none"
        />
        <div className="border-t border-border/10 px-4 py-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onShowMinifiedToggle}
          >
            {showMinifiedExpression ? "Hide Minified" : "Minify"}
          </Button>
        </div>
        {showMinifiedExpression && (
          <div className="border-t border-border/10">
            <Codeblock
              code={minifiedExpression}
              language="bash"
              showLineNumbers={false}
            />
          </div>
        )}
      </div>
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground py-1">Try:</span>
          {suggestions.map((s) => (
            <Button
              key={s.expression}
              variant={expression === s.expression ? "default" : "secondary"}
              size="sm"
              onClick={() => onSuggestionClick(s.expression)}
              className="rounded-full"
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function FormatTabs({ format, onFormatChange }: FormatTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-border/10 bg-muted p-1 shadow-sm">
      {FORMATS.map((f) => (
        <Button
          key={f}
          variant={format === f ? "outline" : "ghost"}
          size="sm"
          onClick={() => onFormatChange(f)}
        >
          {FORMAT_CONFIGS[f].label}
        </Button>
      ))}
    </div>
  )
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

function PlaygroundHeader({ title, description, showShare, shareStatus, onShare }: PlaygroundHeaderProps) {
  return (
    <div className="mb-8">
      <SectionHeader title={title} description={description} className={showShare ? "mb-4" : "mb-0"} />
      {showShare && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onShare}>
            {shareStatus === "copied" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shareStatus === "copied" ? "Copied!" : "Share"}
          </Button>
        </div>
      )}
    </div>
  )
}

export { FORMAT_CONFIGS, DEFAULT_EXPRESSION, FORMATS } from "./constants"
export { runEvaluation, detectFormat, minifyExpression, expandExpression } from "./utils"
export type { Format, FormatConfig, PlaygroundState, PlaygroundMode, DetectionResult } from "./types"
