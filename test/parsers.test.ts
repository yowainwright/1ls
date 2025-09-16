import { describe, test, expect } from 'bun:test';
import {
  detectFormat,
  parseLines,
  parseCSV,
  parseTSV,
  parseYAML,
  parseTOML,
  parseInput
} from '../src/utils/parsers';

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

describe('Line Parser', () => {
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

describe('CSV Parser', () => {
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

describe('TSV Parser', () => {
  test('parses TSV correctly', () => {
    const input = 'name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA';
    const expected = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' }
    ];
    expect(parseTSV(input)).toEqual(expected);
  });
});

describe('YAML Parser', () => {
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

  test('ignores comments', () => {
    const input = '# This is a comment\nname: Alice # inline comment\n# Another comment\nage: 30';
    const expected = { name: 'Alice', age: 30 };
    expect(parseYAML(input)).toEqual(expected);
  });
});

describe('TOML Parser', () => {
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
});

describe('parseInput Integration', () => {
  test('auto-detects and parses JSON', () => {
    const input = '{"name": "Alice", "age": 30}';
    const expected = { name: 'Alice', age: 30 };
    expect(parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses YAML', () => {
    const input = 'name: Alice\nage: 30';
    const expected = { name: 'Alice', age: 30 };
    expect(parseInput(input)).toEqual(expected);
  });

  test('auto-detects and parses CSV', () => {
    const input = 'name,age\nAlice,30';
    const expected = [{ name: 'Alice', age: 30 }];
    expect(parseInput(input)).toEqual(expected);
  });

  test('uses specified format over detection', () => {
    const input = 'name: Alice';
    // Would normally detect as YAML, but we force text
    expect(parseInput(input, 'text')).toBe('name: Alice');
  });
});