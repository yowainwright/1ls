import { Lexer } from "./lexer";
import { ExpressionParser } from "./expression";
import { JsonNavigator } from "./navigator/json";
import { Formatter } from "./formatter";
import { parseInputSync } from "./formats/sync";
import { expandShortcuts } from "./shortcuts";
import type { CliOptions } from "./types";

type StrictnessOptions = Pick<CliOptions, "strict">;

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
  const navigator = new JsonNavigator({ strict: options.strict });

  return navigator.evaluate(ast, data);
};

export const formatResult = (result: unknown, options: CliOptions): string =>
  new Formatter(options).format(result);

export const evaluateAndFormatExpression = (
  expression: string,
  data: unknown,
  options: CliOptions,
): string => {
  const result = evaluateExpression(expression, data, options);
  return formatResult(result, options);
};

export const processData = (data: unknown, options: CliOptions): string => {
  if (!options.expression) {
    return formatResult(data, options);
  }

  return evaluateAndFormatExpression(options.expression, data, options);
};

export const processContent = (input: string, options: CliOptions = {}): string => {
  const data = parseInputSync(input, options.inputFormat);
  return processData(data, options);
};
