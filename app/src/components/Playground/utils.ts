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

const parseTrimmedInput = (input: string, format: Format): unknown => {
  if (format === "json") return JSON.parse(input);
  if (format === "yaml") return parseYAML(input);
  if (format === "csv") return parseCSV(input);
  if (format === "toml") return parseTOML(input);
  if (format === "text") return input.split("\n");
  return JSON.parse(input);
};

const parseInput = (input: string, format: Format): Effect.Effect<unknown, ParseError> =>
  Effect.try({
    try: () => parseTrimmedInput(input, format),
    catch: (cause) => new ParseError({ cause }),
  });

const hasEvaluationInput = (input: string, expression: string): boolean => {
  const hasInput = Boolean(input.trim());
  const hasExpression = Boolean(expression.trim());
  return hasInput && hasExpression;
};

const formatOutput = (result: unknown): string => JSON.stringify(result, null, 2) ?? String(result);

const toEvaluationError = (cause: unknown): EvaluationResult => {
  const message = cause instanceof Error ? cause.message : String(cause);
  return { output: "", error: message.slice(0, MAX_ERROR_LENGTH) };
};

export function runEvaluation(
  input: string,
  expression: string,
  format: Format,
): Effect.Effect<EvaluationResult> {
  if (!hasEvaluationInput(input, expression)) return Effect.succeed({ output: "", error: null });

  return Effect.gen(function* () {
    const parsedInput = yield* parseInput(input.trim(), format);
    const result = yield* Effect.try({
      try: () => evaluate(parsedInput, expression),
      catch: (cause) => new EvaluationError({ cause }),
    });
    const output = formatOutput(result);
    if (output.length > MAX_OUTPUT_LENGTH) {
      return { output: "", error: "Output too large to display" } satisfies EvaluationResult;
    }
    return { output, error: null } satisfies EvaluationResult;
  }).pipe(
    Effect.catchAll((error) => Effect.succeed<EvaluationResult>(toEvaluationError(error.cause))),
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
  if (isValidJSON(content)) {
    return { format: "json", confidence: 1.0, reason: "Valid JSON structure" };
  }
  return null;
};

export const detectTOML: FormatDetector = (content) => {
  const hasSections = /^\[[^\]]+\]/m.test(content);
  const hasAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(content);
  const hasTomlShape = hasSections && hasAssignment;
  if (!hasTomlShape) return null;
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

  const rootLines = content
    .split("\n")
    .filter((line) => line.trim())
    .filter((line) => {
      const hasLeadingSpace = line.startsWith(" ");
      const hasLeadingTab = line.startsWith("\t");
      if (hasLeadingSpace) return false;
      if (hasLeadingTab) return false;
      return true;
    });
  const rootKeys = rootLines
    .map((line) => line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/)?.[1])
    .filter(Boolean);
  const uniqueRootKeys = new Set(rootKeys);
  const hasDuplicateRootKeys = rootKeys.length > uniqueRootKeys.size;
  const hasNestedYaml = hasNestedIndent && hasKeyValue;
  const hasMultipleRootKeys = uniqueRootKeys.size > 1;
  const hasRootKeyValues = hasKeyValue && lineCount > 1 && hasMultipleRootKeys;

  if (hasDuplicateRootKeys) return null;
  if (hasListItems) return { format: "yaml", confidence: 0.9, reason: "YAML list items detected" };
  if (hasNestedYaml) {
    return { format: "yaml", confidence: 0.85, reason: "YAML nested structure detected" };
  }
  if (hasRootKeyValues) {
    return { format: "yaml", confidence: 0.8, reason: "YAML key-value pairs detected" };
  }

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

  const results = DETECTORS.map((detect) => detect(trimmed));
  const firstMatch = results.find((result) => result !== null);
  return firstMatch ?? TEXT_FALLBACK;
}

export { shortenExpression as minifyExpression, expandShortcuts as expandExpression };

// --- Machine actors, actions, guards ---

export type InitialState = Pick<PlaygroundContext, "format" | "input" | "expression"> | null;

export function loadInitialStateActor({
  input: { isSandbox },
}: {
  input: { isSandbox: boolean };
}): Promise<InitialState> {
  if (!isSandbox) return Promise.resolve(null);
  const urlState = getStateFromUrl();
  if (urlState) return Promise.resolve(urlState);
  return Effect.runPromise(loadState());
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
  if (context.isSandbox) return { format, input: starter.data, expression: starter.expression };
  const config = FORMAT_CONFIGS[format];
  const expression = config.suggestions[0]?.expression ?? ".";
  return { format, input: config.placeholder, expression };
}

export function isSandboxGuard({ context }: { context: PlaygroundContext }): boolean {
  return context.isSandbox;
}
