import { test, expect } from 'bun:test';
import { Lexer } from '../../src/lexer';
import { TokenType } from '../../src/types';

test('Lexer: simple property access', () => {
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(3);
  expect(tokens[0].type).toBe(TokenType.DOT);
  expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[1].value).toBe('name');
  expect(tokens[2].type).toBe(TokenType.EOF);
});

test('Lexer: nested property access', () => {
  const lexer = new Lexer('.user.email');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(5);
  expect(tokens[0].type).toBe(TokenType.DOT);
  expect(tokens[1].value).toBe('user');
  expect(tokens[2].type).toBe(TokenType.DOT);
  expect(tokens[3].value).toBe('email');
});

test('Lexer: array index access', () => {
  const lexer = new Lexer('.users[0]');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(6);
  expect(tokens[2].type).toBe(TokenType.LEFT_BRACKET);
  expect(tokens[3].type).toBe(TokenType.NUMBER);
  expect(tokens[3].value).toBe('0');
  expect(tokens[4].type).toBe(TokenType.RIGHT_BRACKET);
});

test('Lexer: array slice', () => {
  const lexer = new Lexer('[0:5]');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(6);
  expect(tokens[0].type).toBe(TokenType.LEFT_BRACKET);
  expect(tokens[1].type).toBe(TokenType.NUMBER);
  expect(tokens[2].type).toBe(TokenType.COLON);
  expect(tokens[3].type).toBe(TokenType.NUMBER);
  expect(tokens[4].type).toBe(TokenType.RIGHT_BRACKET);
});

test('Lexer: method call', () => {
  const lexer = new Lexer('.map(x => x * 2)');
  const tokens = lexer.tokenize();

  expect(tokens).toContainEqual({ type: TokenType.DOT, value: '.', position: 0 });
  expect(tokens).toContainEqual({ type: TokenType.IDENTIFIER, value: 'map', position: 1 });
  expect(tokens).toContainEqual({ type: TokenType.LEFT_PAREN, value: '(', position: 4 });
  expect(tokens).toContainEqual({ type: TokenType.ARROW, value: '=>', position: 7 });
});

test('Lexer: object operation', () => {
  const lexer = new Lexer('.{keys}');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(5);
  expect(tokens[0].type).toBe(TokenType.DOT);
  expect(tokens[1].type).toBe(TokenType.LEFT_BRACE);
  expect(tokens[2].value).toBe('keys');
  expect(tokens[3].type).toBe(TokenType.RIGHT_BRACE);
});

test('Lexer: string literal', () => {
  const lexer = new Lexer('["complex-key"]');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(4);
  expect(tokens[1].type).toBe(TokenType.STRING);
  expect(tokens[1].value).toBe('complex-key');
});

test('Lexer: recursive descent operator (..)', () => {
  const lexer = new Lexer('..');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(2);
  expect(tokens[0].type).toBe(TokenType.DOUBLE_DOT);
  expect(tokens[0].value).toBe('..');
  expect(tokens[1].type).toBe(TokenType.EOF);
});

test('Lexer: recursive descent with property access', () => {
  const lexer = new Lexer('..name');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(3);
  expect(tokens[0].type).toBe(TokenType.DOUBLE_DOT);
  expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[1].value).toBe('name');
});

test('Lexer: optional access operator (?)', () => {
  const lexer = new Lexer('.foo?');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(4);
  expect(tokens[0].type).toBe(TokenType.DOT);
  expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[2].type).toBe(TokenType.QUESTION);
  expect(tokens[2].value).toBe('?');
});

test('Lexer: null coalescing operator (??)', () => {
  const lexer = new Lexer('.foo ?? "default"');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(5);
  expect(tokens[0].type).toBe(TokenType.DOT);
  expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[2].type).toBe(TokenType.DOUBLE_QUESTION);
  expect(tokens[2].value).toBe('??');
  expect(tokens[3].type).toBe(TokenType.STRING);
});

test('Lexer: combined optional and null coalescing', () => {
  const lexer = new Lexer('.foo? ?? "default"');
  const tokens = lexer.tokenize();

  expect(tokens).toHaveLength(6);
  expect(tokens[2].type).toBe(TokenType.QUESTION);
  expect(tokens[3].type).toBe(TokenType.DOUBLE_QUESTION);
});