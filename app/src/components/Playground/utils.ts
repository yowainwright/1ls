import { evaluate, parseYAML, parseCSV, parseTOML } from "1ls/browser"
import type { Format } from "./types"

const MAX_OUTPUT_LENGTH = 50000
const MAX_ERROR_LENGTH = 500

export interface EvaluationResult {
  output: string
  error: string | null
}

function parseInput(input: string, format: Format): unknown {
  const trimmed = input.trim()
  if (!trimmed) return undefined

  switch (format) {
    case "json":
      return JSON.parse(trimmed)
    case "yaml":
      return parseYAML(trimmed)
    case "csv":
      return parseCSV(trimmed)
    case "toml":
      return parseTOML(trimmed)
    case "text":
      return trimmed.split("\n")
    default:
      return JSON.parse(trimmed)
  }
}

export function runEvaluation(input: string, expression: string, format: Format): EvaluationResult {
  if (!input.trim() || !expression.trim()) {
    return { output: "", error: null }
  }

  try {
    const parsedInput = parseInput(input, format)
    const result = evaluate(parsedInput, expression)
    const output = JSON.stringify(result, null, 2)

    if (output.length > MAX_OUTPUT_LENGTH) {
      return { output: "", error: "Output too large to display" }
    }

    return { output, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { output: "", error: message.slice(0, MAX_ERROR_LENGTH) }
  }
}

export function highlightCode(code: string): string {
  return code
}
