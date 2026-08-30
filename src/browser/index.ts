import { Lexer } from "../lexer/index";
import { ExpressionParser } from "../expression/index";
import { JsonNavigator } from "../navigator/json/index";
import {
  evaluateAndFormatExpression,
  evaluateExpression,
  formatResult,
  processContent,
  processData,
} from "../executor";
import { detectFormat } from "../formats/detect";
import { parseInputSync } from "../formats/sync";
import { parseYAML } from "../formats/yaml/index";
import { parseCSV } from "../formats/csv";
import { parseTOML } from "../formats/toml";
import {
  escapeRegExp,
  expandShortcuts,
  shortenExpression,
} from "../shortcuts/index";
import type { RuntimeOptions } from "../types";

export { Lexer, ExpressionParser, JsonNavigator };
export { parseYAML, parseCSV, parseTOML };
export { escapeRegExp, expandShortcuts, shortenExpression };
export {
  detectFormat,
  evaluateAndFormatExpression,
  evaluateExpression,
  formatResult,
  parseInputSync,
  parseInputSync as parseInput,
  processContent,
  processData,
};

export function processInput(input: string, options: RuntimeOptions = {}): string {
  return processContent(input, options);
}

export function evaluate(data: unknown, expression: string, options: RuntimeOptions = {}): unknown {
  return evaluateExpression(expression, data, options);
}
