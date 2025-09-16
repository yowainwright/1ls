import { describe, test, expect } from 'bun:test';
import { Lexer } from '../src/parser/lexer';
import { Parser } from '../src/parser/parser';
import { JsonNavigator } from '../src/navigator/json';
import { parseInput } from '../src/utils/parsers';

function evaluate(expression: string, data: any): any {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator();
  return navigator.evaluate(ast, data);
}

describe('1ls Feature Tests', () => {
  describe('Basic Property Access', () => {
    test('should access top-level properties', () => {
      const data = { name: 'Alice', age: 30 };
      expect(evaluate('.name', data)).toBe('Alice');
      expect(evaluate('.age', data)).toBe(30);
    });

    test('should access nested properties', () => {
      const data = {
        user: {
          profile: {
            name: 'Bob',
            email: 'bob@example.com'
          }
        }
      };
      expect(evaluate('.user.profile.name', data)).toBe('Bob');
      expect(evaluate('.user.profile.email', data)).toBe('bob@example.com');
    });

    test('should access properties with bracket notation', () => {
      const data = {
        'user-name': 'Charlie',
        'data': { 'sub-key': 'value' }
      };
      expect(evaluate('["user-name"]', data)).toBe('Charlie');
      expect(evaluate('.data["sub-key"]', data)).toBe('value');
    });
  });

  describe('Array Operations', () => {
    test('should access array elements by index', () => {
      const data = ['a', 'b', 'c', 'd'];
      expect(evaluate('[0]', data)).toBe('a');
      expect(evaluate('[2]', data)).toBe('c');
      expect(evaluate('[-1]', data)).toBe('d');
      expect(evaluate('[-2]', data)).toBe('c');
    });

    test('should slice arrays', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('[1:3]', data)).toEqual([2, 3]);
      expect(evaluate('[2:]', data)).toEqual([3, 4, 5]);
      expect(evaluate('[:3]', data)).toEqual([1, 2, 3]);
      expect(evaluate('[-2:]', data)).toEqual([4, 5]);
    });

    test('should filter arrays', () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate('.filter(x => x > 3)', data)).toEqual([4, 5]);
      expect(evaluate('.filter(x => x % 2 === 0)', data)).toEqual([2, 4]);
    });

    test('should map arrays', () => {
      const data = [1, 2, 3];
      expect(evaluate('.map(x => x * 2)', data)).toEqual([2, 4, 6]);
      expect(evaluate('.map(x => x + 10)', data)).toEqual([11, 12, 13]);
    });

    test('should reduce arrays', () => {
      const data = [1, 2, 3, 4];
      expect(evaluate('.reduce((a, b) => a + b, 0)', data)).toBe(10);
      expect(evaluate('.reduce((a, b) => a * b, 1)', data)).toBe(24);
    });

    test('should chain array methods', () => {
      const data = [1, 2, 3, 4, 5, 6];
      expect(evaluate('.filter(x => x > 2).map(x => x * 2)', data))
        .toEqual([6, 8, 10, 12]);
      expect(evaluate('.map(x => x * 2).filter(x => x > 6)', data))
        .toEqual([8, 10, 12]);
    });
  });

  describe('Object Operations', () => {
    test('should get object keys, values, and entries', () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate('.{keys}', data)).toEqual(['a', 'b', 'c']);
      expect(evaluate('.{values}', data)).toEqual([1, 2, 3]);
      expect(evaluate('.{entries}', data)).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    test('should get object length', () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate('.{length}', data)).toBe(3);
    });

    test('should work with array of objects', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 }
      ];
      expect(evaluate('.map(x => x.name)', data))
        .toEqual(['Alice', 'Bob', 'Charlie']);
      expect(evaluate('.filter(x => x.age > 30)', data))
        .toEqual([{ name: 'Charlie', age: 35 }]);
    });
  });

  describe('Complex Transformations', () => {
    test('should handle nested filtering and mapping', () => {
      const data = {
        users: [
          { name: 'Alice', scores: [80, 90, 85] },
          { name: 'Bob', scores: [75, 85, 95] },
          { name: 'Charlie', scores: [90, 95, 100] }
        ]
      };
      expect(evaluate('.users.map(u => u.name)', data))
        .toEqual(['Alice', 'Bob', 'Charlie']);
      expect(evaluate('.users[0].scores.filter(s => s > 85)', data))
        .toEqual([90]);
    });

    test('should calculate aggregates', () => {
      const data = {
        items: [
          { price: 10, quantity: 2 },
          { price: 15, quantity: 3 },
          { price: 20, quantity: 1 }
        ]
      };
      expect(evaluate('.items.map(i => i.price * i.quantity)', data))
        .toEqual([20, 45, 20]);
      expect(evaluate('.items.map(i => i.price * i.quantity).reduce((a, b) => a + b, 0)', data))
        .toBe(85);
    });

    test('should extract and flatten nested data', () => {
      const data = {
        departments: [
          {
            name: 'Engineering',
            employees: ['Alice', 'Bob']
          },
          {
            name: 'Sales',
            employees: ['Charlie', 'David', 'Eve']
          }
        ]
      };
      expect(evaluate('.departments.map(d => d.employees)', data))
        .toEqual([['Alice', 'Bob'], ['Charlie', 'David', 'Eve']]);
      expect(evaluate('.departments.map(d => d.employees).flat()', data))
        .toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve']);
    });
  });

  describe('Different Input Formats', () => {
    test('should process CSV data', () => {
      const csv = `name,age,city
Alice,30,NYC
Bob,25,LA
Charlie,35,Chicago`;
      const data = parseInput(csv, 'csv');
      expect(evaluate('[0].name', data)).toBe('Alice');
      expect(evaluate('.map(x => x.age)', data)).toEqual([30, 25, 35]);
      expect(evaluate('.filter(x => x.age > 30)', data))
        .toEqual([{ name: 'Charlie', age: 35, city: 'Chicago' }]);
    });

    test('should process YAML data', () => {
      const yaml = `
database:
  host: localhost
  port: 5432
  tables:
    - users
    - posts
    - comments`;
      const data = parseInput(yaml, 'yaml');
      expect(evaluate('.database.host', data)).toBe('localhost');
      expect(evaluate('.database.port', data)).toBe(5432);
      expect(evaluate('.database.tables[1]', data)).toBe('posts');
      expect(evaluate('.database.tables.length', data)).toBe(3);
    });

    test('should process TOML data', () => {
      const toml = `
[package]
name = "my-app"
version = "1.0.0"

[dependencies]
express = "4.18.0"
lodash = "4.17.21"`;
      const data = parseInput(toml, 'toml');
      expect(evaluate('.package.name', data)).toBe('my-app');
      expect(evaluate('.dependencies.{keys}', data))
        .toEqual(['express', 'lodash']);
    });

    test('should process line-by-line text', () => {
      const text = `error: file not found
warning: deprecated function
info: process started
error: connection failed`;
      const data = parseInput(text, 'lines');
      expect(evaluate('.length', data)).toBe(4);
      expect(evaluate('.filter(x => x.includes("error"))', data))
        .toEqual(['error: file not found', 'error: connection failed']);
      expect(evaluate('[0]', data)).toBe('error: file not found');
    });
  });

  describe('Real-world Use Cases', () => {
    test('should extract package.json dependencies', () => {
      const packageJson = {
        name: 'my-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'vite': '^4.0.0'
        }
      };
      expect(evaluate('.dependencies.{keys}', packageJson))
        .toEqual(['react', 'react-dom']);
      expect(evaluate('.devDependencies.{values}', packageJson))
        .toEqual(['^5.0.0', '^4.0.0']);
    });

    test('should process API responses', () => {
      const apiResponse = {
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'Alice', active: true },
            { id: 2, name: 'Bob', active: false },
            { id: 3, name: 'Charlie', active: true }
          ],
          total: 3,
          page: 1
        }
      };
      expect(evaluate('.data.users.filter(u => u.active)', apiResponse))
        .toEqual([
          { id: 1, name: 'Alice', active: true },
          { id: 3, name: 'Charlie', active: true }
        ]);
      expect(evaluate('.data.users.filter(u => u.active).map(u => u.name)', apiResponse))
        .toEqual(['Alice', 'Charlie']);
    });

    test('should analyze log data', () => {
      const logs = [
        { timestamp: '2024-01-01T10:00:00', level: 'ERROR', message: 'Connection failed' },
        { timestamp: '2024-01-01T10:01:00', level: 'INFO', message: 'Retry attempt 1' },
        { timestamp: '2024-01-01T10:02:00', level: 'ERROR', message: 'Connection failed' },
        { timestamp: '2024-01-01T10:03:00', level: 'SUCCESS', message: 'Connected' }
      ];
      expect(evaluate('.filter(l => l.level === "ERROR")', logs)).toHaveLength(2);
      expect(evaluate('.map(l => l.level).filter((v, i, a) => a.indexOf(v) === i)', logs))
        .toEqual(['ERROR', 'INFO', 'SUCCESS']);
    });

    test('should transform configuration data', () => {
      const config = {
        environments: {
          dev: { url: 'http://localhost:3000', debug: true },
          staging: { url: 'https://staging.app.com', debug: true },
          prod: { url: 'https://app.com', debug: false }
        }
      };
      expect(evaluate('.environments.{keys}', config))
        .toEqual(['dev', 'staging', 'prod']);
      expect(evaluate('.environments.{values}.map(e => e.url)', config))
        .toEqual(['http://localhost:3000', 'https://staging.app.com', 'https://app.com']);
      expect(evaluate('.environments.{entries}.filter(([k, v]) => v.debug)', config))
        .toEqual([
          ['dev', { url: 'http://localhost:3000', debug: true }],
          ['staging', { url: 'https://staging.app.com', debug: true }]
        ]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty data', () => {
      expect(evaluate('.length', [])).toBe(0);
      expect(evaluate('.{keys}', {})).toEqual([]);
      expect(evaluate('.filter(x => x > 0)', [])).toEqual([]);
    });

    test('should handle null and undefined gracefully', () => {
      const data = { a: null, b: undefined, c: 'value' };
      expect(evaluate('.a', data)).toBe(null);
      expect(evaluate('.b', data)).toBe(undefined);
      expect(evaluate('.c', data)).toBe('value');
    });

    test('should handle deeply nested paths', () => {
      const data = {
        a: { b: { c: { d: { e: { f: 'deep value' } } } } }
      };
      expect(evaluate('.a.b.c.d.e.f', data)).toBe('deep value');
    });

    test('should handle special characters in keys', () => {
      const data = {
        'content-type': 'application/json',
        'user@email': 'test@example.com',
        '123-number': 456
      };
      expect(evaluate('["content-type"]', data)).toBe('application/json');
      expect(evaluate('["user@email"]', data)).toBe('test@example.com');
      expect(evaluate('["123-number"]', data)).toBe(456);
    });

    test('should handle mixed data types', () => {
      const data = [1, 'two', { three: 3 }, [4], true, null];
      expect(evaluate('.length', data)).toBe(6);
      expect(evaluate('[2].three', data)).toBe(3);
      expect(evaluate('[3][0]', data)).toBe(4);
      expect(evaluate('.filter(x => typeof x === "number")', data)).toEqual([1]);
    });
  });
});