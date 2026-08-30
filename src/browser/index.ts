import { Lexer } from "../lexer/index.ts";
import { ExpressionParser } from "../expression/index.ts";
import { JsonNavigator } from "../navigator/json/index.ts";
import {
  evaluateAndFormatExpression,
  evaluateExpression,
  formatResult,
  processContent,
  processData,
} from "../executor.ts";
import { detectFormat } from "../formats/detect.ts";
import { parseInputSync } from "../formats/sync.ts";
import { parseYAML } from "../formats/yaml/index.ts";
import { parseCSV } from "../formats/csv.ts";
import { parseTOML } from "../formats/toml.ts";
import {
  escapeRegExp,
  expandShortcuts,
  shortenExpression,
} from "../shortcuts/index.ts";
import type { CliOptions } from "../types.ts";

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

export function processInput(input: string, options: CliOptions = {}): string {
  return processContent(input, options);
}

export function evaluate(data: unknown, expression: string, options: CliOptions = {}): unknown {
  return evaluateExpression(expression, data, options);
}
