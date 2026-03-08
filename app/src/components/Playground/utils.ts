import { Effect, Data } from "effect";
import {
  evaluate,
  parseYAML,
  parseCSV,
  parseTOML,
  expandShortcuts,
  shortenExpression,
} from "1ls/browser";
import type { Format, DetectionResult, PlaygroundContext } from "./types";
import { TEXT_FALLBACK, EMPTY_RESULT, FORMAT_CONFIGS, SANDBOX_STARTER } from "./constants";
import { saveState, loadState, getStateFromUrl } from "./storage";

const MAX_OUTPUT_LENGTH = 50000;
const MAX_ERROR_LENGTH = 500;

export interface EvaluationResult {
  output: string;
  error: string | null;
}

class ParseError extends Data.TaggedError("ParseError")<{ cause: unknown }> {}
class EvaluationError extends Data.TaggedError("EvaluationError")<{ cause: unknown }> {}

function parseInput(input: string, format: Format): Effect.Effect<unknown, ParseError> {
  const trimmed = input.trim();
  if (!trimmed) return Effect.succeed(undefined);
  return Effect.try({
    try: () => {
      switch (format) {
        case "json":
          return JSON.parse(trimmed);
        case "yaml":
          return parseYAML(trimmed);
        case "csv":
          return parseCSV(trimmed);
        case "toml":
          return parseTOML(trimmed);
        case "text":
          return trimmed.split("\n");
        default:
          return JSON.parse(trimmed);
      }
    },
    catch: (cause) => new ParseError({ cause }),
  });
}

export function runEvaluation(
  input: string,
  expression: string,
  format: Format,
): Effect.Effect<EvaluationResult> {
  if (!input.trim() || !expression.trim()) {
    return Effect.succeed({ output: "", error: null });
  }

  return Effect.gen(function* () {
    const parsedInput = yield* parseInput(input, format);
    const result = yield* Effect.try({
      try: () => evaluate(parsedInput, expression),
      catch: (cause) => new EvaluationError({ cause }),
    });
    const output = JSON.stringify(result, null, 2);
    if (output.length > MAX_OUTPUT_LENGTH) {
      return { output: "", error: "Output too large to display" } satisfies EvaluationResult;
    }
    return { output, error: null } satisfies EvaluationResult;
  }).pipe(
    Effect.catchAll((e) => {
      const message = e.cause instanceof Error ? e.cause.message : String(e.cause);
      return Effect.succeed<EvaluationResult>({
        output: "",
        error: message.slice(0, MAX_ERROR_LENGTH),
      });
    }),
  );
}

export function highlightCode(code: string): string {
  return code;
}

export type FormatDetector = (content: string) => DetectionResult | null;

export function isValidJSON(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

export function looksLikeJSON(content: string): boolean {
  return content.startsWith("{") || content.startsWith("[");
}

export function countCommas(line: string): number {
  return (line.match(/,/g) || []).length;
}

export function hasConsistentCommaCount(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const headerCommas = countCommas(lines[0]);
  if (headerCommas < 1) return false;
  return lines.slice(1).every((line) => countCommas(line) === headerCommas);
}

export const detectJSON: FormatDetector = (content) => {
  if (!looksLikeJSON(content)) return null;
  if (isValidJSON(content))
    return { format: "json", confidence: 1.0, reason: "Valid JSON structure" };
  return null;
};

export const detectTOML: FormatDetector = (content) => {
  const hasSections = /^\[[^\]]+\]/m.test(content);
  const hasAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(content);
  if (!hasSections || !hasAssignment) return null;
  return { format: "toml", confidence: 0.9, reason: "TOML sections detected" };
};

export const detectCSV: FormatDetector = (content) => {
  const lines = content.split("\n").filter((l) => l.trim());
  if (!hasConsistentCommaCount(lines)) return null;
  return { format: "csv", confidence: 0.85, reason: "Consistent CSV structure" };
};

export const detectYAML: FormatDetector = (content) => {
  const hasListItems = /^[ ]*- /m.test(content);
  const hasNestedIndent = /^\s{2,}[a-zA-Z_]/m.test(content);
  const hasKeyValue = /^[a-zA-Z_][a-zA-Z0-9_]*:\s/m.test(content);
  const lineCount = content.split("\n").filter((l) => l.trim()).length;

  const rootKeys = content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith(" ") && !l.startsWith("\t"))
    .map((l) => l.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/)?.[1])
    .filter(Boolean);
  const uniqueRootKeys = new Set(rootKeys);
  const hasDuplicateRootKeys = rootKeys.length > uniqueRootKeys.size;

  if (hasDuplicateRootKeys) return null;
  if (hasListItems) return { format: "yaml", confidence: 0.9, reason: "YAML list items detected" };
  if (hasNestedIndent && hasKeyValue)
    return { format: "yaml", confidence: 0.85, reason: "YAML nested structure detected" };
  if (hasKeyValue && lineCount > 1 && uniqueRootKeys.size > 1)
    return { format: "yaml", confidence: 0.8, reason: "YAML key-value pairs detected" };

  return null;
};

export const detectMalformedJSON: FormatDetector = (content) => {
  if (!looksLikeJSON(content)) return null;
  return { format: "json", confidence: 0.6, reason: "Likely malformed JSON" };
};

export const DETECTORS: FormatDetector[] = [
  detectJSON,
  detectTOML,
  detectCSV,
  detectYAML,
  detectMalformedJSON,
];

export function detectFormat(content: string): DetectionResult {
  const trimmed = content.trim();
  if (!trimmed) return EMPTY_RESULT;

  const firstMatch = DETECTORS.map((detect) => detect(trimmed)).find((result) => result !== null);
  return firstMatch ?? TEXT_FALLBACK;
}

export function minifyExpression(expression: string): string {
  return shortenExpression(expression);
}

export function expandExpression(expression: string): string {
  return expandShortcuts(expression);
}

// --- Machine actors, actions, guards ---

export type InitialState = Pick<PlaygroundContext, "format" | "input" | "expression"> | null;

export async function loadInitialStateActor({
  input: { isSandbox },
}: {
  input: { isSandbox: boolean };
}): Promise<InitialState> {
  if (!isSandbox) return null;
  return getStateFromUrl() ?? Effect.runPromise(loadState());
}

export function persistPlaygroundState({ context }: { context: PlaygroundContext }): void {
  if (!context.isSandbox) return;
  Effect.runPromise(
    saveState({ format: context.format, input: context.input, expression: context.expression }),
  );
}

export function computeFormatChange(
  context: PlaygroundContext,
  format: Format,
): Partial<PlaygroundContext> {
  const starter = SANDBOX_STARTER[format];
  return context.isSandbox
    ? { format, input: starter.data, expression: starter.expression }
    : { format, input: FORMAT_CONFIGS[format].placeholder, expression: FORMAT_CONFIGS[format].suggestions[0]?.expression ?? "." };
}

export function isSandboxGuard({ context }: { context: PlaygroundContext }): boolean {
  return context.isSandbox;
}
