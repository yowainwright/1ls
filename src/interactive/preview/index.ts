import { Lexer } from "../../lexer";
import { ExpressionParser } from "../../expression";
import { JsonNavigator } from "../../navigator/json";
import { expandShortcuts } from "../../shortcuts";
import type { PreviewResult } from "./types";
import { MAX_PREVIEW_CHARS, MAX_ARRAY_ITEMS } from "./constants";

export type { PreviewResult } from "./types";
export { MAX_PREVIEW_LINES, MAX_PREVIEW_CHARS, MAX_ARRAY_ITEMS } from "./constants";

let cachedExpression = "";
let cachedResult: PreviewResult | null = null;

const truncateValue = (value: unknown): { value: unknown; truncated: boolean } => {
  if (Array.isArray(value) && value.length > MAX_ARRAY_ITEMS) {
    return {
      value: value.slice(0, MAX_ARRAY_ITEMS),
      truncated: true,
    };
  }
  return { value, truncated: false };
};

const formatPreviewValue = (value: unknown, truncated: boolean): string => {
  const json = JSON.stringify(value, null, 2);
  const suffix = truncated ? "\n... (truncated)" : "";

  if (json.length > MAX_PREVIEW_CHARS) {
    return json.slice(0, MAX_PREVIEW_CHARS) + "\n... (truncated)";
  }

  return json + suffix;
};

export const evaluatePreview = (
  expression: string,
  data: unknown,
): PreviewResult => {
  if (expression === cachedExpression && cachedResult !== null) {
    return cachedResult;
  }

  try {
    const expanded = expandShortcuts(expression);
    const lexer = new Lexer(expanded);
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();
    const navigator = new JsonNavigator();
    const result = navigator.evaluate(ast, data);

    const { value, truncated } = truncateValue(result);

    const previewResult: PreviewResult = {
      success: true,
      value,
      error: null,
      truncated,
    };

    cachedExpression = expression;
    cachedResult = previewResult;

    return previewResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const previewResult: PreviewResult = {
      success: false,
      value: null,
      error: message,
      truncated: false,
    };

    cachedExpression = expression;
    cachedResult = previewResult;

    return previewResult;
  }
};

export const formatPreview = (result: PreviewResult): string => {
  if (!result.success) {
    return `Error: ${result.error}`;
  }

  return formatPreviewValue(result.value, result.truncated);
};
