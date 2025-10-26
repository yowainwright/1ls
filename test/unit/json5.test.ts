import { describe, test, expect } from "bun:test";
import { parseJSON5, stripJSON5Comments, normalizeJSON5 } from "../../src/parsers/json5";

describe("JSON5 Comment Stripper", () => {
  test("strips single-line comments", () => {
    const input = '{\n  // This is a comment\n  "name": "Alice"\n}';
    const result = stripJSON5Comments(input);
    expect(result).not.toContain("//");
    expect(result).toContain('"name"');
  });

  test("strips multi-line comments", () => {
    const input = '{\n  /* This is a\n     multi-line comment */\n  "name": "Alice"\n}';
    const result = stripJSON5Comments(input);
    expect(result).not.toContain("/*");
    expect(result).not.toContain("*/");
    expect(result).toContain('"name"');
  });

  test("preserves comments in strings", () => {
    const input = '{"url": "https://example.com//path"}';
    const result = stripJSON5Comments(input);
    expect(result).toContain("//path");
  });

  test("preserves multi-line comment syntax in strings", () => {
    const input = '{"comment": "This /* is not */ a comment"}';
    const result = stripJSON5Comments(input);
    expect(result).toContain("/* is not */");
  });

  test("handles escaped quotes in strings", () => {
    const input = '{"quote": "She said \\"hello\\""}';
    const result = stripJSON5Comments(input);
    expect(result).toContain('\\"hello\\"');
  });

  test("handles single-quoted strings", () => {
    const input = "{'name': 'Alice'}";
    const result = stripJSON5Comments(input);
    expect(result).toBe("{'name': 'Alice'}");
  });

  test("handles backticks in values", () => {
    const input = '{"template": "value with backtick"}';
    const result = stripJSON5Comments(input);
    expect(result).toContain("value with backtick");
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
    expect(result).not.toContain("//");
    expect(result).not.toContain("/*");
    expect(result).toContain('"name"');
    expect(result).toContain('"age"');
  });
});

describe("JSON5 Normalizer", () => {
  test("removes trailing commas in objects", () => {
    const input = '{"name": "Alice", "age": 30,}';
    const result = normalizeJSON5(input);
    expect(result).toBe('{"name": "Alice", "age": 30}');
  });

  test("removes trailing commas in arrays", () => {
    const input = '[1, 2, 3,]';
    const result = normalizeJSON5(input);
    expect(result).toBe('[1, 2, 3]');
  });

  test("quotes unquoted keys", () => {
    const input = '{name: "Alice", age: 30}';
    const result = normalizeJSON5(input);
    expect(result).toBe('{"name": "Alice", "age": 30}');
  });

  test("preserves already quoted keys", () => {
    const input = '{"name": "Alice"}';
    const result = normalizeJSON5(input);
    expect(result).toBe('{"name": "Alice"}');
  });

  test("handles keys with underscores", () => {
    const input = '{first_name: "Alice", last_name: "Smith"}';
    const result = normalizeJSON5(input);
    expect(result).toBe('{"first_name": "Alice", "last_name": "Smith"}');
  });

  test("handles keys starting with dollar sign", () => {
    const input = '{$id: 123}';
    const result = normalizeJSON5(input);
    expect(result).toBe('{"$id": 123}');
  });

  test("handles complex JSON5", () => {
    const input = `{
  unquoted: "value",
  trailing: "comma",
}`;
    const result = normalizeJSON5(input);
    expect(result).toContain('"unquoted"');
    expect(result).toContain('"trailing"');
    expect(result).not.toContain(',}');
  });
});

describe("JSON5 Parser", () => {
  test("parses JSON5 with comments", () => {
    const input = `{
  // User information
  "name": "Alice",
  "age": 30 // Age in years
}`;
    expect(parseJSON5(input)).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  test("parses JSON5 with trailing commas", () => {
    const input = `{
  "name": "Alice",
  "age": 30,
}`;
    expect(parseJSON5(input)).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  test("parses JSON5 with unquoted keys", () => {
    const input = `{
  name: "Alice",
  age: 30
}`;
    expect(parseJSON5(input)).toEqual({
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
    expect(parseJSON5(input)).toEqual(["apple", "banana", "orange"]);
  });

  test("parses nested JSON5 objects", () => {
    const input = `{
  user: {
    name: "Alice",
    age: 30,
  },
  active: true,
}`;
    expect(parseJSON5(input)).toEqual({
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
    expect(parseJSON5(input)).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  test("handles single-quoted strings", () => {
    const input = `{
  'name': 'Alice',
  'city': 'NYC'
}`;
    expect(parseJSON5(input)).toEqual({
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
    expect(parseJSON5(input)).toEqual({
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
    expect(parseJSON5(input)).toEqual({
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
    expect(parseJSON5(input)).toEqual({
      name: "Alice",
      email: null,
    });
  });
});
