import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { detectFormat, parseLines, parseInput } from "../../src/formats/index.ts";
import { parseCSV, parseTSV } from "../../src/formats/csv.ts";
import { parseYAML } from "../../src/formats/yaml/index.ts";
import { parseTOML } from "../../src/formats/toml.ts";

describe("Format Detection", () => {
  test("detects JSON objects", () => {
    assert.strictEqual(detectFormat('{"name": "test"}'), "json");
    assert.strictEqual(detectFormat('  {"nested": {"value": 1}}  '), "json");
  });

  test("detects JSON arrays", () => {
    assert.strictEqual(detectFormat("[1, 2, 3]"), "json");
    assert.strictEqual(detectFormat('["a", "b", "c"]'), "json");
  });

  test("detects YAML", () => {
    assert.strictEqual(detectFormat("name: value"), "yaml");
    assert.strictEqual(detectFormat("---\nkey: value"), "yaml");
    assert.strictEqual(detectFormat("- item1\n- item2"), "yaml");
  });

  test("detects TOML", () => {
    assert.strictEqual(detectFormat('[section]\nkey = "value"'), "toml");
    assert.strictEqual(detectFormat('name = "test"\nage = 30'), "toml");
  });

  test("detects XML", () => {
    assert.strictEqual(detectFormat('<?xml version="1.0"?><root></root>'), "xml");
    assert.strictEqual(detectFormat("<root><child>value</child></root>"), "xml");
  });

  test("detects INI", () => {
    assert.strictEqual(detectFormat("[section]\nkey=value"), "ini");
    assert.strictEqual(detectFormat("key=value\nother=data"), "ini");
  });

  test("detects JSON5", () => {
    assert.strictEqual(detectFormat('{name: "test", // comment\n}'), "json5");
    assert.strictEqual(detectFormat('{trailing: "comma",}'), "json5");
  });

  test("treats JavaScript and TypeScript as text", () => {
    assert.strictEqual(detectFormat('export const data = { name: "test" };'), "text");
    assert.strictEqual(detectFormat("export default { value: 42 };"), "text");
    assert.strictEqual(detectFormat("interface User { name: string; }"), "text");
    assert.strictEqual(detectFormat("type Data = { value: number; }"), "text");
    assert.strictEqual(detectFormat('const users: string[] = ["Alice", "Bob"];'), "text");
  });

  test("detects CSV", () => {
    assert.strictEqual(detectFormat("name,age\nAlice,30\nBob,25"), "csv");
    assert.strictEqual(detectFormat("a,b,c\n1,2,3"), "csv");
  });

  test("detects TSV", () => {
    assert.strictEqual(detectFormat("name\tage\nAlice\t30\nBob\t25"), "tsv");
    assert.strictEqual(detectFormat("a\tb\tc\n1\t2\t3"), "tsv");
  });

  test("detects lines", () => {
    assert.strictEqual(detectFormat("line1\nline2\nline3"), "lines");
  });

  test("defaults to text for single line", () => {
    assert.strictEqual(detectFormat("simple text"), "text");
  });
});

describe("Lines Format", () => {
  test("parses lines correctly", () => {
    const input = "line1\nline2\nline3";
    assert.deepStrictEqual(parseLines(input), ["line1", "line2", "line3"]);
  });

  test("filters empty lines", () => {
    const input = "line1\n\nline2\n\n\nline3";
    assert.deepStrictEqual(parseLines(input), ["line1", "line2", "line3"]);
  });

  test("handles single line", () => {
    assert.deepStrictEqual(parseLines("single"), ["single"]);
  });
});

describe("CSV Format", () => {
  test("parses basic CSV", () => {
    const input = "name,age,city\nAlice,30,NYC\nBob,25,LA";
    const expected = [
      { name: "Alice", age: 30, city: "NYC" },
      { name: "Bob", age: 25, city: "LA" },
    ];
    assert.deepStrictEqual(parseCSV(input), expected);
  });

  test("handles quoted fields", () => {
    const input = 'name,description\n"John","Says ""Hello"""\n"Jane","Has, comma"';
    const expected = [
      { name: "John", description: 'Says "Hello"' },
      { name: "Jane", description: "Has, comma" },
    ];
    assert.deepStrictEqual(parseCSV(input), expected);
  });

  test("parses numbers and booleans", () => {
    const input = "name,age,active\nAlice,30,true\nBob,25,false";
    const expected = [
      { name: "Alice", age: 30, active: true },
      { name: "Bob", age: 25, active: false },
    ];
    assert.deepStrictEqual(parseCSV(input), expected);
  });

  test("handles null values", () => {
    const input = "name,email\nAlice,alice@test.com\nBob,";
    const expected = [
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: null },
    ];
    assert.deepStrictEqual(parseCSV(input), expected);
  });
});

