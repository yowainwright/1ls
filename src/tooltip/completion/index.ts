import type { PartialMethod, CompletionResult, Suggestion } from "../../completion";
import {
  fuzzySearch,
  ALL_SUGGESTIONS,
  MAX_SUGGESTIONS,
  QUOTE_PATTERN,
  DOT_PATTERN,
} from "../../completion";
import { getMethodsForType } from "../../tui/methods";
import type { Method } from "../../tui/methods";
import { expandShortcuts } from "../../shortcuts";
import { Lexer } from "../../lexer";
import { ExpressionParser } from "../../expression";
import { JsonNavigator } from "../../navigator/json";

const EMPTY_RESULT: CompletionResult = {
  suggestions: [],
  prefix: "",
  startIndex: 0,
};

interface CompletionOptions {
  data?: unknown;
  expression?: string;
}

const ROOT_EXPRESSION = ".";
const IDENTIFIER_PATTERN = /^[a-zA-Z_$][\w$]*$/;

const detectDataType = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "Array";

  const type = typeof value;
  if (type === "string") return "String";
  if (type === "number") return "Number";
  if (type === "boolean") return "Boolean";
  if (type === "object") return "Object";

  return "unknown";
};

const normalizeSignature = (signature: string): string =>
  signature.startsWith(".") ? signature : `.${signature}`;

const getMethodInsertText = (method: Method): string =>
  method.template || normalizeSignature(method.signature);

const toMethodSuggestion = (method: Method): Suggestion => ({
  name: method.name,
  signature: normalizeSignature(method.signature),
  description: method.description,
  type: method.isBuiltin ? "builtin" : "method",
  insertText: getMethodInsertText(method),
});

const escapePropertyKey = (key: string): string =>
  key.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const toPathInsertText = (key: string, isRoot: boolean): string => {
  const isIdentifier = IDENTIFIER_PATTERN.test(key);
  if (isIdentifier) {
    return `.${key}`;
  }

  const escapedKey = escapePropertyKey(key);
  return isRoot ? `.["${escapedKey}"]` : `["${escapedKey}"]`;
};

const describeValue = (value: unknown): string => {
  const dataType = detectDataType(value);
  return dataType === "Array" ? "Array" : `${dataType} property`;
};

const buildPropertySuggestions = (value: unknown, isRoot: boolean): Suggestion[] => {
  const isObjectLike =
    value !== null && typeof value === "object" && !Array.isArray(value);
  if (!isObjectLike) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).map(([key, childValue]) => ({
    name: key,
    signature: toPathInsertText(key, isRoot),
    description: describeValue(childValue),
    type: "path" as const,
    insertText: toPathInsertText(key, isRoot),
  }));
};

const evaluateExpression = (expression: string, data: unknown): unknown => {
  if (!expression || expression === ROOT_EXPRESSION) {
    return data;
  }

  const expandedExpression = expandShortcuts(expression);
  const lexer = new Lexer(expandedExpression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: false });

  return navigator.evaluate(ast, data);
};

const getContextExpression = (expression: string): string => {
  const lastDotIndex = expression.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return ROOT_EXPRESSION;
  }

  return expression.slice(0, lastDotIndex);
};

const buildContextualSuggestions = (prefix: string, expression: string, data: unknown): Suggestion[] => {
  try {
    const contextExpression = getContextExpression(expression);
    const contextValue = evaluateExpression(contextExpression, data);
    if (contextValue === undefined) {
      return buildFallbackSuggestions(prefix);
    }

    const dataType = detectDataType(contextValue);
    const isRoot = contextExpression === ROOT_EXPRESSION;

    const propertySuggestions = buildPropertySuggestions(contextValue, isRoot);
    const methodSuggestions = getMethodsForType(dataType).map(toMethodSuggestion);
    const suggestions = propertySuggestions.concat(methodSuggestions);

    return fuzzySearch(suggestions, prefix, (suggestion) => suggestion.name)
      .slice(0, MAX_SUGGESTIONS)
      .map((match) => match.item);
  } catch {
    return buildFallbackSuggestions(prefix);
  }
};

const buildFallbackSuggestions = (prefix: string): Suggestion[] =>
  fuzzySearch(ALL_SUGGESTIONS, prefix, (suggestion) => suggestion.name)
    .slice(0, MAX_SUGGESTIONS)
    .map((match) => match.item);

export const extractPartialMethod = (input: string): PartialMethod | null => {
  const quoteMatch = input.match(QUOTE_PATTERN);
  if (quoteMatch) {
    const afterDot = quoteMatch[2] || "";
    const startIndex = input.length - afterDot.length;
    return { prefix: afterDot, startIndex };
  }

  const dotMatch = input.match(DOT_PATTERN);
  if (dotMatch) {
    const prefix = dotMatch[1] || "";
    const startIndex = input.length - prefix.length;
    return { prefix, startIndex };
  }

  return null;
};

export const complete = (
  input: string,
  options: CompletionOptions = {},
): CompletionResult => {
  const source = options.expression ?? input;
  const partial = extractPartialMethod(source);
  const hasNoPartial = partial === null;
  if (hasNoPartial) {
    return EMPTY_RESULT;
  }

  const { prefix, startIndex } = partial;
  const hasDataContext = Object.prototype.hasOwnProperty.call(options, "data");
  const suggestions = hasDataContext
    ? buildContextualSuggestions(prefix, source, options.data)
    : buildFallbackSuggestions(prefix);

  return { suggestions, prefix, startIndex };
};
