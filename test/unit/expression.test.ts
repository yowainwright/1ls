import { test, expect } from 'bun:test';
import { Lexer } from '../../src/lexer';
import { ExpressionParser } from '../../src/expression';

test('Expression: simple property access', () => {
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.type).toBe('Root');
  expect(ast.expression?.type).toBe('PropertyAccess');
  expect((ast.expression as any).property).toBe('name');
});

test('Expression: nested property access', () => {
  const lexer = new Lexer('.user.email');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('PropertyAccess');
  expect((ast.expression as any).property).toBe('email');
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
  expect((ast.expression as any).object?.property).toBe('user');
});

test('Expression: array index', () => {
  const lexer = new Lexer('.users[0]');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('IndexAccess');
  expect((ast.expression as any).index).toBe(0);
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
});

test('Expression: array slice', () => {
  const lexer = new Lexer('[0:5]');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('SliceAccess');
  expect((ast.expression as any).start).toBe(0);
  expect((ast.expression as any).end).toBe(5);
});

test('Expression: array spread', () => {
  const lexer = new Lexer('.users[]');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('ArraySpread');
  expect((ast.expression as any).object?.type).toBe('PropertyAccess');
});

test('Expression: object operation', () => {
  const lexer = new Lexer('.obj.{keys}');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('ObjectOperation');
  expect((ast.expression as any).operation).toBe('keys');
});

test('Expression: method call with arrow function', () => {
  const lexer = new Lexer('.map(x => x * 2)');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('MethodCall');
  expect((ast.expression as any).method).toBe('map');
  expect((ast.expression as any).args).toHaveLength(1);
  expect((ast.expression as any).args[0].type).toBe('ArrowFunction');
});

test('Expression: method call inside arrow function body', () => {
  const lexer = new Lexer(".filter(l => l.includes('KILL'))");
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('MethodCall');
  expect((ast.expression as any).method).toBe('filter');

  const arrowFn = (ast.expression as any).args[0];
  expect(arrowFn.type).toBe('ArrowFunction');
  expect(arrowFn.params).toEqual(['l']);

  const body = arrowFn.body;
  expect(body.type).toBe('MethodCall');
  expect(body.method).toBe('includes');
  expect(body.args).toHaveLength(1);
  expect(body.args[0].type).toBe('Literal');
  expect(body.args[0].value).toBe('KILL');

  expect(body.object.type).toBe('PropertyAccess');
  expect(body.object.property).toBe('l');
});

test('Expression: chained method calls inside arrow function', () => {
  const lexer = new Lexer('.map(s => s.trim().toLowerCase())');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();

  expect(ast.expression?.type).toBe('MethodCall');
  expect((ast.expression as any).method).toBe('map');

  const arrowFn = (ast.expression as any).args[0];
  expect(arrowFn.type).toBe('ArrowFunction');

  const body = arrowFn.body;
  expect(body.type).toBe('MethodCall');
  expect(body.method).toBe('toLowerCase');

  expect(body.object.type).toBe('MethodCall');
  expect(body.object.method).toBe('trim');
});