import { evaluate, parseYAML, parseCSV, parseTOML, expandShortcuts, shortenExpression } from "1ls/browser"
import type { Format, DetectionResult } from "./types"
import { TEXT_FALLBACK, EMPTY_RESULT } from "./constants"

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

export type FormatDetector = (content: string) => DetectionResult | null

export function isValidJSON(content: string): boolean {
  try {
    JSON.parse(content)
    return true
  } catch {
    return false
  }
}

export function looksLikeJSON(content: string): boolean {
  return content.startsWith("{") || content.startsWith("[")
}

export function countCommas(line: string): number {
  return (line.match(/,/g) || []).length
}

export function hasConsistentCommaCount(lines: string[]): boolean {
  if (lines.length < 2) return false
  const headerCommas = countCommas(lines[0])
  if (headerCommas < 1) return false
  return lines.slice(1).every(line => countCommas(line) === headerCommas)
}

export const detectJSON: FormatDetector = (content) => {
  if (!looksLikeJSON(content)) return null
  if (isValidJSON(content)) return { format: "json", confidence: 1.0, reason: "Valid JSON structure" }
  return null
}

export const detectTOML: FormatDetector = (content) => {
  const hasSections = /^\[[^\]]+\]/m.test(content)
  const hasAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(content)
  if (!hasSections || !hasAssignment) return null
  return { format: "toml", confidence: 0.9, reason: "TOML sections detected" }
}

export const detectCSV: FormatDetector = (content) => {
  const lines = content.split("\n").filter(l => l.trim())
  if (!hasConsistentCommaCount(lines)) return null
  return { format: "csv", confidence: 0.85, reason: "Consistent CSV structure" }
}

export const detectYAML: FormatDetector = (content) => {
  const hasListItems = /^[ ]*- /m.test(content)
  const hasKeyValue = /^[a-zA-Z_][a-zA-Z0-9_]*:\s/m.test(content)
  const lineCount = content.split("\n").filter(l => l.trim()).length
  if (!hasListItems && !(hasKeyValue && lineCount > 1)) return null
  return { format: "yaml", confidence: 0.85, reason: "YAML structure detected" }
}

export const detectMalformedJSON: FormatDetector = (content) => {
  if (!looksLikeJSON(content)) return null
  return { format: "json", confidence: 0.6, reason: "Likely malformed JSON" }
}

export const DETECTORS: FormatDetector[] = [
  detectJSON,
  detectTOML,
  detectCSV,
  detectYAML,
  detectMalformedJSON,
]

export function detectFormat(content: string): DetectionResult {
  const trimmed = content.trim()
  if (!trimmed) return EMPTY_RESULT

  const firstMatch = DETECTORS.map(detect => detect(trimmed)).find(result => result !== null)
  return firstMatch ?? TEXT_FALLBACK
}

export function minifyExpression(expression: string): string {
  return shortenExpression(expression)
}

export function expandExpression(expression: string): string {
  return expandShortcuts(expression)
}