describe("TSV Format", () => {
  test("parses TSV correctly", () => {
    const input = "name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA";
    const expected = [
      { name: "Alice", age: 30, city: "NYC" },
      { name: "Bob", age: 25, city: "LA" },
    ];
    assert.deepStrictEqual(parseTSV(input), expected);
  });
});

describe("YAML Format", () => {
  test("parses simple key-value pairs", () => {
    const input = "name: Alice\nage: 30\ncity: NYC";
    const expected = { name: "Alice", age: 30, city: "NYC" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses nested objects", () => {
    const input = `
user:
  name: Alice
  age: 30
  address:
    city: NYC
    zip: 10001`;
    const expected = {
      user: {
        name: "Alice",
        age: 30,
        address: {
          city: "NYC",
          zip: 10001,
        },
      },
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses lists", () => {
    const input = `
items:
  - apple
  - banana
  - orange`;
    const expected = {
      items: ["apple", "banana", "orange"],
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses inline arrays", () => {
    const input = "fruits: [apple, banana, orange]";
    const expected = { fruits: ["apple", "banana", "orange"] };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses booleans and null", () => {
    const input = "active: true\ninactive: false\nempty: null";
    const expected = { active: true, inactive: false, empty: null };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses empty values as null", () => {
    const input = "a: null\nb: ~\nc:";
    const expected = { a: null, b: null, c: null };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("ignores comments", () => {
    const input = "# This is a comment\nname: Alice # inline comment\n# Another comment\nage: 30";
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses single-quoted strings", () => {
    const input = "name: 'Alice'\ncity: 'New York'";
    const expected = { name: "Alice", city: "New York" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses inline objects", () => {
    const input = "user: { name: Alice, age: 30 }";
    const expected = { user: { name: "Alice", age: 30 } };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("handles document separators", () => {
    const input = "---\nname: Alice\nage: 30\n...";
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses nested lists in objects", () => {
    const input = `
user:
  name: Alice
  tags:
    - developer
    - javascript`;
    const expected = {
      user: {
        name: "Alice",
        tags: ["developer", "javascript"],
      },
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses floating point numbers", () => {
    const input = "pi: 3.14\ntemp: -0.5";
    const expected = { pi: 3.14, temp: -0.5 };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses objects in arrays", () => {
    const input = `
pokemon:
  - name: Pikachu
    type: electric
  - name: Charizard
    type: fire`;
    const expected = {
      pokemon: [
        { name: "Pikachu", type: "electric" },
        { name: "Charizard", type: "fire" },
      ],
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses nested arrays within list item objects", () => {
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
        { name: "Pikachu", moves: ["Thunder Shock", "Quick Attack"] },
        { name: "Charizard", moves: ["Flamethrower", "Fly"] },
      ],
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses deeply nested structures", () => {
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
          { name: "web", ports: [80, 443], settings: { ssl: true } },
          { name: "api", ports: [3000], settings: { ssl: false } },
        ],
      },
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses mixed arrays and objects at multiple levels", () => {
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
        name: "myapp",
        environments: [
          { name: "dev", features: ["debug", "hot-reload"] },
          { name: "prod", features: ["minify"] },
        ],
        database: { host: "localhost" },
      },
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses multiple top-level keys with arrays", () => {
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
      users: [{ name: "Alice" }, { name: "Bob" }],
      products: [
        { id: 1, name: "Widget" },
        { id: 2, name: "Gadget" },
      ],
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses root-level array of simple values", () => {
    const input = `- apple
- banana
- cherry`;
    const expected = ["apple", "banana", "cherry"];
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses root-level array of objects", () => {
    const input = `- name: Alice
  age: 30
- name: Bob
  age: 25`;
    const expected = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses multiline literal string (|)", () => {
    const input = `description: |
  This is a
  multiline string`;
    const expected = { description: "This is a\nmultiline string" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses multiline folded string (>)", () => {
    const input = `description: >
  This should be
  folded into one line`;
    const expected = { description: "This should be folded into one line" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses type tags (!!str)", () => {
    const input = `not_a_number: !!str 123
is_string: !!str true`;
    const expected = { not_a_number: "123", is_string: "true" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses anchors and aliases with merge", () => {
    const input = `defaults: &defaults
  adapter: postgres
  host: localhost
development:
  <<: *defaults
  database: dev_db`;
    const expected = {
      defaults: { adapter: "postgres", host: "localhost" },
      development: { adapter: "postgres", host: "localhost", database: "dev_db" },
    };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses simple alias references", () => {
    const input = `name: &myname Alice
greeting: *myname`;
    const expected = { name: "Alice", greeting: "Alice" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });
});

describe("TOML Format", () => {
  test("parses simple key-value pairs", () => {
    const input = 'name = "Alice"\nage = 30\nactive = true';
    const expected = { name: "Alice", age: 30, active: true };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses sections", () => {
    const input = `
[user]
name = "Alice"
age = 30

[database]
host = "localhost"
port = 5432`;
    const expected = {
      user: { name: "Alice", age: 30 },
      database: { host: "localhost", port: 5432 },
    };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses nested sections", () => {
    const input = `
[server]
host = "localhost"

[server.database]
port = 5432
name = "mydb"`;
    const expected = {
      server: {
        host: "localhost",
        database: {
          port: 5432,
          name: "mydb",
        },
      },
    };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses arrays", () => {
    const input = 'fruits = ["apple", "banana", "orange"]\nnumbers = [1, 2, 3]';
    const expected = {
      fruits: ["apple", "banana", "orange"],
      numbers: [1, 2, 3],
    };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("ignores comments", () => {
    const input = '# Comment\nname = "Alice" # inline comment\n# Another comment\nage = 30';
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses single-quoted strings", () => {
    const input = "name = 'Alice'\ncity = 'New York'";
    const expected = { name: "Alice", city: "New York" };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses inline tables", () => {
    const input = 'user = { name = "Alice", age = 30 }';
    const expected = { user: { name: "Alice", age: 30 } };
    assert.deepStrictEqual(parseTOML(input), expected);
  });

  test("parses floating point numbers", () => {
    const input = "pi = 3.14\ntemp = -0.5";
    const expected = { pi: 3.14, temp: -0.5 };
    assert.deepStrictEqual(parseTOML(input), expected);
  });
});

describe("YAML Edge Cases", () => {
  test("parses type tag without space (!!tag at end)", () => {
    const input = "value: !!str";
    const result = parseYAML(input);
    assert.deepStrictEqual(result, { value: "!!str" });
  });

  test("parses comments inside quoted strings", () => {
    const input = 'message: "Hello # not a comment"';
    const expected = { message: "Hello # not a comment" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("handles empty list items", () => {
    const input = `items:
  -
    name: first
  -
    name: second`;
    const expected = { items: [{ name: "first" }, { name: "second" }] };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses list item objects correctly", () => {
    const input = `items:
  - name: Alice
    age: 30`;
    const result = parseYAML(input);
    assert.strictEqual(result.items[0].name, "Alice");
    assert.strictEqual(result.items[0].age, 30);
  });

  test("parses multiline string with empty lines", () => {
    const input = `text: |
  line one

  line three`;
    const expected = { text: "line one\n\nline three" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses multiline folded with trailing modifiers", () => {
    const input = `desc: >-
  folded text
  continues here`;
    const expected = { desc: "folded text continues here" };
    assert.deepStrictEqual(parseYAML(input), expected);
  });

  test("parses deeply nested list items", () => {
    const input = `items:
  - name: test
    value: 123
    nested:
      key: value`;
    const result = parseYAML(input);
    assert.strictEqual(result.items[0].name, "test");
    assert.strictEqual(result.items[0].nested.key, "value");
  });

  test("handles anchor on key with pending list", () => {
    const input = `data: &mydata
  - item1
  - item2`;
    const result = parseYAML(input);
    assert.deepStrictEqual(result.data, ["item1", "item2"]);
  });

  test("parses multiline literal with |+", () => {
    const input = `text: |+
  line one
  line two`;
    const result = parseYAML(input);
    assert.ok(result.text.includes("line one"));
  });

  test("parses multiline literal with |-", () => {
    const input = `text: |-
  line one
  line two`;
    const result = parseYAML(input);
    assert.ok(result.text.includes("line one"));
  });

  test("parses multiline folded with >+", () => {
    const input = `text: >+
  line one
  line two`;
    const result = parseYAML(input);
    assert.ok(result.text.includes("line one"));
  });

  test("handles list after key with comment", () => {
    const input = `# comment
data: # inline comment
  - item1
  - item2`;
    const result = parseYAML(input);
    assert.deepStrictEqual(result.data, ["item1", "item2"]);
  });

  test("handles key with multiline indicator and comment", () => {
    const input = `text: | # comment
  content here`;
    const result = parseYAML(input);
    assert.strictEqual(result.text, "content here");
  });

  test("handles empty content in list item", () => {
    const input = `items:
  - first
  -
  - third`;
    const result = parseYAML(input);
    assert.strictEqual(result.items[0], "first");
    assert.strictEqual(result.items[2], "third");
  });

  test("handles list items with simple values after object", () => {
    const input = `data:
  - name: Alice
  - Bob
  - Charlie`;
    const result = parseYAML(input);
    assert.strictEqual(result.data[0].name, "Alice");
    assert.strictEqual(result.data[1], "Bob");
  });

  test("handles nested arrays without parent key on same line", () => {
    const input = `config:
  items:
    - one
    - two`;
    const result = parseYAML(input);
    assert.deepStrictEqual(result.config.items, ["one", "two"]);
  });
});

describe("Format Detection Edge Cases", () => {
  test("detects NDJSON", () => {
    const input = '{"a":1}\n{"b":2}\n{"c":3}';
    assert.strictEqual(detectFormat(input), "ndjson");
  });

  test("detects ENV format", () => {
    const input = "DATABASE_URL=postgres://localhost\nAPI_KEY=secret123";
    assert.strictEqual(detectFormat(input), "env");
  });

  test("detects protobuf-like syntax", () => {
    const input = "message User {\n  string name = 1;\n}";
    assert.strictEqual(detectFormat(input), "text");
  });

  test("treats TypeScript-like let declaration as text", () => {
    const input = "let users: string[] = [];";
    assert.strictEqual(detectFormat(input), "text");
  });

  test("treats TypeScript-like var declaration as text", () => {
    const input = "var count: number = 0;";
    assert.strictEqual(detectFormat(input), "text");
  });

  test("does not treat TOML type keys as TypeScript", () => {
    const input = 'type = "module"\nname = "demo"';
    assert.strictEqual(detectFormat(input), "toml");
  });

  test("does not treat INI type keys as TypeScript", () => {
    const input = "type = module\nname = demo";
    assert.strictEqual(detectFormat(input), "ini");
  });

  test("returns text for empty input", () => {
    assert.strictEqual(detectFormat(""), "text");
    assert.strictEqual(detectFormat("   "), "text");
  });
});

describe("parseInput Error Handling", () => {
  test("throws descriptive error for malformed JSON object", async () => {
    const input = "{broken json";
    await assert.rejects(parseInput(input), /Invalid JSON/);
  });

  test("throws descriptive error for malformed JSON array", async () => {
    const input = "[1, 2, 3";
    await assert.rejects(parseInput(input), /Invalid JSON/);
  });

  test("includes input preview in error message", async () => {
    const input = '{"key": invalid}';
    await assert.rejects(parseInput(input, "json"), /Input:/);
  });

  test("truncates long input in error preview", async () => {
    const input = '{"very_long_key_name_that_exceeds_fifty_characters_total": "value"';
    try {
      await parseInput(input);
    } catch (e) {
      assert.ok((e as Error).message.includes("..."));
    }
  });
});

describe("parseInput Integration", () => {
  test("parses TSV format", async () => {
    const input = "name\tage\nAlice\t30";
    const expected = [{ name: "Alice", age: 30 }];
    assert.deepStrictEqual(await parseInput(input, "tsv"), expected);
  });

  test("parses ENV format", async () => {
    const input = "NAME=Alice\nAGE=30";
    const result = await parseInput(input, "env");
    assert.deepStrictEqual(result, { NAME: "Alice", AGE: 30 });
  });

  test("parses NDJSON format", async () => {
    const input = '{"name":"Alice"}\n{"name":"Bob"}';
    const expected = [{ name: "Alice" }, { name: "Bob" }];
    assert.deepStrictEqual(await parseInput(input, "ndjson"), expected);
  });

  test("parses lines format", async () => {
    const input = "line1\nline2\nline3";
    assert.deepStrictEqual(await parseInput(input, "lines"), ["line1", "line2", "line3"]);
  });

  test("auto-detects and parses JSON", async () => {
    const input = '{"name": "Alice", "age": 30}';
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("auto-detects and parses YAML", async () => {
    const input = "name: Alice\nage: 30";
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("auto-detects and parses CSV", async () => {
    const input = "name,age\nAlice,30";
    const expected = [{ name: "Alice", age: 30 }];
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("uses specified format over detection", async () => {
    const input = "name: Alice";
    assert.strictEqual(await parseInput(input, "text"), "name: Alice");
  });

  test("auto-detects and parses XML", async () => {
    const input = "<root><name>Alice</name><age>30</age></root>";
    const expected = { root: { name: "Alice", age: 30 } };
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("auto-detects and parses INI", async () => {
    const input = "[user]\nname=Alice\nage=30";
    const expected = { user: { name: "Alice", age: 30 } };
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("auto-detects and parses JSON5", async () => {
    const input = '{name: "Alice", age: 30,}';
    const expected = { name: "Alice", age: 30 };
    assert.deepStrictEqual(await parseInput(input), expected);
  });

  test("auto-detects JavaScript as text", async () => {
    const input = 'export default { name: "Alice", age: 30 };';
    assert.strictEqual(await parseInput(input), input);
  });

  test("auto-detects TypeScript as text", async () => {
    const input =
      'interface User { name: string; }\nconst user: User = { name: "Alice" };\nexport default user;';
    assert.strictEqual(await parseInput(input), input);
  });
});
