import { describe, test, expect } from 'bun:test';
import { detectFormat, parseLines, parseInput } from '../../src/formats';
import { parseCSV, parseTSV } from '../../src/formats/csv';
import { parseYAML } from '../../src/formats/yaml';
import { parseTOML } from '../../src/formats/toml';

describe('Format Detection', () => {
  test('detects JSON objects', () => {
    expect(detectFormat('{"name": "test"}')).toBe('json');
    expect(detectFormat('  {"nested": {"value": 1}}  ')).toBe('json');
  });

  test('detects JSON arrays', () => {
    expect(detectFormat('[1, 2, 3]')).toBe('json');
    expect(detectFormat('["a", "b", "c"]')).toBe('json');
  });

  test('detects YAML', () => {
    expect(detectFormat('name: value')).toBe('yaml');
    expect(detectFormat('---\nkey: value')).toBe('yaml');
    expect(detectFormat('- item1\n- item2')).toBe('yaml');
  });

  test('detects TOML', () => {
    expect(detectFormat('[section]\nkey = "value"')).toBe('toml');
    expect(detectFormat('name = "test"\nage = 30')).toBe('toml');
  });

  test('detects XML', () => {
    expect(detectFormat('<?xml version="1.0"?><root></root>')).toBe('xml');
    expect(detectFormat('<root><child>value</child></root>')).toBe('xml');
  });

  test('detects INI', () => {
    expect(detectFormat('[section]\nkey=value')).toBe('ini');
    expect(detectFormat('key=value\nother=data')).toBe('ini');
  });

  test('detects JSON5', () => {
    expect(detectFormat('{name: "test", // comment\n}')).toBe('json5');
    expect(detectFormat('{trailing: "comma",}')).toBe('json5');
  });

  test('detects JavaScript', () => {
    expect(detectFormat('export const data = { name: "test" };')).toBe('javascript');
    expect(detectFormat('export default { value: 42 };')).toBe('javascript');
  });

  test('detects TypeScript', () => {
    expect(detectFormat('interface User { name: string; }')).toBe('typescript');
    expect(detectFormat('type Data = { value: number; }')).toBe('typescript');
    expect(detectFormat('const users: string[] = ["Alice", "Bob"];')).toBe('typescript');
  });

  test('detects CSV', () => {
    expect(detectFormat('name,age\nAlice,30\nBob,25')).toBe('csv');
    expect(detectFormat('a,b,c\n1,2,3')).toBe('csv');
  });

  test('detects TSV', () => {
    expect(detectFormat('name\tage\nAlice\t30\nBob\t25')).toBe('tsv');
    expect(detectFormat('a\tb\tc\n1\t2\t3')).toBe('tsv');
  });

  test('detects lines', () => {
    expect(detectFormat('line1\nline2\nline3')).toBe('lines');
  });

  test('defaults to text for single line', () => {
    expect(detectFormat('simple text')).toBe('text');
  });
});

describe('Lines Format', () => {
  test('parses lines correctly', () => {
    const input = 'line1\nline2\nline3';
    expect(parseLines(input)).toEqual(['line1', 'line2', 'line3']);
  });

  test('filters empty lines', () => {
    const input = 'line1\n\nline2\n\n\nline3';
    expect(parseLines(input)).toEqual(['line1', 'line2', 'line3']);
  });

  test('handles single line', () => {
    expect(parseLines('single')).toEqual(['single']);
  });
});

describe('CSV Format', () => {
  test('parses basic CSV', () => {
    const input = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
    const expected = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' }
    ];
    expect(parseCSV(input)).toEqual(expected);
  });

  test('handles quoted fields', () => {
    const input = 'name,description\n"John","Says ""Hello"""\n"Jane","Has, comma"';
    const expected = [
      { name: 'John', description: 'Says "Hello"' },
      { name: 'Jane', description: 'Has, comma' }
    ];
    expect(parseCSV(input)).toEqual(expected);
  });

  test('parses numbers and booleans', () => {
    const input = 'name,age,active\nAlice,30,true\nBob,25,false';
    const expected = [
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false }
    ];
    expect(parseCSV(input)).toEqual(expected);
  });

  test('handles null values', () => {
    const input = 'name,email\nAlice,alice@test.com\nBob,';
    const expected = [
      { name: 'Alice', email: 'alice@test.com' },
      { name: 'Bob', email: null }
    ];
    expect(parseCSV(input)).toEqual(expected);
  });
});

