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
  input: string
  expression: string
  output: string
  error: string | null
  format: Format
}
