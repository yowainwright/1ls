import { test, expect } from 'bun:test';
import { executeBuiltin } from '../../src/navigator/builtins';

test('head returns first element', () => {
  expect(executeBuiltin('head', [1, 2, 3], [])).toBe(1);
  expect(executeBuiltin('head', ['a', 'b'], [])).toBe('a');
  expect(executeBuiltin('head', [], [])).toBeUndefined();
  expect(executeBuiltin('head', 'not array', [])).toBeUndefined();
});

test('last returns last element', () => {
  expect(executeBuiltin('last', [1, 2, 3], [])).toBe(3);
  expect(executeBuiltin('last', ['a', 'b'], [])).toBe('b');
  expect(executeBuiltin('last', [], [])).toBeUndefined();
  expect(executeBuiltin('last', 'not array', [])).toBeUndefined();
});

test('tail returns all but first', () => {
  expect(executeBuiltin('tail', [1, 2, 3], [])).toEqual([2, 3]);
  expect(executeBuiltin('tail', [1], [])).toEqual([]);
  expect(executeBuiltin('tail', [], [])).toEqual([]);
  expect(executeBuiltin('tail', 'not array', [])).toEqual([]);
});

test('take returns first n elements', () => {
  expect(executeBuiltin('take', [1, 2, 3, 4, 5], [2])).toEqual([1, 2]);
  expect(executeBuiltin('take', [1, 2, 3], [5])).toEqual([1, 2, 3]);
  expect(executeBuiltin('take', [1, 2, 3], [0])).toEqual([]);
  expect(executeBuiltin('take', 'not array', [2])).toEqual([]);
});

test('drop removes first n elements', () => {
  expect(executeBuiltin('drop', [1, 2, 3, 4, 5], [2])).toEqual([3, 4, 5]);
  expect(executeBuiltin('drop', [1, 2, 3], [5])).toEqual([]);
  expect(executeBuiltin('drop', [1, 2, 3], [0])).toEqual([1, 2, 3]);
  expect(executeBuiltin('drop', 'not array', [2])).toEqual([]);
});

test('uniq removes duplicates', () => {
  expect(executeBuiltin('uniq', [1, 2, 2, 3, 3, 3], [])).toEqual([1, 2, 3]);
  expect(executeBuiltin('uniq', ['a', 'b', 'a'], [])).toEqual(['a', 'b']);
  expect(executeBuiltin('uniq', [], [])).toEqual([]);
  expect(executeBuiltin('uniq', 'not array', [])).toEqual([]);
});

test('flatten flattens nested arrays', () => {
  expect(executeBuiltin('flatten', [[1, 2], [3, 4]], [])).toEqual([1, 2, 3, 4]);
  expect(executeBuiltin('flatten', [[1, [2, [3]]], 4], [])).toEqual([1, 2, 3, 4]);
  expect(executeBuiltin('flatten', [1, 2, 3], [])).toEqual([1, 2, 3]);
  expect(executeBuiltin('flatten', 'not array', [])).toEqual([]);
});

test('rev reverses array', () => {
  expect(executeBuiltin('rev', [1, 2, 3], [])).toEqual([3, 2, 1]);
  expect(executeBuiltin('rev', ['a', 'b', 'c'], [])).toEqual(['c', 'b', 'a']);
  expect(executeBuiltin('rev', [], [])).toEqual([]);
  expect(executeBuiltin('rev', 'not array', [])).toEqual([]);
});

test('groupBy groups by function result', () => {
  const data = [{ type: 'a', val: 1 }, { type: 'b', val: 2 }, { type: 'a', val: 3 }];
  const fn = (x: { type: string }) => x.type;
  const result = executeBuiltin('groupBy', data, [fn]);
  expect(result).toEqual({
    a: [{ type: 'a', val: 1 }, { type: 'a', val: 3 }],
    b: [{ type: 'b', val: 2 }],
  });
  expect(executeBuiltin('groupBy', 'not array', [fn])).toEqual({});
});

test('sortBy sorts by function result', () => {
  const data = [{ name: 'c', age: 30 }, { name: 'a', age: 20 }, { name: 'b', age: 25 }];
  expect(executeBuiltin('sortBy', data, [(x: { age: number }) => x.age])).toEqual([
    { name: 'a', age: 20 },
    { name: 'b', age: 25 },
    { name: 'c', age: 30 },
  ]);
  expect(executeBuiltin('sortBy', data, [(x: { name: string }) => x.name])).toEqual([
    { name: 'a', age: 20 },
    { name: 'b', age: 25 },
    { name: 'c', age: 30 },
  ]);
  expect(executeBuiltin('sortBy', 'not array', [(x: unknown) => x])).toEqual([]);
});