describe('TSV Format', () => {
  test('parses TSV correctly', () => {
    const input = 'name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA';
    const expected = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' }
    ];
    expect(parseTSV(input)).toEqual(expected);
  });
});

describe('YAML Format', () => {
  test('parses simple key-value pairs', () => {
    const input = 'name: Alice\nage: 30\ncity: NYC';
    const expected = { name: 'Alice', age: 30, city: 'NYC' };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses nested objects', () => {
    const input = `
user:
  name: Alice
  age: 30
  address:
    city: NYC
    zip: 10001`;
    const expected = {
      user: {
        name: 'Alice',
        age: 30,
        address: {
          city: 'NYC',
          zip: 10001
        }
      }
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses lists', () => {
    const input = `
items:
  - apple
  - banana
  - orange`;
    const expected = {
      items: ['apple', 'banana', 'orange']
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses inline arrays', () => {
    const input = 'fruits: [apple, banana, orange]';
    const expected = { fruits: ['apple', 'banana', 'orange'] };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses booleans and null', () => {
    const input = 'active: true\ninactive: false\nempty: null';
    const expected = { active: true, inactive: false, empty: null };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses empty values as null', () => {
    const input = 'a: null\nb: ~\nc:';
    const expected = { a: null, b: null, c: null };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('ignores comments', () => {
    const input = '# This is a comment\nname: Alice # inline comment\n# Another comment\nage: 30';
    const expected = { name: 'Alice', age: 30 };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses single-quoted strings', () => {
    const input = "name: 'Alice'\ncity: 'New York'";
    const expected = { name: 'Alice', city: 'New York' };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses inline objects', () => {
    const input = 'user: { name: Alice, age: 30 }';
    const expected = { user: { name: 'Alice', age: 30 } };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('handles document separators', () => {
    const input = '---\nname: Alice\nage: 30\n...';
    const expected = { name: 'Alice', age: 30 };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses nested lists in objects', () => {
    const input = `
user:
  name: Alice
  tags:
    - developer
    - javascript`;
    const expected = {
      user: {
        name: 'Alice',
        tags: ['developer', 'javascript']
      }
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses floating point numbers', () => {
    const input = 'pi: 3.14\ntemp: -0.5';
    const expected = { pi: 3.14, temp: -0.5 };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses objects in arrays', () => {
    const input = `
pokemon:
  - name: Pikachu
    type: electric
  - name: Charizard
    type: fire`;
    const expected = {
      pokemon: [
        { name: 'Pikachu', type: 'electric' },
        { name: 'Charizard', type: 'fire' }
      ]
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses nested arrays within list item objects', () => {
    const input = `
pokemon:
  - name: Pikachu
    moves:
      - Thunder Shock
      - Quick Attack
  - name: Charizard
    moves:
      - Flamethrower
      - Fly`;
    const expected = {
      pokemon: [
        { name: 'Pikachu', moves: ['Thunder Shock', 'Quick Attack'] },
        { name: 'Charizard', moves: ['Flamethrower', 'Fly'] }
      ]
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses deeply nested structures', () => {
    const input = `
config:
  servers:
    - name: web
      ports:
        - 80
        - 443
      settings:
        ssl: true
    - name: api
      ports:
        - 3000
      settings:
        ssl: false`;
    const expected = {
      config: {
        servers: [
          { name: 'web', ports: [80, 443], settings: { ssl: true } },
          { name: 'api', ports: [3000], settings: { ssl: false } }
        ]
      }
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses mixed arrays and objects at multiple levels', () => {
    const input = `
app:
  name: myapp
  environments:
    - name: dev
      features:
        - debug
        - hot-reload
    - name: prod
      features:
        - minify
  database:
    host: localhost`;
    const expected = {
      app: {
        name: 'myapp',
        environments: [
          { name: 'dev', features: ['debug', 'hot-reload'] },
          { name: 'prod', features: ['minify'] }
        ],
        database: { host: 'localhost' }
      }
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses multiple top-level keys with arrays', () => {
    const input = `
users:
  - name: Alice
  - name: Bob
products:
  - id: 1
    name: Widget
  - id: 2
    name: Gadget`;
    const expected = {
      users: [{ name: 'Alice' }, { name: 'Bob' }],
      products: [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' }
      ]
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses root-level array of simple values', () => {
    const input = `- apple
- banana
- cherry`;
    const expected = ['apple', 'banana', 'cherry'];
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses root-level array of objects', () => {
    const input = `- name: Alice
  age: 30
- name: Bob
  age: 25`;
    const expected = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses multiline literal string (|)', () => {
    const input = `description: |
  This is a
  multiline string`;
    const expected = { description: 'This is a\nmultiline string' };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses multiline folded string (>)', () => {
    const input = `description: >
  This should be
  folded into one line`;
    const expected = { description: 'This should be folded into one line' };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses type tags (!!str)', () => {
    const input = `not_a_number: !!str 123
is_string: !!str true`;
    const expected = { not_a_number: '123', is_string: 'true' };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses anchors and aliases with merge', () => {
    const input = `defaults: &defaults
  adapter: postgres
  host: localhost
development:
  <<: *defaults
  database: dev_db`;
    const expected = {
      defaults: { adapter: 'postgres', host: 'localhost' },
      development: { adapter: 'postgres', host: 'localhost', database: 'dev_db' }
    };
    expect(parseYAML(input)).toEqual(expected);
  });

  test('parses simple alias references', () => {
    const input = `name: &myname Alice
greeting: *myname`;
    const expected = { name: 'Alice', greeting: 'Alice' };
    expect(parseYAML(input)).toEqual(expected);
  });
});

describe('TOML Format', () => {
  test('parses simple key-value pairs', () => {
    const input = 'name = "Alice"\nage = 30\nactive = true';
    const expected = { name: 'Alice', age: 30, active: true };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses sections', () => {
    const input = `
[user]
name = "Alice"
age = 30

[database]
host = "localhost"
port = 5432`;
    const expected = {
      user: { name: 'Alice', age: 30 },
      database: { host: 'localhost', port: 5432 }
    };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses nested sections', () => {
    const input = `
[server]
host = "localhost"

[server.database]
port = 5432
name = "mydb"`;
    const expected = {
      server: {
        host: 'localhost',
        database: {
          port: 5432,
          name: 'mydb'
        }
      }
    };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses arrays', () => {
    const input = 'fruits = ["apple", "banana", "orange"]\nnumbers = [1, 2, 3]';
    const expected = {
      fruits: ['apple', 'banana', 'orange'],
      numbers: [1, 2, 3]
    };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('ignores comments', () => {
    const input = '# Comment\nname = "Alice" # inline comment\n# Another comment\nage = 30';
    const expected = { name: 'Alice', age: 30 };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses single-quoted strings', () => {
    const input = "name = 'Alice'\ncity = 'New York'";
    const expected = { name: 'Alice', city: 'New York' };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses inline tables', () => {
    const input = 'user = { name = "Alice", age = 30 }';
    const expected = { user: { name: 'Alice', age: 30 } };
    expect(parseTOML(input)).toEqual(expected);
  });

  test('parses floating point numbers', () => {
    const input = 'pi = 3.14\ntemp = -0.5';
    const expected = { pi: 3.14, temp: -0.5 };
    expect(parseTOML(input)).toEqual(expected);
  });
});

describe('parseInput Integration', () => {
  test('auto-detects and parses JSON', async () => {
    const input = '{"name": "Alice", "age": 30}';
    const expected = { name: 'Alice', age: 30 };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses YAML', async () => {
    const input = 'name: Alice\nage: 30';
    const expected = { name: 'Alice', age: 30 };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses CSV', async () => {
    const input = 'name,age\nAlice,30';
    const expected = [{ name: 'Alice', age: 30 }];
    expect(await parseInput(input)).toEqual(expected);
  });

  test('uses specified format over detection', async () => {
    const input = 'name: Alice';
    expect(await parseInput(input, 'text')).toBe('name: Alice');
  });

  test('auto-detects and parses XML', async () => {
    const input = '<root><name>Alice</name><age>30</age></root>';
    const expected = { root: { name: 'Alice', age: 30 } };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses INI', async () => {
    const input = '[user]\nname=Alice\nage=30';
    const expected = { user: { name: 'Alice', age: 30 } };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses JSON5', async () => {
    const input = '{name: "Alice", age: 30,}';
    const expected = { name: 'Alice', age: 30 };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses JavaScript', async () => {
    const input = 'export default { name: "Alice", age: 30 };';
    const expected = { name: 'Alice', age: 30 };
    expect(await parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses TypeScript', async () => {
    const input = 'interface User { name: string; }\nconst user: User = { name: "Alice" };\nexport default user;';
    const expected = { name: 'Alice' };
    expect(await parseInput(input)).toEqual(expected);
  });
});