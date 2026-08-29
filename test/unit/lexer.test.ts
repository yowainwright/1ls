import { test } from "node:test";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { Lexer } from "../../src/lexer/index.ts";
import { TokenType } from "../../src/types.ts";

test("Lexer: simple property access", () => {
  const lexer = new Lexer(".name");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 3);
  assert.strictEqual(tokens[0].type, TokenType.DOT);
  assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
  assert.strictEqual(tokens[1].value, "name");
  assert.strictEqual(tokens[2].type, TokenType.EOF);
});

test("Lexer: nested property access", () => {
  const lexer = new Lexer(".user.email");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 5);
  assert.strictEqual(tokens[0].type, TokenType.DOT);
  assert.strictEqual(tokens[1].value, "user");
  assert.strictEqual(tokens[2].type, TokenType.DOT);
  assert.strictEqual(tokens[3].value, "email");
});

test("Lexer: array index access", () => {
  const lexer = new Lexer(".users[0]");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 6);
  assert.strictEqual(tokens[2].type, TokenType.LEFT_BRACKET);
  assert.strictEqual(tokens[3].type, TokenType.NUMBER);
  assert.strictEqual(tokens[3].value, "0");
  assert.strictEqual(tokens[4].type, TokenType.RIGHT_BRACKET);
});

test("Lexer: array slice", () => {
  const lexer = new Lexer("[0:5]");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 6);
  assert.strictEqual(tokens[0].type, TokenType.LEFT_BRACKET);
  assert.strictEqual(tokens[1].type, TokenType.NUMBER);
  assert.strictEqual(tokens[2].type, TokenType.COLON);
  assert.strictEqual(tokens[3].type, TokenType.NUMBER);
  assert.strictEqual(tokens[4].type, TokenType.RIGHT_BRACKET);
});

test("Lexer: method call", () => {
  const lexer = new Lexer(".map(x => x * 2)");
  const tokens = lexer.tokenize();

  assert.ok(tokens.some((item: unknown) => isDeepStrictEqual(item, { type: TokenType.DOT, value: ".", position: 0 })));
  assert.ok(tokens.some((item: unknown) => isDeepStrictEqual(item, { type: TokenType.IDENTIFIER, value: "map", position: 1 })));
  assert.ok(tokens.some((item: unknown) => isDeepStrictEqual(item, { type: TokenType.LEFT_PAREN, value: "(", position: 4 })));
  assert.ok(tokens.some((item: unknown) => isDeepStrictEqual(item, { type: TokenType.ARROW, value: "=>", position: 7 })));
});

test("Lexer: object operation", () => {
  const lexer = new Lexer(".{keys}");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 5);
  assert.strictEqual(tokens[0].type, TokenType.DOT);
  assert.strictEqual(tokens[1].type, TokenType.LEFT_BRACE);
  assert.strictEqual(tokens[2].value, "keys");
  assert.strictEqual(tokens[3].type, TokenType.RIGHT_BRACE);
});

test("Lexer: string literal", () => {
  const lexer = new Lexer('["complex-key"]');
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 4);
  assert.strictEqual(tokens[1].type, TokenType.STRING);
  assert.strictEqual(tokens[1].value, "complex-key");
});

test("Lexer: recursive descent operator (..)", () => {
  const lexer = new Lexer("..");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 2);
  assert.strictEqual(tokens[0].type, TokenType.DOUBLE_DOT);
  assert.strictEqual(tokens[0].value, "..");
  assert.strictEqual(tokens[1].type, TokenType.EOF);
});

test("Lexer: recursive descent with property access", () => {
  const lexer = new Lexer("..name");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 3);
  assert.strictEqual(tokens[0].type, TokenType.DOUBLE_DOT);
  assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
  assert.strictEqual(tokens[1].value, "name");
});

test("Lexer: optional access operator (?)", () => {
  const lexer = new Lexer(".foo?");
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 4);
  assert.strictEqual(tokens[0].type, TokenType.DOT);
  assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
  assert.strictEqual(tokens[2].type, TokenType.QUESTION);
  assert.strictEqual(tokens[2].value, "?");
});

test("Lexer: null coalescing operator (??)", () => {
  const lexer = new Lexer('.foo ?? "default"');
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 5);
  assert.strictEqual(tokens[0].type, TokenType.DOT);
  assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
  assert.strictEqual(tokens[2].type, TokenType.DOUBLE_QUESTION);
  assert.strictEqual(tokens[2].value, "??");
  assert.strictEqual(tokens[3].type, TokenType.STRING);
});

test("Lexer: combined optional and null coalescing", () => {
  const lexer = new Lexer('.foo? ?? "default"');
  const tokens = lexer.tokenize();

  assert.strictEqual(tokens.length, 6);
  assert.strictEqual(tokens[2].type, TokenType.QUESTION);
  assert.strictEqual(tokens[3].type, TokenType.DOUBLE_QUESTION);
});
