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

test('Navigator: pipe applies transformations left-to-right', () => {
  const data = [1, 2, 3];
  expect(evaluate('pipe(.map(x => x * 2))', data)).toEqual([2, 4, 6]);
  expect(evaluate('pipe(.map(x => x * 2), .map(x => x + 1))', data)).toEqual([3, 5, 7]);
});

test('Navigator: compose applies transformations right-to-left', () => {
  const data = [1, 2, 3];
  expect(evaluate('compose(.map(x => x + 1), .map(x => x * 2))', data)).toEqual([3, 5, 7]);
});

test('Navigator: pipe with filter and map', () => {
  const data = [{ name: 'alice', age: 30 }, { name: 'bob', age: 20 }];
  expect(evaluate('pipe(.filter(x => x.age > 25), .map(x => x.name))', data)).toEqual(['alice']);
});

test('Navigator: head returns first element', () => {
  expect(evaluate('head()', [1, 2, 3])).toBe(1);
  expect(evaluate('head()', [])).toBeUndefined();
});

test('Navigator: last returns last element', () => {
  expect(evaluate('last()', [1, 2, 3])).toBe(3);
  expect(evaluate('last()', [])).toBeUndefined();
});

test('Navigator: tail returns all but first', () => {
  expect(evaluate('tail()', [1, 2, 3])).toEqual([2, 3]);
});

test('Navigator: take and drop', () => {
  expect(evaluate('take(2)', [1, 2, 3, 4])).toEqual([1, 2]);
  expect(evaluate('drop(2)', [1, 2, 3, 4])).toEqual([3, 4]);
});