test('chunk splits array into chunks', () => {
  expect(executeBuiltin('chunk', [1, 2, 3, 4, 5], [2])).toEqual([[1, 2], [3, 4], [5]]);
  expect(executeBuiltin('chunk', [1, 2, 3, 4, 5, 6], [3])).toEqual([[1, 2, 3], [4, 5, 6]]);
  expect(executeBuiltin('chunk', [1, 2], [5])).toEqual([[1, 2]]);
  expect(executeBuiltin('chunk', [], [2])).toEqual([]);
  expect(executeBuiltin('chunk', 'not array', [2])).toEqual([]);
});

test('compact removes falsy values', () => {
  expect(executeBuiltin('compact', [0, 1, false, 2, '', 3, null, undefined], [])).toEqual([1, 2, 3]);
  expect(executeBuiltin('compact', [true, false, true], [])).toEqual([true, true]);
  expect(executeBuiltin('compact', [], [])).toEqual([]);
  expect(executeBuiltin('compact', 'not array', [])).toEqual([]);
});

test('pluck extracts property from array of objects', () => {
  const data = [{ name: 'alice', age: 30 }, { name: 'bob', age: 25 }];
  expect(executeBuiltin('pluck', data, ['name'])).toEqual(['alice', 'bob']);
  expect(executeBuiltin('pluck', data, ['age'])).toEqual([30, 25]);
  expect(executeBuiltin('pluck', data, ['missing'])).toEqual([undefined, undefined]);
  expect(executeBuiltin('pluck', 'not array', ['name'])).toEqual([]);
});

test('pick selects specified keys from object', () => {
  const data = { a: 1, b: 2, c: 3 };
  expect(executeBuiltin('pick', data, ['a', 'b'])).toEqual({ a: 1, b: 2 });
  expect(executeBuiltin('pick', data, ['a'])).toEqual({ a: 1 });
  expect(executeBuiltin('pick', data, ['missing'])).toEqual({});
  expect(executeBuiltin('pick', 'not object', ['a'])).toEqual({});
});

test('omit removes specified keys from object', () => {
  const data = { a: 1, b: 2, c: 3 };
  expect(executeBuiltin('omit', data, ['c'])).toEqual({ a: 1, b: 2 });
  expect(executeBuiltin('omit', data, ['a', 'b'])).toEqual({ c: 3 });
  expect(executeBuiltin('omit', data, ['missing'])).toEqual({ a: 1, b: 2, c: 3 });
  expect(executeBuiltin('omit', 'not object', ['a'])).toEqual({});
});

test('keys returns object keys', () => {
  expect(executeBuiltin('keys', { a: 1, b: 2 }, [])).toEqual(['a', 'b']);
  expect(executeBuiltin('keys', {}, [])).toEqual([]);
  expect(executeBuiltin('keys', 'not object', [])).toEqual([]);
});

test('vals returns object values', () => {
  expect(executeBuiltin('vals', { a: 1, b: 2 }, [])).toEqual([1, 2]);
  expect(executeBuiltin('vals', {}, [])).toEqual([]);
  expect(executeBuiltin('vals', 'not object', [])).toEqual([]);
});

test('merge shallow merges objects', () => {
  expect(executeBuiltin('merge', { a: 1 }, [{ b: 2 }])).toEqual({ a: 1, b: 2 });
  expect(executeBuiltin('merge', { a: 1 }, [{ a: 2 }])).toEqual({ a: 2 });
  expect(executeBuiltin('merge', { a: 1 }, [{ b: 2 }, { c: 3 }])).toEqual({ a: 1, b: 2, c: 3 });
  expect(executeBuiltin('merge', 'not object', [{ a: 1 }])).toEqual({});
});

test('deepMerge recursively merges objects', () => {
  const base = { a: 1, nested: { x: 1, y: 2 } };
  const override = { b: 2, nested: { y: 3, z: 4 } };
  expect(executeBuiltin('deepMerge', base, [override])).toEqual({
    a: 1,
    b: 2,
    nested: { x: 1, y: 3, z: 4 },
  });
  expect(executeBuiltin('deepMerge', { a: { b: { c: 1 } } }, [{ a: { b: { d: 2 } } }])).toEqual({
    a: { b: { c: 1, d: 2 } },
  });
  expect(executeBuiltin('deepMerge', 'not object', [{ a: 1 }])).toEqual({});
});

