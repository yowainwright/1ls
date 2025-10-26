import { test, expect } from 'bun:test';
import { Lexer } from '../../src/lexer';
import { Parser } from '../../src/parser';
import { JsonNavigator } from '../../src/navigator/json';

function evaluate(expression: string, data: any): any {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator();
  return navigator.evaluate(ast, data);
}

test('Navigator: simple property access', () => {
  const data = { name: 'John', age: 30 };
  expect(evaluate('.name', data)).toBe('John');
  expect(evaluate('.age', data)).toBe(30);
});

test('Navigator: nested property access', () => {
  const data = { user: { name: 'John', email: 'john@example.com' } };
  expect(evaluate('.user.name', data)).toBe('John');
  expect(evaluate('.user.email', data)).toBe('john@example.com');
});

test('Navigator: array index access', () => {
  const data = { users: ['Alice', 'Bob', 'Charlie'] };
  expect(evaluate('.users[0]', data)).toBe('Alice');
  expect(evaluate('.users[1]', data)).toBe('Bob');
  expect(evaluate('.users[-1]', data)).toBe('Charlie');
});

test('Navigator: array slice', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('[0:3]', data)).toEqual([1, 2, 3]);
  expect(evaluate('[2:]', data)).toEqual([3, 4, 5]);
  expect(evaluate('[:3]', data)).toEqual([1, 2, 3]);
});

test('Navigator: array spread', () => {
  const data = { items: [1, 2, 3] };
  expect(evaluate('.items[]', data)).toEqual([1, 2, 3]);
});

test('Navigator: object operations', () => {
  const data = { a: 1, b: 2, c: 3 };
  expect(evaluate('.{keys}', data)).toEqual(['a', 'b', 'c']);
  expect(evaluate('.{values}', data)).toEqual([1, 2, 3]);
  expect(evaluate('.{entries}', data)).toEqual([['a', 1], ['b', 2], ['c', 3]]);
  expect(evaluate('.{length}', data)).toBe(3);
});

test('Navigator: array map', () => {
  const data = [1, 2, 3];
  expect(evaluate('.map(x => x * 2)', data)).toEqual([2, 4, 6]);
});

test('Navigator: array filter', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.filter(x => x > 2)', data)).toEqual([3, 4, 5]);
});

test('Navigator: method chaining', () => {
  const data = { users: [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
  ]};
  expect(evaluate('.users.map(u => u.name)', data)).toEqual(['Alice', 'Bob', 'Charlie']);
  expect(evaluate('.users.filter(u => u.age > 25)', data)).toEqual([
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
  ]);
});

test('Navigator: string methods', () => {
  const data = { name: 'John Doe' };
  expect(evaluate('.name.toLowerCase()', data)).toBe('john doe');
  expect(evaluate('.name.toUpperCase()', data)).toBe('JOHN DOE');
  expect(evaluate('.name.includes("John")', data)).toBe(true);
  expect(evaluate('.name.includes("Jane")', data)).toBe(false);
});