test('Navigator: uniq removes duplicates', () => {
  expect(evaluate('uniq()', [1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
});

test('Navigator: flatten nested arrays', () => {
  expect(evaluate('flatten()', [[1, 2], [3, [4, 5]]])).toEqual([1, 2, 3, 4, 5]);
});

test('Navigator: keys and vals', () => {
  const data = { a: 1, b: 2 };
  expect(evaluate('keys()', data)).toEqual(['a', 'b']);
  expect(evaluate('vals()', data)).toEqual([1, 2]);
});

test('Navigator: pick and omit', () => {
  const data = { a: 1, b: 2, c: 3 };
  expect(evaluate('pick("a", "b")', data)).toEqual({ a: 1, b: 2 });
  expect(evaluate('omit("c")', data)).toEqual({ a: 1, b: 2 });
});

test('Navigator: fromPairs and toPairs', () => {
  expect(evaluate('fromPairs()', [['a', 1], ['b', 2]])).toEqual({ a: 1, b: 2 });
  expect(evaluate('toPairs()', { a: 1, b: 2 })).toEqual([['a', 1], ['b', 2]]);
});

test('Navigator: sum, mean, min, max', () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate('sum()', data)).toBe(15);
  expect(evaluate('mean()', data)).toBe(3);
  expect(evaluate('min()', data)).toBe(1);
  expect(evaluate('max()', data)).toBe(5);
});

test('Navigator: isEmpty and isNil', () => {
  expect(evaluate('isEmpty()', [])).toBe(true);
  expect(evaluate('isEmpty()', [1])).toBe(false);
  expect(evaluate('isEmpty()', {})).toBe(true);
  expect(evaluate('isEmpty()', { a: 1 })).toBe(false);
  expect(evaluate('isNil()', null)).toBe(true);
  expect(evaluate('isNil()', undefined)).toBe(true);
  expect(evaluate('isNil()', 0)).toBe(false);
});

test('Navigator: pluck extracts property from array of objects', () => {
  const data = [{ name: 'alice' }, { name: 'bob' }];
  expect(evaluate('pluck("name")', data)).toEqual(['alice', 'bob']);
});

test('Navigator: len and count', () => {
  expect(evaluate('len()', [1, 2, 3])).toBe(3);
  expect(evaluate('count()', { a: 1, b: 2 })).toBe(2);
  expect(evaluate('len()', 'hello')).toBe(5);
});

test('Navigator: sortBy sorts by key function', () => {
  const data = [{ name: 'charlie', age: 30 }, { name: 'alice', age: 25 }, { name: 'bob', age: 35 }];
  expect(evaluate('sortBy(x => x.age)', data)).toEqual([
    { name: 'alice', age: 25 },
    { name: 'charlie', age: 30 },
    { name: 'bob', age: 35 },
  ]);
  expect(evaluate('sortBy(x => x.name)', data)).toEqual([
    { name: 'alice', age: 25 },
    { name: 'bob', age: 35 },
    { name: 'charlie', age: 30 },
  ]);
});

test('Navigator: chunk splits array into chunks', () => {
  expect(evaluate('chunk(2)', [1, 2, 3, 4, 5])).toEqual([[1, 2], [3, 4], [5]]);
  expect(evaluate('chunk(3)', [1, 2, 3, 4, 5, 6])).toEqual([[1, 2, 3], [4, 5, 6]]);
});

test('Navigator: compact removes falsy values', () => {
  expect(evaluate('compact()', [0, 1, false, 2, '', 3, null, undefined])).toEqual([1, 2, 3]);
});

test('Navigator: deepMerge recursively merges objects', () => {
  const { executeBuiltin } = require('../../src/navigator/builtins');
  const base = { a: 1, nested: { x: 1, y: 2 } };
  const override = { b: 2, nested: { y: 3, z: 4 } };
  expect(executeBuiltin('deepMerge', base, [override])).toEqual({
    a: 1,
    b: 2,
    nested: { x: 1, y: 3, z: 4 },
  });
});

test('Navigator: recursive descent (..) collects all values', () => {
  const data = {
    name: 'root',
    children: [
      { name: 'child1', value: 1 },
      { name: 'child2', value: 2, nested: { name: 'grandchild' } },
    ],
  };
  const result = evaluate('..', data) as unknown[];
  expect(result).toContain('root');
  expect(result).toContain('child1');
  expect(result).toContain('child2');
  expect(result).toContain('grandchild');
  expect(result).toContain(1);
  expect(result).toContain(2);
});

test('Navigator: recursive descent on array', () => {
  const data = [
    { id: 1, items: [{ id: 2 }, { id: 3 }] },
    { id: 4, items: [{ id: 5 }] },
  ];
  const result = evaluate('..', data) as unknown[];
  expect(result).toContain(1);
  expect(result).toContain(2);
  expect(result).toContain(3);
  expect(result).toContain(4);
  expect(result).toContain(5);
});

test('Navigator: optional access returns undefined on missing property', () => {
  const data = { name: 'test' };
  expect(evaluate('.name?', data)).toBe('test');
  expect(evaluate('.missing?', data)).toBeUndefined();
});

test('Navigator: optional access on nested path', () => {
  const data = { user: { profile: { name: 'John' } } };
  expect(evaluate('.user?.profile?.name?', data)).toBe('John');
  expect(evaluate('.user?.missing?.name?', data)).toBeUndefined();
});

test('Navigator: null coalescing provides default value', () => {
  const data = { name: null, value: 'exists' };
  expect(evaluate('.name ?? "default"', data)).toBe('default');
  expect(evaluate('.value ?? "default"', data)).toBe('exists');
});

test('Navigator: null coalescing with undefined', () => {
  const data = { existing: 'value' };
  expect(evaluate('.missing ?? "fallback"', data)).toBe('fallback');
  expect(evaluate('.existing ?? "fallback"', data)).toBe('value');
});

test('Navigator: null coalescing with number default', () => {
  const data = { count: null };
  expect(evaluate('.count ?? 0', data)).toBe(0);
});

test('Navigator: combined optional access and null coalescing', () => {
  const data = { user: null };
  expect(evaluate('.user ?? "anonymous"', data)).toBe('anonymous');
});

test('Navigator: type builtin returns correct types', () => {
  expect(evaluate('type()', 'hello')).toBe('string');
  expect(evaluate('type()', 42)).toBe('number');
  expect(evaluate('type()', true)).toBe('boolean');
  expect(evaluate('type()', null)).toBe('null');
  expect(evaluate('type()', [1, 2])).toBe('array');
  expect(evaluate('type()', { a: 1 })).toBe('object');
});

test('Navigator: range generates number sequences', () => {
  expect(evaluate('range(5)', null)).toEqual([0, 1, 2, 3, 4]);
  expect(evaluate('range(1, 5)', null)).toEqual([1, 2, 3, 4]);
  expect(evaluate('range(0, 10, 2)', null)).toEqual([0, 2, 4, 6, 8]);
});

test('Navigator: has checks key existence', () => {
  const data = { name: 'test', value: null };
  expect(evaluate('has("name")', data)).toBe(true);
  expect(evaluate('has("value")', data)).toBe(true);
  expect(evaluate('has("missing")', data)).toBe(false);
});

test('Navigator: nth gets element at index', () => {
  const data = ['a', 'b', 'c', 'd'];
  expect(evaluate('nth(0)', data)).toBe('a');
  expect(evaluate('nth(2)', data)).toBe('c');
  expect(evaluate('nth(-1)', data)).toBe('d');
});

test('Navigator: contains checks for subset', () => {
  const { executeBuiltin } = require('../../src/navigator/builtins');
  expect(executeBuiltin('contains', [1, 2, 3], [[2]])).toBe(true);
  expect(executeBuiltin('contains', [1, 2, 3], [[5]])).toBe(false);
  expect(executeBuiltin('contains', { a: 1, b: 2 }, [{ a: 1 }])).toBe(true);
});

test('Navigator: add concatenates arrays or sums numbers', () => {
  expect(evaluate('add()', [[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
  expect(evaluate('add()', [1, 2, 3])).toBe(6);
});

test('Navigator: getpath retrieves nested values', () => {
  const { executeBuiltin } = require('../../src/navigator/builtins');
  const data = { a: { b: { c: 1 } } };
  expect(executeBuiltin('getpath', data, [['a', 'b', 'c']])).toBe(1);
  expect(executeBuiltin('getpath', data, [['a', 'b']])).toEqual({ c: 1 });
});

test('Navigator: split and join string operations', () => {
  expect(evaluate('split(",")', 'a,b,c')).toEqual(['a', 'b', 'c']);
  expect(evaluate('join("-")', ['a', 'b', 'c'])).toBe('a-b-c');
});

test('Navigator: startswith and endswith', () => {
  expect(evaluate('startswith("hello")', 'hello world')).toBe(true);
  expect(evaluate('startswith("world")', 'hello world')).toBe(false);
  expect(evaluate('endswith("world")', 'hello world')).toBe(true);
  expect(evaluate('endswith("hello")', 'hello world')).toBe(false);
});

test('Navigator: ltrimstr and rtrimstr', () => {
  expect(evaluate('ltrimstr("hello ")', 'hello world')).toBe('world');
  expect(evaluate('rtrimstr(" world")', 'hello world')).toBe('hello');
});

test('Navigator: tostring and tonumber', () => {
  expect(evaluate('tostring()', 42)).toBe('42');
  expect(evaluate('tostring()', true)).toBe('true');
  expect(evaluate('tonumber()', '42')).toBe(42);
  expect(evaluate('tonumber()', '3.14')).toBe(3.14);
});

test('Navigator: floor, ceil, round', () => {
  expect(evaluate('floor()', 3.7)).toBe(3);
  expect(evaluate('ceil()', 3.2)).toBe(4);
  expect(evaluate('round()', 3.5)).toBe(4);
  expect(evaluate('round()', 3.4)).toBe(3);
});

test('Navigator: abs returns absolute value', () => {
  expect(evaluate('abs()', -5)).toBe(5);
  expect(evaluate('abs()', 5)).toBe(5);
});

test('Navigator: not negates boolean', () => {
  expect(evaluate('not()', true)).toBe(false);
  expect(evaluate('not()', false)).toBe(true);
  expect(evaluate('not()', 0)).toBe(true);
  expect(evaluate('not()', 1)).toBe(false);
});

test('Navigator: select returns value if predicate passes', () => {
  const { executeBuiltin, EMPTY_SYMBOL } = require('../../src/navigator/builtins');
  const gt3 = (x: number) => x > 3;
  const lt3 = (x: number) => x < 3;
  expect(executeBuiltin('select', 5, [gt3])).toBe(5);
  expect(executeBuiltin('select', 2, [gt3])).toBe(EMPTY_SYMBOL);
  expect(executeBuiltin('select', 2, [lt3])).toBe(2);
});

test('Navigator: error throws with message', () => {
  expect(() => evaluate('error("test error")', null)).toThrow('test error');
});