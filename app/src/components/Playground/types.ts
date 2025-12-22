export type Format = "json" | "yaml" | "csv" | "toml" | "text"

export type PlaygroundMode = "preset" | "sandbox"

export interface FormatConfig {
  label: string
  language: string
  placeholder: string
}

export interface DetectionResult {
  format: Format
  confidence: number
  reason: string
}

export interface PlaygroundState {
  format: Format
  input: string
  expression: string
  showMinifiedExpression: boolean
}

export interface EvaluationState {
  output: string
  error: string | null
}

export interface PlaygroundProps {
  mode?: PlaygroundMode
}

export interface InputPanelProps {
  mode: PlaygroundMode
  format: Format
  input: string
  expression: string
  showMinifiedExpression: boolean
  onFormatChange: (format: Format) => void
  onInputChange: (input: string) => void
  onExpressionChange: (expression: string) => void
  onShowMinifiedToggle: () => void
  onSuggestionClick: (expression: string) => void
}

export interface FormatTabsProps {
  format: Format
  onFormatChange: (format: Format) => void
}

export interface OutputPanelProps {
  output: string
  error: string | null
}

export interface PlaygroundHeaderProps {
  title: string
  description: string
  showShare: boolean
  shareStatus: "idle" | "copied"
  onShare: () => void
}
