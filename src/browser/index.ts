import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import {
  evaluateAndFormatExpression,
  evaluateExpression,
  formatResult,
  processData,
} from "../executor";
import { detectFormat } from "../formats/detect";
import { parseInputSync } from "../formats/sync";
import { parseYAML } from "../formats/yaml";
import { parseCSV } from "../formats/csv";
import { parseTOML } from "../formats/toml";
import {
  escapeRegExp,
  expandShortcuts,
  shortenExpression,
} from "../shortcuts";
import type { DataFormat } from "../formats/types";
import type { CliOptions } from "../types";

export { Lexer, ExpressionParser, JsonNavigator };
export { parseYAML, parseCSV, parseTOML };
export { escapeRegExp, expandShortcuts, shortenExpression };
export {
  detectFormat,
  evaluateAndFormatExpression,
  evaluateExpression,
  formatResult,
  parseInputSync,
  processData,
};

export function parseInput(input: string, format?: DataFormat): unknown {
  return parseInputSync(input, format);
}

export function processInput(input: string, options: CliOptions = {}): string {
  const data = parseInputSync(input, options.inputFormat);
  return processData(data, options);
}

export function evaluate(data: unknown, expression: string, options: CliOptions = {}): unknown {
  return evaluateExpression(expression, data, options);
}
