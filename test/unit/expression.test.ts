import { test } from "node:test";
import assert from "node:assert/strict";
import { Lexer } from "../../src/lexer/index";
import { ExpressionParser } from "../../src/expression/index";

test("Expression: identity (pass-through)", () => {
  const lexer = new Lexer(".");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.type, "Root");
  assert.strictEqual(ast.expression?.type, "Root");
});

test("Expression: simple property access", () => {
  const lexer = new Lexer(".name");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.type, "Root");
  assert.strictEqual(ast.expression?.type, "PropertyAccess");
  assert.strictEqual((ast.expression as any).property, "name");
});

test("Expression: rejects trailing tokens", () => {
  const lexer = new Lexer(".name garbage");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);

  assert.throws(() => parser.parse(), /Unexpected token after expression/);
});

test("Expression: nested property access", () => {
  const lexer = new Lexer(".user.email");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "PropertyAccess");
  assert.strictEqual((ast.expression as any).property, "email");
  assert.strictEqual((ast.expression as any).object?.type, "PropertyAccess");
  assert.strictEqual((ast.expression as any).object?.property, "user");
});

test("Expression: array index", () => {
  const lexer = new Lexer(".users[0]");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "IndexAccess");
  assert.strictEqual((ast.expression as any).index, 0);
  assert.strictEqual((ast.expression as any).object?.type, "PropertyAccess");
});

test("Expression: array slice", () => {
  const lexer = new Lexer("[0:5]");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "SliceAccess");
  assert.strictEqual((ast.expression as any).start, 0);
  assert.strictEqual((ast.expression as any).end, 5);
});

test("Expression: array spread", () => {
  const lexer = new Lexer(".users[]");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "ArraySpread");
  assert.strictEqual((ast.expression as any).object?.type, "PropertyAccess");
});

test("Expression: object operation", () => {
  const lexer = new Lexer(".obj.{keys}");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "ObjectOperation");
  assert.strictEqual((ast.expression as any).operation, "keys");
});

test("Expression: method call with arrow function", () => {
  const lexer = new Lexer(".map(x => x * 2)");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "MethodCall");
  assert.strictEqual((ast.expression as any).method, "map");
  assert.strictEqual((ast.expression as any).args.length, 1);
  assert.strictEqual((ast.expression as any).args[0].type, "ArrowFunction");
});

test("Expression: method call inside arrow function body", () => {
  const lexer = new Lexer(".filter(l => l.includes('KILL'))");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "MethodCall");
  assert.strictEqual((ast.expression as any).method, "filter");

  const arrowFn = (ast.expression as any).args[0];
  assert.strictEqual(arrowFn.type, "ArrowFunction");
  assert.deepStrictEqual(arrowFn.params, ["l"]);

  const body = arrowFn.body;
  assert.strictEqual(body.type, "MethodCall");
  assert.strictEqual(body.method, "includes");
  assert.strictEqual(body.args.length, 1);
  assert.strictEqual(body.args[0].type, "Literal");
  assert.strictEqual(body.args[0].value, "KILL");

  assert.strictEqual(body.object.type, "PropertyAccess");
  assert.strictEqual(body.object.property, "l");
});

test("Expression: chained method calls inside arrow function", () => {
  const lexer = new Lexer(".map(s => s.trim().toLowerCase())");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.expression?.type, "MethodCall");
  assert.strictEqual((ast.expression as any).method, "map");

  const arrowFn = (ast.expression as any).args[0];
  assert.strictEqual(arrowFn.type, "ArrowFunction");

  const body = arrowFn.body;
  assert.strictEqual(body.type, "MethodCall");
  assert.strictEqual(body.method, "toLowerCase");

  assert.strictEqual(body.object.type, "MethodCall");
  assert.strictEqual(body.object.method, "trim");
});
