import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  expandShortcuts,
  shortenExpression,
  escapeRegExp,
  Lexer,
  ExpressionParser,
  JsonNavigator,
  parseYAML,
  parseCSV,
  parseTOML,
  detectFormat,
  parseInput,
  processContent,
  processInput,
} from "../../src/browser/index.ts";

test("browser evaluate works with data and expression", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(data, ".map(x => x * 2)"), [2, 4, 6]);
});

test("browser evaluate expands shortcuts", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(data, ".mp(x => x * 2)"), [2, 4, 6]);
});

test("browser expandShortcuts expands method shortcuts", () => {
  assert.strictEqual(expandShortcuts(".mp(x => x)"), ".map(x => x)");
  assert.strictEqual(expandShortcuts(".flt(x => x)"), ".filter(x => x)");
});

test("browser expandShortcuts preserves string literals", () => {
  assert.strictEqual(expandShortcuts('.filter(x => x.name === ".mp")'), '.filter(x => x.name === ".mp")',);
});

test("browser shortenExpression shortens methods", () => {
  assert.strictEqual(shortenExpression(".map(x => x)"), ".mp(x => x)");
  assert.strictEqual(shortenExpression(".filter(x => x)"), ".flt(x => x)");
});

test("browser escapeRegExp escapes special characters", () => {
  assert.strictEqual(escapeRegExp("a.b"), "a\\.b");
  assert.strictEqual(escapeRegExp("a[b]"), "a\\[b\\]");
  assert.strictEqual(escapeRegExp("a*b"), "a\\*b");
});

test("browser exports Lexer", () => {
  const lexer = new Lexer(".name");
  const tokens = lexer.tokenize();
  assert.ok(tokens.length > 0);
});

test("browser exports ExpressionParser", () => {
  const lexer = new Lexer(".name");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  assert.strictEqual(ast.type, "Root");
});

test("browser exports JsonNavigator", () => {
  const navigator = new JsonNavigator();
  const lexer = new Lexer(".name");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const result = navigator.evaluate(ast, { name: "test" });
  assert.strictEqual(result, "test");
});

test("browser exports parseYAML", () => {
  const result = parseYAML("name: test");
  assert.deepStrictEqual(result, { name: "test" });
});

test("browser exports parseCSV", () => {
  const result = parseCSV("a,b\n1,2");
  assert.deepStrictEqual(result, [{ a: 1, b: 2 }]);
});

test("browser exports parseTOML", () => {
  const result = parseTOML('name = "test"');
  assert.deepStrictEqual(result, { name: "test" });
});

test("browser exports detectFormat", () => {
  assert.strictEqual(detectFormat("name: test"), "yaml");
});

test("browser exports parseInput", () => {
  assert.deepStrictEqual(parseInput("name,age\nAda,30"), [{ name: "Ada", age: 30 }]);
});

test("browser processInput parses, evaluates, and formats input", () => {
  const output = processInput("name,age\nAda,30", {
    expression: ".[0].name",
    raw: true,
  });

  assert.strictEqual(output, "Ada");
});

test("browser exports processContent", () => {
  const output = processContent('{"name":"Ada"}', {
    expression: ".name",
    raw: true,
  });

  assert.strictEqual(output, "Ada");
});

test("browser shortenExpression handles multiple shortcuts", () => {
  const expr = ".map(x => x).filter(y => y).reduce((a, b) => a + b)";
  const shortened = shortenExpression(expr);
  assert.ok(shortened.includes(".mp"));
  assert.ok(shortened.includes(".flt"));
  assert.ok(shortened.includes(".rd"));
});

test("browser evaluate handles property access", () => {
  const data = { user: { name: "Alice" } };
  assert.strictEqual(evaluate(data, ".user.name"), "Alice");
});

test("browser evaluate handles array index", () => {
  const data = [10, 20, 30];
  assert.strictEqual(evaluate(data, "[1]"), 20);
});
