import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import { expandShortcuts } from "../shortcuts";
import { ALL_SUGGESTIONS, MAX_SUGGESTIONS } from "./constants";
import { detectDataType, extractPartialMethod, fuzzySearch, getSuggestionsForType } from "./utils";
import type { CompletionOptions, CompletionResult, Suggestion } from "./types";

export * from "./constants";
export * from "./types";
export { detectDataType, extractPartialMethod, fuzzySearch, getSuggestionsForType };

const EMPTY_RESULT: CompletionResult = {
  suggestions: [],
  prefix: "",
  startIndex: 0,
};

const ROOT_EXPRESSION = ".";
const IDENTIFIER_PATTERN = /^[a-zA-Z_$][\w$]*$/;

const escapePropertyKey = (key: string): string =>
  key.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const toPathInsertText = (key: string, isRoot: boolean): string => {
  if (IDENTIFIER_PATTERN.test(key)) {
    return `.${key}`;
  }

  const escapedKey = escapePropertyKey(key);
  return isRoot ? `.["${escapedKey}"]` : `["${escapedKey}"]`;
};

const describeValue = (value: unknown): string => {
  const dataType = detectDataType(value);
  if (dataType === "Array") return "Array";

  return `${dataType} property`;
};

const buildPropertySuggestions = (value: unknown, isRoot: boolean): Suggestion[] => {
  const isObjectLike = value !== null && typeof value === "object" && !Array.isArray(value);
  if (!isObjectLike) return [];

  return Object.entries(value as Record<string, unknown>).map(([key, childValue]) => {
    const insertText = toPathInsertText(key, isRoot);

    return {
      name: key,
      signature: insertText,
      description: describeValue(childValue),
      type: "path" as const,
      insertText,
    };
  });
};

const evaluateExpression = (expression: string, data: unknown): unknown => {
  const usesRootData = expression.length === 0 || expression === ROOT_EXPRESSION;
  if (usesRootData) return data;

  const lexer = new Lexer(expandShortcuts(expression));
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: false });

  return navigator.evaluate(ast, data);
};

const getContextExpression = (expression: string): string => {
  const lastDotIndex = expression.lastIndexOf(".");
  if (lastDotIndex <= 0) return ROOT_EXPRESSION;

  return expression.slice(0, lastDotIndex);
};

const buildFallbackSuggestions = (prefix: string): Suggestion[] =>
  fuzzySearch(ALL_SUGGESTIONS, prefix, (suggestion) => suggestion.name)
    .slice(0, MAX_SUGGESTIONS)
    .map((match) => match.item);

const buildContextualSuggestions = (
  prefix: string,
  expression: string,
  data: unknown,
): Suggestion[] => {
  try {
    const contextExpression = getContextExpression(expression);
    const contextValue = evaluateExpression(contextExpression, data);
    if (contextValue === undefined) return buildFallbackSuggestions(prefix);

    const dataType = detectDataType(contextValue);
    const isRoot = contextExpression === ROOT_EXPRESSION;
    const properties = buildPropertySuggestions(contextValue, isRoot);
    const methods = getSuggestionsForType(dataType);
    const suggestions = properties.concat(methods);

    return fuzzySearch(suggestions, prefix, (suggestion) => suggestion.name)
      .slice(0, MAX_SUGGESTIONS)
      .map((match) => match.item);
  } catch {
    return buildFallbackSuggestions(prefix);
  }
};

export const complete = (input: string, options: CompletionOptions = {}): CompletionResult => {
  const source = options.expression ?? input;
  const partial = extractPartialMethod(source);
  if (partial === null) return EMPTY_RESULT;

  const hasDataContext = Object.hasOwn(options, "data");
  const suggestions = hasDataContext
    ? buildContextualSuggestions(partial.prefix, source, options.data)
    : buildFallbackSuggestions(partial.prefix);

  return {
    suggestions,
    prefix: partial.prefix,
    startIndex: partial.startIndex,
  };
};