test('fromPairs converts array of pairs to object', () => {
  expect(executeBuiltin('fromPairs', [['a', 1], ['b', 2]], [])).toEqual({ a: 1, b: 2 });
  expect(executeBuiltin('fromPairs', [], [])).toEqual({});
  expect(executeBuiltin('fromPairs', 'not array', [])).toEqual({});
});

test('toPairs converts object to array of pairs', () => {
  expect(executeBuiltin('toPairs', { a: 1, b: 2 }, [])).toEqual([['a', 1], ['b', 2]]);
  expect(executeBuiltin('toPairs', {}, [])).toEqual([]);
  expect(executeBuiltin('toPairs', 'not object', [])).toEqual([]);
});

test('sum adds all numbers', () => {
  expect(executeBuiltin('sum', [1, 2, 3, 4], [])).toBe(10);
  expect(executeBuiltin('sum', [10, -5, 5], [])).toBe(10);
  expect(executeBuiltin('sum', [], [])).toBe(0);
  expect(executeBuiltin('sum', 'not array', [])).toBe(0);
});

test('mean calculates average', () => {
  expect(executeBuiltin('mean', [1, 2, 3, 4, 5], [])).toBe(3);
  expect(executeBuiltin('mean', [10, 20], [])).toBe(15);
  expect(executeBuiltin('mean', [], [])).toBe(0);
  expect(executeBuiltin('mean', 'not array', [])).toBe(0);
});

test('min returns minimum value', () => {
  expect(executeBuiltin('min', [3, 1, 4, 1, 5], [])).toBe(1);
  expect(executeBuiltin('min', [-5, 0, 5], [])).toBe(-5);
  expect(executeBuiltin('min', [42], [])).toBe(42);
  expect(executeBuiltin('min', 'not array', [])).toBeUndefined();
});

test('max returns maximum value', () => {
  expect(executeBuiltin('max', [3, 1, 4, 1, 5], [])).toBe(5);
  expect(executeBuiltin('max', [-5, 0, 5], [])).toBe(5);
  expect(executeBuiltin('max', [42], [])).toBe(42);
  expect(executeBuiltin('max', 'not array', [])).toBeUndefined();
});

test('len returns length', () => {
  expect(executeBuiltin('len', [1, 2, 3], [])).toBe(3);
  expect(executeBuiltin('len', { a: 1, b: 2 }, [])).toBe(2);
  expect(executeBuiltin('len', 'hello', [])).toBe(5);
  expect(executeBuiltin('len', 123, [])).toBe(0);
});

test('count returns count (alias for len)', () => {
  expect(executeBuiltin('count', [1, 2, 3], [])).toBe(3);
  expect(executeBuiltin('count', { a: 1, b: 2 }, [])).toBe(2);
  expect(executeBuiltin('count', 'hello', [])).toBe(5);
  expect(executeBuiltin('count', 123, [])).toBe(0);
});

test('isEmpty checks if empty', () => {
  expect(executeBuiltin('isEmpty', [], [])).toBe(true);
  expect(executeBuiltin('isEmpty', [1], [])).toBe(false);
  expect(executeBuiltin('isEmpty', {}, [])).toBe(true);
  expect(executeBuiltin('isEmpty', { a: 1 }, [])).toBe(false);
  expect(executeBuiltin('isEmpty', '', [])).toBe(true);
  expect(executeBuiltin('isEmpty', 'hello', [])).toBe(false);
  expect(executeBuiltin('isEmpty', null, [])).toBe(true);
  expect(executeBuiltin('isEmpty', undefined, [])).toBe(true);
  expect(executeBuiltin('isEmpty', 0, [])).toBe(false);
});

test('isNil checks if null or undefined', () => {
  expect(executeBuiltin('isNil', null, [])).toBe(true);
  expect(executeBuiltin('isNil', undefined, [])).toBe(true);
  expect(executeBuiltin('isNil', 0, [])).toBe(false);
  expect(executeBuiltin('isNil', '', [])).toBe(false);
  expect(executeBuiltin('isNil', false, [])).toBe(false);
  expect(executeBuiltin('isNil', [], [])).toBe(false);
});

