import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import { REGEX_SPECIAL_CHARS, SHORTCUTS } from "./constants";

export { Lexer, ExpressionParser, JsonNavigator };

export function escapeRegExp(str: string): string {
  return str.replace(REGEX_SPECIAL_CHARS, "\\$&");
}

export const EXPAND_PATTERNS = SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`${escapeRegExp(s.short)}(?![a-zA-Z])`, "g"),
    replacement: s.full,
  }))
  .sort((a, b) => b.replacement.length - a.replacement.length);

export function expandShortcuts(expression: string): string {
  return EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    expression,
  );
}

export function evaluate(data: unknown, expression: string): unknown {
  const expanded = expandShortcuts(expression);
  const lexer = new Lexer(expanded);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator();
  return navigator.evaluate(ast, data);
}
