import { evaluate } from "1ls/browser"

const MAX_OUTPUT_LENGTH = 50000
const MAX_ERROR_LENGTH = 500

export interface EvaluationResult {
  output: string
  error: string | null
}

export function runEvaluation(input: string, expression: string): EvaluationResult {
  if (!input.trim() || !expression.trim()) {
    return { output: "", error: null }
  }

  try {
    const result = evaluate(input, expression)
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
