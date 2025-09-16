import { describe, test, expect } from 'bun:test';
import { Lexer } from '../src/parser/lexer';
import { Parser } from '../src/parser/parser';
import { JsonNavigator } from '../src/navigator/json';
import { parseInput } from '../src/utils/parsers';
import { expandShortcuts } from '../src/utils/shortcuts';

function evaluate(expression: string, data: any): any {
  const expandedExpression = expandShortcuts(expression);
  const lexer = new Lexer(expandedExpression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator();
  return navigator.evaluate(ast, data);
}

describe('Currently Implemented Features', () => {
  describe('Basic Property Access', () => {
    test('accessing top-level properties with dot notation', () => {
      const data = { name: 'Alice', age: 30, active: true };
      expect(evaluate('.name', data)).toBe('Alice');
      expect(evaluate('.age', data)).toBe(30);
      expect(evaluate('.active', data)).toBe(true);
    });

    test('accessing nested properties', () => {
      const data = {
        user: {
          profile: {
            name: 'Bob',
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      expect(evaluate('.user.profile.name', data)).toBe('Bob');
      expect(evaluate('.user.profile.settings.theme', data)).toBe('dark');
    });

    test('accessing properties with bracket notation', () => {
      const data = {
        'user-name': 'Charlie',
        'content-type': 'application/json'
      };
      expect(evaluate('["user-name"]', data)).toBe('Charlie');
      expect(evaluate('["content-type"]', data)).toBe('application/json');
    });
  });

  describe('Array Access', () => {
    test('accessing array elements by positive index', () => {
      const data = ['first', 'second', 'third'];
      expect(evaluate('[0]', data)).toBe('first');
      expect(evaluate('[1]', data)).toBe('second');
      expect(evaluate('[2]', data)).toBe('third');
    });

    test('accessing array elements by negative index', () => {
      const data = ['a', 'b', 'c', 'd'];
      expect(evaluate('[-1]', data)).toBe('d');
      expect(evaluate('[-2]', data)).toBe('c');
      expect(evaluate('[-3]', data)).toBe('b');
    });

    test('array slicing', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('[1:3]', data)).toEqual([2, 3]);
      expect(evaluate('[2:]', data)).toEqual([3, 4, 5]);
      expect(evaluate('[:3]', data)).toEqual([1, 2, 3]);
      expect(evaluate('[-2:]', data)).toEqual([4, 5]);
    });

    test('empty array slice returns empty array', () => {
      const data = [1, 2, 3];
      expect(evaluate('[10:20]', data)).toEqual([]);
    });
  });

  describe('Object Operations', () => {
    test('getting object keys', () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate('.{keys}', data)).toEqual(['a', 'b', 'c']);
    });

    test('getting object values', () => {
      const data = { x: 10, y: 20, z: 30 };
      expect(evaluate('.{values}', data)).toEqual([10, 20, 30]);
    });

    test('getting object entries', () => {
      const data = { name: 'Alice', age: 30 };
      expect(evaluate('.{entries}', data)).toEqual([['name', 'Alice'], ['age', 30]]);
    });

    test('getting object/array length', () => {
      expect(evaluate('.{length}', { a: 1, b: 2 })).toBe(2);
      expect(evaluate('.length', [1, 2, 3, 4])).toBe(4);
      expect(evaluate('.length', 'hello')).toBe(5);
    });
  });

  describe('Array Methods', () => {
    test('filter with simple comparisons', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.filter(x => x > 3)', data)).toEqual([4, 5]);
      expect(evaluate('.filter(x => x < 3)', data)).toEqual([1, 2]);
    });

    test('map with simple operations', () => {
      const data = [1, 2, 3];
      expect(evaluate('.map(x => x * 2)', data)).toEqual([2, 4, 6]);
      expect(evaluate('.map(x => x + 10)', data)).toEqual([11, 12, 13]);
    });

    test('reduce with addition', () => {
      const data = [1, 2, 3, 4];
      expect(evaluate('.reduce((a, b) => a + b, 0)', data)).toBe(10);
    });

    test('reduce with multiplication', () => {
      const data = [2, 3, 4];
      expect(evaluate('.reduce((a, b) => a * b, 1)', data)).toBe(24);
    });

    test('find first matching element', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.find(x => x > 3)', data)).toBe(4);
    });

    test('some checks if any element matches', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.some(x => x > 4)', data)).toBe(true);
      expect(evaluate('.some(x => x > 10)', data)).toBe(false);
    });

    test('every checks if all elements match', () => {
      const data = [2, 4, 6, 8];
      expect(evaluate('.every(x => x > 0)', data)).toBe(true);
      expect(evaluate('.every(x => x > 5)', data)).toBe(false);
    });

    test('includes checks for element presence', () => {
      const data = ['a', 'b', 'c'];
      expect(evaluate('.includes("b")', data)).toBe(true);
      expect(evaluate('.includes("d")', data)).toBe(false);
    });

    test('flat flattens nested arrays', () => {
      const data = [[1, 2], [3, 4], [5]];
      expect(evaluate('.flat()', data)).toEqual([1, 2, 3, 4, 5]);
    });

    test('join concatenates array elements', () => {
      const data = ['a', 'b', 'c'];
      expect(evaluate('.join(",")', data)).toBe('a,b,c');
      expect(evaluate('.join("-")', data)).toBe('a-b-c');
    });
  });

  describe('Method Chaining', () => {
    test('chaining filter and map', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.filter(x => x > 2).map(x => x * 2)', data))
        .toEqual([6, 8, 10]);
    });

    test('chaining map and filter', () => {
      const data = [1, 2, 3, 4];
      expect(evaluate('.map(x => x * 2).filter(x => x > 4)', data))
        .toEqual([6, 8]);
    });

    test('complex chaining with reduce', () => {
      const data = [1, 2, 3, 4, 5];
      const result = evaluate(
        '.filter(x => x > 2).map(x => x * 2).reduce((a, b) => a + b, 0)',
        data
      );
      expect(result).toBe(24); // (3*2 + 4*2 + 5*2) = 6 + 8 + 10 = 24
    });
  });

  describe('Working with Objects in Arrays', () => {
    test('extracting property from array of objects', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 }
      ];
      expect(evaluate('.map(x => x.name)', data))
        .toEqual(['Alice', 'Bob', 'Charlie']);
      expect(evaluate('.map(x => x.age)', data))
        .toEqual([30, 25, 35]);
    });

    test('filtering objects by property', () => {
      const data = [
        { name: 'Alice', active: true },
        { name: 'Bob', active: false },
        { name: 'Charlie', active: true }
      ];
      expect(evaluate('.filter(x => x.active)', data))
        .toEqual([
          { name: 'Alice', active: true },
          { name: 'Charlie', active: true }
        ]);
    });

    test('finding object by property', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      expect(evaluate('.find(x => x.id === 2)', data))
        .toEqual({ id: 2, name: 'Bob' });
    });
  });

  describe('Shortcut Syntax', () => {
    test('.mp expands to .map', () => {
      const data = [{ val: 1 }, { val: 2 }, { val: 3 }];
      expect(evaluate('.mp(x => x.val)', data)).toEqual([1, 2, 3]);
    });

    test('.flt expands to .filter', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.flt(x => x > 3)', data)).toEqual([4, 5]);
    });

    test('.rd expands to .reduce', () => {
      const data = [1, 2, 3, 4];
      expect(evaluate('.rd((a, b) => a + b, 0)', data)).toBe(10);
    });

    test('.fnd expands to .find', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.fnd(x => x > 3)', data)).toBe(4);
    });

    test('.sm expands to .some', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.sm(x => x > 4)', data)).toBe(true);
    });

    test('.evr expands to .every', () => {
      const data = [2, 4, 6];
      expect(evaluate('.evr(x => x > 0)', data)).toBe(true);
    });

    test('.flt1 expands to .flat', () => {
      const data = [[1, 2], [3, 4]];
      expect(evaluate('.flt1()', data)).toEqual([1, 2, 3, 4]);
    });

    test('.jn expands to .join', () => {
      const data = ['a', 'b', 'c'];
      expect(evaluate('.jn("-")', data)).toBe('a-b-c');
    });

    test('.incl expands to .includes', () => {
      const data = [1, 2, 3];
      expect(evaluate('.incl(2)', data)).toBe(true);
    });

    test('.kys expands to .{keys}', () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate('.kys', data)).toEqual(['a', 'b', 'c']);
    });

    test('.vls expands to .{values}', () => {
      const data = { x: 10, y: 20 };
      expect(evaluate('.vls', data)).toEqual([10, 20]);
    });

    test('.len expands to .{length}', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.len', data)).toBe(5);
    });
  });

  describe('Input Format Parsing', () => {
    test('parsing CSV data', () => {
      const csv = `name,age,active
Alice,30,true
Bob,25,false`;
      const data = parseInput(csv, 'csv');
      expect(data).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false }
      ]);
    });

    test('parsing YAML data', () => {
      const yaml = `
name: test-app
version: 1.0.0
features:
  - auth
  - api
  - dashboard`;
      const data = parseInput(yaml, 'yaml');
      expect(data.name).toBe('test-app');
      expect(data.version).toBe('1.0.0');
      expect(data.features).toEqual(['auth', 'api', 'dashboard']);
    });

    test('parsing TOML data', () => {
      const toml = `
[server]
host = "localhost"
port = 3000

[database]
type = "postgres"
port = 5432`;
      const data = parseInput(toml, 'toml');
      expect(data.server.host).toBe('localhost');
      expect(data.server.port).toBe(3000);
      expect(data.database.type).toBe('postgres');
    });

    test('parsing line-by-line text', () => {
      const text = `first line
second line
third line`;
      const data = parseInput(text, 'lines');
      expect(data).toEqual(['first line', 'second line', 'third line']);
    });

    test('auto-detecting JSON format', () => {
      const json = '{"name":"test","value":123}';
      const data = parseInput(json);
      expect(data).toEqual({ name: 'test', value: 123 });
    });

    test('auto-detecting CSV format', () => {
      const csv = 'a,b,c\n1,2,3';
      const data = parseInput(csv);
      expect(data).toEqual([{ a: 1, b: 2, c: 3 }]);
    });
  });

  describe('Real-world Examples', () => {
    test('extracting dependencies from package.json', () => {
      const packageJson = {
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'axios': '^1.0.0'
        }
      };
      expect(evaluate('.dependencies.{keys}', packageJson))
        .toEqual(['react', 'react-dom', 'axios']);
    });

    test('filtering and mapping API response', () => {
      const response = {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
          { id: 3, name: 'Charlie', role: 'admin' }
        ]
      };
      const admins = evaluate('.users.filter(u => u.role === "admin").map(u => u.name)', response);
      expect(admins).toEqual(['Alice', 'Charlie']);
    });

    test('calculating totals from invoice data', () => {
      const invoice = {
        items: [
          { description: 'Widget', quantity: 2, price: 10.00 },
          { description: 'Gadget', quantity: 1, price: 25.00 },
          { description: 'Tool', quantity: 3, price: 15.00 }
        ]
      };
      const total = evaluate(
        '.items.map(i => i.quantity * i.price).reduce((a, b) => a + b, 0)',
        invoice
      );
      expect(total).toBe(90.00);
    });

    test('extracting unique values', () => {
      const data = {
        logs: [
          { level: 'ERROR', message: 'Failed' },
          { level: 'INFO', message: 'Started' },
          { level: 'ERROR', message: 'Timeout' },
          { level: 'WARNING', message: 'Slow' },
          { level: 'INFO', message: 'Complete' }
        ]
      };
      const levels = evaluate(
        '.logs.map(l => l.level).filter((v, i, a) => a.indexOf(v) === i)',
        data
      );
      expect(levels).toEqual(['ERROR', 'INFO', 'WARNING']);
    });
  });
});