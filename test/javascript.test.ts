import { describe, test, expect } from "bun:test";
import { stripJSComments, parseJavaScript } from "../src/parsers/javascript";

describe("JavaScript Comment Stripper", () => {
  test("strips single-line comments", () => {
    const input = `const name = "Alice"; // This is a comment`;
    const result = stripJSComments(input);
    expect(result).toContain('const name = "Alice";');
    expect(result).not.toContain("// This is a comment");
  });

  test("strips multi-line comments", () => {
    const input = `/* This is a
multi-line comment */
const name = "Alice";`;
    const result = stripJSComments(input);
    expect(result).not.toContain("/*");
    expect(result).not.toContain("*/");
    expect(result).toContain('const name = "Alice"');
  });

  test("preserves URLs in strings", () => {
    const input = `const url = "https://example.com//path";`;
    const result = stripJSComments(input);
    expect(result).toContain("//path");
  });

  test("preserves comment syntax in double-quoted strings", () => {
    const input = `const comment = "This /* is not */ a comment";`;
    const result = stripJSComments(input);
    expect(result).toContain("/* is not */");
  });

  test("preserves comment syntax in single-quoted strings", () => {
    const input = `const comment = 'This // is not a comment';`;
    const result = stripJSComments(input);
    expect(result).toContain("// is not");
  });

  test("preserves comment syntax in template literals", () => {
    const input = "const comment = `This // is not a comment`;";
    const result = stripJSComments(input);
    expect(result).toContain("// is not");
  });

  test("handles escaped quotes in strings", () => {
    const input = `const quote = "She said \\"hello\\"";`;
    const result = stripJSComments(input);
    expect(result).toContain('\\"hello\\"');
  });

  test("handles escaped quotes in single-quoted strings", () => {
    const input = `const quote = 'She said \\'hello\\'';`;
    const result = stripJSComments(input);
    expect(result).toContain("\\'hello\\'");
  });

  test("strips multiple comment types", () => {
    const input = `// Single line comment
const name = "Alice";
/* Multi-line
   comment */
const age = 30; // Inline comment`;
    const result = stripJSComments(input);
    expect(result).not.toContain("//");
    expect(result).not.toContain("/*");
    expect(result).toContain('const name = "Alice"');
    expect(result).toContain("const age = 30;");
  });

  test("handles consecutive single-line comments", () => {
    const input = `// Comment 1
// Comment 2
// Comment 3
const value = 42;`;
    const result = stripJSComments(input);
    expect(result).not.toContain("// Comment");
    expect(result).toContain("const value = 42;");
  });

  test("handles nested multi-line comment-like syntax", () => {
    const input = `const regex = /\\/\\*/;`;
    const result = stripJSComments(input);
    expect(result).toContain("const regex = /\\/\\*/;");
  });

  test("preserves empty strings", () => {
    const input = `const empty = "";`;
    const result = stripJSComments(input);
    expect(result).toContain('const empty = "";');
  });

  test("handles multiple strings on same line", () => {
    const input = `const a = "first"; const b = "second"; // comment`;
    const result = stripJSComments(input);
    expect(result).toContain('"first"');
    expect(result).toContain('"second"');
    expect(result).not.toContain("// comment");
  });
});

describe("JavaScript Parser", () => {
  test("parses simple export default object", () => {
    const input = `export default { name: "Alice", age: 30 };`;
    const result = parseJavaScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses export default array", () => {
    const input = `export default ["apple", "banana", "orange"];`;
    const result = parseJavaScript(input);
    expect(result).toEqual(["apple", "banana", "orange"]);
  });

  test("parses export default with comments", () => {
    const input = `// This is a configuration
export default {
  name: "Alice", // User name
  age: 30 // User age
};`;
    const result = parseJavaScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses export default with multi-line comments", () => {
    const input = `/* Configuration file
for user settings */
export default {
  name: "Alice",
  age: 30
};`;
    const result = parseJavaScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses nested objects", () => {
    const input = `export default {
  user: {
    name: "Alice",
    age: 30
  },
  settings: {
    theme: "dark"
  }
};`;
    const result = parseJavaScript(input);
    expect(result).toEqual({
      user: { name: "Alice", age: 30 },
      settings: { theme: "dark" },
    });
  });

  test("parses numbers and booleans", () => {
    const input = `export default {
  count: 42,
  price: 19.99,
  active: true,
  disabled: false,
  nothing: null
};`;
    const result = parseJavaScript(input);
    expect(result).toEqual({
      count: 42,
      price: 19.99,
      active: true,
      disabled: false,
      nothing: null,
    });
  });

  test("parses arrays with various types", () => {
    const input = `export default [
  "string",
  42,
  true,
  null,
  { nested: "object" }
];`;
    const result = parseJavaScript(input);
    expect(result).toEqual(["string", 42, true, null, { nested: "object" }]);
  });

  test("handles URLs in string values", () => {
    const input = `export default {
  url: "https://example.com//path",
  comment: "This // is not a comment"
};`;
    const result = parseJavaScript(input);
    expect(result).toEqual({
      url: "https://example.com//path",
      comment: "This // is not a comment",
    });
  });
});
