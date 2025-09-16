import { test, expect } from 'bun:test';
import { Lexer } from '../src/parser/lexer';
import { Parser } from '../src/parser/parser';

test('Parser: simple property access', () => {
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.type).toBe('Root');
  expect(ast.expression?.type).toBe('PropertyAccess');
  expect((ast.expression as any).property).toBe('name');
});

test('Parser: nested property access', () => {
  const lexer = new Lexer('.user.email');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('PropertyAccess');
  expect((ast.expression as any).property).toBe('email');
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
  expect((ast.expression as any).object?.property).toBe('user');
});

test('Parser: array index', () => {
  const lexer = new Lexer('.users[0]');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('IndexAccess');
  expect((ast.expression as any).index).toBe(0);
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
});

test('Parser: array slice', () => {
  const lexer = new Lexer('[0:5]');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('SliceAccess');
  expect((ast.expression as any).start).toBe(0);
  expect((ast.expression as any).end).toBe(5);
});

test('Parser: array spread', () => {
  const lexer = new Lexer('.users[]');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('ArraySpread');
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
});

test('Parser: object operation', () => {
  const lexer = new Lexer('.obj.{keys}');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('ObjectOperation');
  expect((ast.expression as any).operation).toBe('keys');
});

test('Parser: method call with arrow function', () => {
  const lexer = new Lexer('.map(x => x * 2)');
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('MethodCall');
  expect((ast.expression as any).method).toBe('map');
  expect((ast.expression as any).args).toHaveLength(1);
  expect((ast.expression as any).args[0].type).toBe('ArrowFunction');
});