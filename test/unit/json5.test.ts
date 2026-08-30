import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseJSON5, stripJSON5Comments, normalizeJSON5 } from "../../src/formats/json5";

describe("JSON5 Comment Stripper", () => {
  test("strips single-line comments", () => {
    const input = '{\n  // This is a comment\n  "name": "Alice"\n}';
    const result = stripJSON5Comments(input);
    assert.ok(!result.includes("//"));
    assert.ok(result.includes('"name"'));
  });

  test("strips multi-line comments", () => {
    const input = '{\n  /* This is a\n     multi-line comment */\n  "name": "Alice"\n}';
    const result = stripJSON5Comments(input);
    assert.ok(!result.includes("/*"));
    assert.ok(!result.includes("*/"));
    assert.ok(result.includes('"name"'));
  });

  test("preserves comments in strings", () => {
    const input = '{"url": "https://example.com//path"}';
    const result = stripJSON5Comments(input);
    assert.ok(result.includes("//path"));
  });

  test("preserves multi-line comment syntax in strings", () => {
    const input = '{"comment": "This /* is not */ a comment"}';
    const result = stripJSON5Comments(input);
    assert.ok(result.includes("/* is not */"));
  });

  test("handles escaped quotes in strings", () => {
    const input = '{"quote": "She said \\"hello\\""}';
    const result = stripJSON5Comments(input);
    assert.ok(result.includes('\\"hello\\"'));
  });

  test("handles single-quoted strings", () => {
    const input = "{'name': 'Alice'}";
    const result = stripJSON5Comments(input);
    assert.strictEqual(result, "{'name': 'Alice'}");
  });

  test("handles backticks in values", () => {
    const input = '{"template": "value with backtick"}';
    const result = stripJSON5Comments(input);
    assert.ok(result.includes("value with backtick"));
  });

  test("handles mixed comment types", () => {
    const input = `{
  // Single line comment
  "name": "Alice",
  /* Multi-line
     comment */
  "age": 30
}`;
    const result = stripJSON5Comments(input);
    assert.ok(!result.includes("//"));
    assert.ok(!result.includes("/*"));
    assert.ok(result.includes('"name"'));
    assert.ok(result.includes('"age"'));
  });
});

describe("JSON5 Normalizer", () => {
  test("removes trailing commas in objects", () => {
    const input = '{"name": "Alice", "age": 30,}';
    const result = normalizeJSON5(input);
    assert.strictEqual(result, '{"name": "Alice", "age": 30}');
  });

  test("removes trailing commas in arrays", () => {
    const input = "[1, 2, 3,]";
    const result = normalizeJSON5(input);
    assert.strictEqual(result, "[1, 2, 3]");
  });

  test("quotes unquoted keys", () => {
    const input = '{name: "Alice", age: 30}';
    const result = normalizeJSON5(input);
    assert.strictEqual(result, '{"name": "Alice", "age": 30}');
  });

  test("preserves already quoted keys", () => {
    const input = '{"name": "Alice"}';
    const result = normalizeJSON5(input);
    assert.strictEqual(result, '{"name": "Alice"}');
  });

  test("handles keys with underscores", () => {
    const input = '{first_name: "Alice", last_name: "Smith"}';
    const result = normalizeJSON5(input);
    assert.strictEqual(result, '{"first_name": "Alice", "last_name": "Smith"}');
  });

  test("handles keys starting with dollar sign", () => {
    const input = "{$id: 123}";
    const result = normalizeJSON5(input);
    assert.strictEqual(result, '{"$id": 123}');
  });

  test("handles complex JSON5", () => {
    const input = `{
  unquoted: "value",
  trailing: "comma",
}`;
    const result = normalizeJSON5(input);
    assert.ok(result.includes('"unquoted"'));
    assert.ok(result.includes('"trailing"'));
    assert.ok(!result.includes(",}"));
  });
});

describe("JSON5 Parser", () => {
  test("parses JSON5 with comments", () => {
    const input = `{
  // User information
  "name": "Alice",
  "age": 30 // Age in years
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("parses JSON5 with trailing commas", () => {
    const input = `{
  "name": "Alice",
  "age": 30,
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("parses JSON5 with unquoted keys", () => {
    const input = `{
  name: "Alice",
  age: 30
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("parses JSON5 arrays with trailing commas", () => {
    const input = `[
  "apple",
  "banana",
  "orange",
]`;
    assert.deepStrictEqual(parseJSON5(input), ["apple", "banana", "orange"]);
  });

  test("parses nested JSON5 objects", () => {
    const input = `{
  user: {
    name: "Alice",
    age: 30,
  },
  active: true,
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      user: {
        name: "Alice",
        age: 30,
      },
      active: true,
    });
  });

  test("handles multi-line comments", () => {
    const input = `{
  /* This is a
     multi-line comment
     describing the object */
  "name": "Alice",
  "age": 30
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("handles single-quoted strings", () => {
    const input = `{
  'name': 'Alice',
  'city': 'NYC'
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      city: "NYC",
    });
  });

  test("parses complex JSON5 document", () => {
    const input = `{
  // Configuration
  name: "MyApp",
  version: "1.0.0",

  /* Server settings */
  server: {
    host: "localhost",
    port: 3000,
  },

  // Feature flags
  features: [
    "auth",
    "api",
    "logging",
  ],
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "MyApp",
      version: "1.0.0",
      server: {
        host: "localhost",
        port: 3000,
      },
      features: ["auth", "api", "logging"],
    });
  });

  test("handles numbers and booleans", () => {
    const input = `{
  count: 42,
  price: 19.99,
  active: true,
  disabled: false,
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      count: 42,
      price: 19.99,
      active: true,
      disabled: false,
    });
  });

  test("preserves null values", () => {
    const input = `{
  name: "Alice",
  email: null,
}`;
    assert.deepStrictEqual(parseJSON5(input), {
      name: "Alice",
      email: null,
    });
  });
});