test('id returns input unchanged', () => {
  expect(executeBuiltin('id', 42, [])).toBe(42);
  expect(executeBuiltin('id', 'hello', [])).toBe('hello');
  expect(executeBuiltin('id', [1, 2, 3], [])).toEqual([1, 2, 3]);
  expect(executeBuiltin('id', { a: 1 }, [])).toEqual({ a: 1 });
  expect(executeBuiltin('id', null, [])).toBe(null);
});

test('type returns correct types', () => {
  expect(executeBuiltin('type', null, [])).toBe('null');
  expect(executeBuiltin('type', undefined, [])).toBe('undefined');
  expect(executeBuiltin('type', 42, [])).toBe('number');
  expect(executeBuiltin('type', 'hello', [])).toBe('string');
  expect(executeBuiltin('type', true, [])).toBe('boolean');
  expect(executeBuiltin('type', [1, 2], [])).toBe('array');
  expect(executeBuiltin('type', { a: 1 }, [])).toBe('object');
});

test('range generates sequences', () => {
  expect(executeBuiltin('range', null, [5])).toEqual([0, 1, 2, 3, 4]);
  expect(executeBuiltin('range', null, [2, 5])).toEqual([2, 3, 4]);
  expect(executeBuiltin('range', null, [0, 10, 2])).toEqual([0, 2, 4, 6, 8]);
  expect(executeBuiltin('range', null, [5, 0])).toEqual([]);
});

test('has checks key existence', () => {
  expect(executeBuiltin('has', { a: 1, b: 2 }, ['a'])).toBe(true);
  expect(executeBuiltin('has', { a: 1 }, ['b'])).toBe(false);
  expect(executeBuiltin('has', [1, 2, 3], [0])).toBe(true);
  expect(executeBuiltin('has', [1, 2, 3], [5])).toBe(false);
  expect(executeBuiltin('has', 'string', ['a'])).toBe(false);
});

test('nth gets element at index', () => {
  expect(executeBuiltin('nth', [10, 20, 30], [0])).toBe(10);
  expect(executeBuiltin('nth', [10, 20, 30], [2])).toBe(30);
  expect(executeBuiltin('nth', [10, 20, 30], [-1])).toBe(30);
  expect(executeBuiltin('nth', [10, 20, 30], [-2])).toBe(20);
  expect(executeBuiltin('nth', 'not array', [0])).toBeUndefined();
});

test('contains checks deep containment', () => {
  expect(executeBuiltin('contains', [1, 2, 3], [[2]])).toBe(true);
  expect(executeBuiltin('contains', [1, 2, 3], [[5]])).toBe(false);
  expect(executeBuiltin('contains', { a: 1, b: 2 }, [{ a: 1 }])).toBe(true);
  expect(executeBuiltin('contains', { a: 1 }, [{ b: 2 }])).toBe(false);
  expect(executeBuiltin('contains', [[1, 2], [3, 4]], [[[1, 2]]])).toBe(true);
});

test('add concatenates or sums', () => {
  expect(executeBuiltin('add', [1, 2, 3, 4], [])).toBe(10);
  expect(executeBuiltin('add', ['a', 'b', 'c'], [])).toBe('abc');
  expect(executeBuiltin('add', [[1, 2], [3, 4]], [])).toEqual([1, 2, 3, 4]);
  expect(executeBuiltin('add', [], [])).toBe(null);
  expect(executeBuiltin('add', 'not array', [])).toBe('not array');
});

test('path returns all paths', () => {
  const result = executeBuiltin('path', { a: { b: 1 } }, []) as (string | number)[][];
  expect(result).toContainEqual([]);
  expect(result).toContainEqual(['a']);
  expect(result).toContainEqual(['a', 'b']);
});

test('getpath retrieves value at path', () => {
  const data = { a: { b: { c: 42 } } };
  expect(executeBuiltin('getpath', data, [['a', 'b', 'c']])).toBe(42);
  expect(executeBuiltin('getpath', data, [['a', 'b']])).toEqual({ c: 42 });
  expect(executeBuiltin('getpath', data, [['x', 'y']])).toBeUndefined();
});

test('setpath sets value at path', () => {
  const data = { a: { b: 1 } };
  expect(executeBuiltin('setpath', data, [['a', 'b'], 99])).toEqual({ a: { b: 99 } });
  expect(executeBuiltin('setpath', data, [['a', 'c'], 42])).toEqual({ a: { b: 1, c: 42 } });
});

test('recurse collects all values', () => {
  const data = { a: [1, { b: 2 }] };
  const result = executeBuiltin('recurse', data, []) as unknown[];
  expect(result).toContain(data);
  expect(result).toContain(1);
  expect(result).toContain(2);
});

