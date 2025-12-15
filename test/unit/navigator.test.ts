import { test, expect } from 'bun:test';
import { Lexer } from '../../src/lexer';
import { ExpressionParser } from '../../src/expression';
import { JsonNavigator } from '../../src/navigator/json';

function evaluate(expression: string, data: unknown): unknown {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
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

test('Navigator: arithmetic operators', () => {
  const data = [10, 20, 30];
  expect(evaluate('.map(x => x + 5)', data)).toEqual([15, 25, 35]);
  expect(evaluate('.map(x => x * 2)', data)).toEqual([20, 40, 60]);
});

test('Navigator: comparison operators', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.filter(x => x > 2)', data)).toEqual([3, 4, 5]);
  expect(evaluate('.filter(x => x >= 3)', data)).toEqual([3, 4, 5]);
});

test('Navigator: object operation on arrays', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.{length}', data)).toBe(5);
});

test('Navigator: method calls inside arrow functions', () => {
  const lines = [
    'PLAYER_JOINED: Alice entered the game',
    'KILL: Bob eliminated by Alice',
    'CHAT: Alice: "nice shot!"',
    'KILL: Charlie eliminated by Bob',
  ];
  expect(evaluate(".filter(l => l.includes('KILL'))", lines)).toEqual([
    'KILL: Bob eliminated by Alice',
    'KILL: Charlie eliminated by Bob',
  ]);
  expect(evaluate(".filter(l => l.includes('CHAT'))", lines)).toEqual([
    'CHAT: Alice: "nice shot!"',
  ]);
  expect(evaluate(".filter(l => l.includes('PLAYER_JOINED'))", lines)).toEqual([
    'PLAYER_JOINED: Alice entered the game',
  ]);
});

test('Navigator: chained method calls inside arrow functions', () => {
  const data = ['  hello  ', '  WORLD  ', '  Test  '];
  expect(evaluate('.map(s => s.trim())', data)).toEqual(['hello', 'WORLD', 'Test']);
  expect(evaluate('.map(s => s.trim().toLowerCase())', data)).toEqual(['hello', 'world', 'test']);
});

test('Navigator: nested method calls in filter predicates', () => {
  const users = [
    { name: 'Alice Smith', role: 'admin' },
    { name: 'Bob Jones', role: 'user' },
    { name: 'Charlie Smith', role: 'user' },
  ];
  expect(evaluate(".filter(u => u.name.includes('Smith'))", users)).toEqual([
    { name: 'Alice Smith', role: 'admin' },
    { name: 'Charlie Smith', role: 'user' },
  ]);
});

test('Navigator: division operator', () => {
  const data = [10, 20, 30];
  expect(evaluate('.map(x => x / 2)', data)).toEqual([5, 10, 15]);
});

test('Navigator: modulo operator', () => {
  const data = [10, 15, 20];
  expect(evaluate('.map(x => x % 7)', data)).toEqual([3, 1, 6]);
});

test('Navigator: less than operator', () => {
  const data = [1, 5, 10];
  expect(evaluate('.filter(x => x < 6)', data)).toEqual([1, 5]);
});

test('Navigator: less than or equal operator', () => {
  const data = [1, 5, 10];
  expect(evaluate('.filter(x => x <= 5)', data)).toEqual([1, 5]);
});

test('Navigator: equality operators', () => {
  const data = [1, 2, 3];
  expect(evaluate('.filter(x => x == 2)', data)).toEqual([2]);
  expect(evaluate('.filter(x => x === 2)', data)).toEqual([2]);
});

test('Navigator: inequality operators', () => {
  const data = [1, 2, 3];
  expect(evaluate('.filter(x => x != 2)', data)).toEqual([1, 3]);
  expect(evaluate('.filter(x => x !== 2)', data)).toEqual([1, 3]);
});

test('Navigator: filter with greater than', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.filter(x => x > 3)', data)).toEqual([4, 5]);
});

test('Navigator: filter with less than', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.filter(x => x < 3)', data)).toEqual([1, 2]);
});

test('Navigator: subtraction operator', () => {
  const data = [10, 20, 30];
  expect(evaluate('.map(x => x - 5)', data)).toEqual([5, 15, 25]);
});

test('Navigator: array reduce method', () => {
  const data = [1, 2, 3, 4];
  expect(evaluate('.reduce((acc, x) => acc + x, 0)', data)).toBe(10);
});

test('Navigator: array find method', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('.find(x => x > 3)', data)).toBe(4);
});

test('Navigator: array some method', () => {
  const data = [1, 2, 3];
  expect(evaluate('.some(x => x > 2)', data)).toBe(true);
  expect(evaluate('.some(x => x > 5)', data)).toBe(false);
});

test('Navigator: array every method', () => {
  const data = [2, 4, 6];
  expect(evaluate('.every(x => x % 2 === 0)', data)).toBe(true);
});

test('Navigator: string split method', () => {
  const data = { text: 'a,b,c' };
  expect(evaluate('.text.split(",")', data)).toEqual(['a', 'b', 'c']);
});

test('Navigator: string replace method', () => {
  const data = { text: 'hello world' };
  expect(evaluate('.text.replace("world", "there")', data)).toBe('hello there');
});

test('Navigator: array join method', () => {
  const data = ['a', 'b', 'c'];
  expect(evaluate('.join("-")', data)).toBe('a-b-c');
});

test('Navigator: array reverse method', () => {
  const data = [1, 2, 3];
  expect(evaluate('.reverse()', data)).toEqual([3, 2, 1]);
});

test('Navigator: array sort method', () => {
  const data = [3, 1, 2];
  expect(evaluate('.sort((a, b) => a - b)', data)).toEqual([1, 2, 3]);
});

test('Navigator: nested array access', () => {
  const data = { matrix: [[1, 2], [3, 4]] };
  expect(evaluate('.matrix[0][1]', data)).toBe(2);
});

test('Navigator: property access on null returns undefined', () => {
  const data = { value: null };
  expect(evaluate('.value.name', data)).toBeUndefined();
});

test('Navigator: array method on non-array returns undefined', () => {
  const data = { value: 'not an array' };
  expect(evaluate('.value[0]', data)).toBeUndefined();
});

test('Navigator: slice on non-array returns undefined', () => {
  const data = { value: 'string' };
  expect(evaluate('.value[0:2]', data)).toBeUndefined();
});

function evaluateStrict(expression: string, data: unknown): unknown {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: true });
  return navigator.evaluate(ast, data);
}

test('Navigator: strict mode throws on undefined property', () => {
  const data = { name: 'John' };
  expect(() => evaluateStrict('.nonexistent', data)).toThrow('Property "nonexistent" is undefined');
});

test('Navigator: strict mode allows valid property access', () => {
  const data = { name: 'John' };
  expect(evaluateStrict('.name', data)).toBe('John');
});

test('Navigator: strict mode throws on nested undefined property', () => {
  const data = { user: { name: 'John' } };
  expect(() => evaluateStrict('.user.email', data)).toThrow('Property "email" is undefined');
});

test('Navigator: non-strict mode returns undefined for missing property', () => {
  const data = { name: 'John' };
  expect(evaluate('.nonexistent', data)).toBeUndefined();
});