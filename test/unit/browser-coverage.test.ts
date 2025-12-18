import { test, expect } from 'bun:test';
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
  parseTOML
} from '../../src/browser';

test('browser evaluate works with data and expression', () => {
  const data = [1, 2, 3];
  expect(evaluate(data, '.map(x => x * 2)')).toEqual([2, 4, 6]);
});

test('browser evaluate expands shortcuts', () => {
  const data = [1, 2, 3];
  expect(evaluate(data, '.mp(x => x * 2)')).toEqual([2, 4, 6]);
});

test('browser expandShortcuts expands method shortcuts', () => {
  expect(expandShortcuts('.mp(x => x)')).toBe('.map(x => x)');
  expect(expandShortcuts('.flt(x => x)')).toBe('.filter(x => x)');
});

test('browser shortenExpression shortens methods', () => {
  expect(shortenExpression('.map(x => x)')).toBe('.mp(x => x)');
  expect(shortenExpression('.filter(x => x)')).toBe('.flt(x => x)');
});

test('browser escapeRegExp escapes special characters', () => {
  expect(escapeRegExp('a.b')).toBe('a\\.b');
  expect(escapeRegExp('a[b]')).toBe('a\\[b\\]');
  expect(escapeRegExp('a*b')).toBe('a\\*b');
});

test('browser exports Lexer', () => {
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();
  expect(tokens.length).toBeGreaterThan(0);
});

test('browser exports ExpressionParser', () => {
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  expect(ast.type).toBe('Root');
});

test('browser exports JsonNavigator', () => {
  const navigator = new JsonNavigator();
  const lexer = new Lexer('.name');
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const result = navigator.evaluate(ast, { name: 'test' });
  expect(result).toBe('test');
});

test('browser exports parseYAML', () => {
  const result = parseYAML('name: test');
  expect(result).toEqual({ name: 'test' });
});

test('browser exports parseCSV', () => {
  const result = parseCSV('a,b\n1,2');
  expect(result).toEqual([{ a: 1, b: 2 }]);
});

test('browser exports parseTOML', () => {
  const result = parseTOML('name = "test"');
  expect(result).toEqual({ name: 'test' });
});

test('browser shortenExpression handles multiple shortcuts', () => {
  const expr = '.map(x => x).filter(y => y).reduce((a, b) => a + b)';
  const shortened = shortenExpression(expr);
  expect(shortened).toContain('.mp');
  expect(shortened).toContain('.flt');
  expect(shortened).toContain('.rd');
});

test('browser evaluate handles property access', () => {
  const data = { user: { name: 'Alice' } };
  expect(evaluate(data, '.user.name')).toBe('Alice');
});

test('browser evaluate handles array index', () => {
  const data = [10, 20, 30];
  expect(evaluate(data, '[1]')).toBe(20);
});