test('split splits strings', () => {
  expect(executeBuiltin('split', 'a,b,c', [','])).toEqual(['a', 'b', 'c']);
  expect(executeBuiltin('split', 'hello', [''])).toEqual(['h', 'e', 'l', 'l', 'o']);
  expect(executeBuiltin('split', 123, [','])).toEqual([]);
});

test('join joins arrays', () => {
  expect(executeBuiltin('join', ['a', 'b', 'c'], [','])).toBe('a,b,c');
  expect(executeBuiltin('join', [1, 2, 3], ['-'])).toBe('1-2-3');
  expect(executeBuiltin('join', 'not array', [','])).toBe('');
});

test('startswith checks prefix', () => {
  expect(executeBuiltin('startswith', 'hello world', ['hello'])).toBe(true);
  expect(executeBuiltin('startswith', 'hello world', ['world'])).toBe(false);
  expect(executeBuiltin('startswith', 123, ['1'])).toBe(false);
});

test('endswith checks suffix', () => {
  expect(executeBuiltin('endswith', 'hello world', ['world'])).toBe(true);
  expect(executeBuiltin('endswith', 'hello world', ['hello'])).toBe(false);
  expect(executeBuiltin('endswith', 123, ['3'])).toBe(false);
});

test('ltrimstr removes prefix', () => {
  expect(executeBuiltin('ltrimstr', 'hello world', ['hello '])).toBe('world');
  expect(executeBuiltin('ltrimstr', 'hello world', ['foo'])).toBe('hello world');
  expect(executeBuiltin('ltrimstr', 123, ['1'])).toBe(123);
});

test('rtrimstr removes suffix', () => {
  expect(executeBuiltin('rtrimstr', 'hello world', [' world'])).toBe('hello');
  expect(executeBuiltin('rtrimstr', 'hello world', ['foo'])).toBe('hello world');
  expect(executeBuiltin('rtrimstr', 123, ['3'])).toBe(123);
});

test('tostring converts to string', () => {
  expect(executeBuiltin('tostring', 42, [])).toBe('42');
  expect(executeBuiltin('tostring', 'hello', [])).toBe('hello');
  expect(executeBuiltin('tostring', { a: 1 }, [])).toBe('{"a":1}');
  expect(executeBuiltin('tostring', null, [])).toBe('null');
});

test('tonumber converts to number', () => {
  expect(executeBuiltin('tonumber', '42', [])).toBe(42);
  expect(executeBuiltin('tonumber', '3.14', [])).toBe(3.14);
  expect(executeBuiltin('tonumber', 42, [])).toBe(42);
  expect(executeBuiltin('tonumber', 'not a number', [])).toBe(null);
  expect(executeBuiltin('tonumber', {}, [])).toBe(null);
});

test('floor floors numbers', () => {
  expect(executeBuiltin('floor', 3.7, [])).toBe(3);
  expect(executeBuiltin('floor', -3.2, [])).toBe(-4);
  expect(executeBuiltin('floor', 'not number', [])).toBe(null);
});

test('ceil ceils numbers', () => {
  expect(executeBuiltin('ceil', 3.2, [])).toBe(4);
  expect(executeBuiltin('ceil', -3.7, [])).toBe(-3);
  expect(executeBuiltin('ceil', 'not number', [])).toBe(null);
});

test('round rounds numbers', () => {
  expect(executeBuiltin('round', 3.4, [])).toBe(3);
  expect(executeBuiltin('round', 3.5, [])).toBe(4);
  expect(executeBuiltin('round', 'not number', [])).toBe(null);
});

test('abs returns absolute value', () => {
  expect(executeBuiltin('abs', -5, [])).toBe(5);
  expect(executeBuiltin('abs', 5, [])).toBe(5);
  expect(executeBuiltin('abs', 'not number', [])).toBe(null);
});

test('not negates values', () => {
  expect(executeBuiltin('not', true, [])).toBe(false);
  expect(executeBuiltin('not', false, [])).toBe(true);
  expect(executeBuiltin('not', null, [])).toBe(true);
  expect(executeBuiltin('not', 0, [])).toBe(true);
  expect(executeBuiltin('not', 1, [])).toBe(false);
});

test('error throws', () => {
  expect(() => executeBuiltin('error', null, ['custom error'])).toThrow('custom error');
  expect(() => executeBuiltin('error', null, [])).toThrow('error');
});
