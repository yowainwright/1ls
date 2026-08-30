import { Lexer } from "./lexer/index";
import { ExpressionParser } from "./expression/index";
import { JsonNavigator } from "./navigator/json/index";
import { Formatter } from "./fmt";
import { parseInputSync } from "./formats/sync";
import { expandShortcuts } from "./shortcuts/index";
import type { RuntimeOptions } from "./types";

type StrictnessOptions = Pick<RuntimeOptions, "strict">;

const isStrictMode = (options: StrictnessOptions): boolean => {
  if (!("strict" in options)) return false;
  return Boolean(options.strict);
};

const getExpression = (options: RuntimeOptions): string | undefined => {
  if (!("expression" in options)) return undefined;
  return options.expression;
};

export const evaluateExpression = (
  expression: string,
  data: unknown,
  options: StrictnessOptions = {},
): unknown => {
  const expandedExpression = expandShortcuts(expression);
  const lexer = new Lexer(expandedExpression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: isStrictMode(options) });

  return navigator.evaluate(ast, data);
};

export const formatResult = (result: unknown, options: RuntimeOptions): string =>
  new Formatter(options).format(result);

export const evaluateAndFormatExpression = (
  expression: string,
  data: unknown,
  options: RuntimeOptions,
): string => {
  const result = evaluateExpression(expression, data, options);
  return formatResult(result, options);
};

export const processData = (data: unknown, options: RuntimeOptions): string => {
  const expression = getExpression(options);

  if (!expression) {
    return formatResult(data, options);
  }

  return evaluateAndFormatExpression(expression, data, options);
};

export const processContent = (input: string, options: RuntimeOptions = {}): string => {
  const data = parseInputSync(input, options.inputFormat);
  return processData(data, options);
};
