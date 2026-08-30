import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseINI, parseINIValue } from "../../src/formats/ini";

describe("INI Value Parser", () => {
  test("parses string values", () => {
    assert.strictEqual(parseINIValue("hello"), "hello");
    assert.strictEqual(parseINIValue("  world  "), "world");
  });

  test("parses quoted strings", () => {
    assert.strictEqual(parseINIValue('"hello world"'), "hello world");
    assert.strictEqual(parseINIValue("'hello world'"), "hello world");
  });

  test("parses boolean values", () => {
    assert.strictEqual(parseINIValue("true"), true);
    assert.strictEqual(parseINIValue("false"), false);
  });

  test("parses numeric values", () => {
    assert.strictEqual(parseINIValue("42"), 42);
    assert.strictEqual(parseINIValue("-10"), -10);
    assert.strictEqual(parseINIValue("3.14"), 3.14);
    assert.strictEqual(parseINIValue("-2.5"), -2.5);
  });

  test("preserves non-numeric strings", () => {
    assert.strictEqual(parseINIValue("test123"), "test123");
    assert.strictEqual(parseINIValue("value-with-dash"), "value-with-dash");
  });
});

describe("INI Parser", () => {
  test("parses simple key-value pairs", () => {
    const input = "name=Alice\nage=30\nactive=true";
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
      active: true,
    });
  });

  test("parses key-value pairs with spaces", () => {
    const input = "name = Alice\nage = 30\ncity = New York";
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
      city: "New York",
    });
  });

  test("parses sections", () => {
    const input = `
[user]
name=Alice
age=30

[database]
host=localhost
port=5432
    `;
    assert.deepStrictEqual(parseINI(input), {
      user: {
        name: "Alice",
        age: 30,
      },
      database: {
        host: "localhost",
        port: 5432,
      },
    });
  });

  test("parses quoted values", () => {
    const input = `
name="Alice Smith"
city='New York'
description="A \"quoted\" value"
    `;
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice Smith",
      city: "New York",
      description: 'A "quoted" value',
    });
  });

  test("handles comments with semicolon", () => {
    const input = `
; This is a comment
name=Alice ; inline comment
age=30
    `;
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("handles comments with hash", () => {
    const input = `
# This is a comment
name=Alice # inline comment
age=30
    `;
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
    });
  });

  test("handles mixed comment styles", () => {
    const input = `
; Semicolon comment
name=Alice
# Hash comment
age=30
city=NYC ; inline semicolon
country=USA # inline hash
    `;
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
      city: "NYC",
      country: "USA",
    });
  });

  test("handles empty lines", () => {
    const input = `
name=Alice

age=30


city=NYC
    `;
    assert.deepStrictEqual(parseINI(input), {
      name: "Alice",
      age: 30,
      city: "NYC",
    });
  });

  test("parses multiple sections", () => {
    const input = `
[section1]
key1=value1

[section2]
key2=value2

[section3]
key3=value3
    `;
    assert.deepStrictEqual(parseINI(input), {
      section1: { key1: "value1" },
      section2: { key2: "value2" },
      section3: { key3: "value3" },
    });
  });

  test("handles section with spaces in name", () => {
    const input = `
[My Section]
key=value
    `;
    assert.deepStrictEqual(parseINI(input), {
      "My Section": { key: "value" },
    });
  });

  test("handles values with equals signs", () => {
    const input = "url=https://example.com?param=value";
    assert.deepStrictEqual(parseINI(input), {
      url: "https://example.com?param=value",
    });
  });

  test("parses boolean false", () => {
    const input = "enabled=false\ndisabled=false";
    assert.deepStrictEqual(parseINI(input), {
      enabled: false,
      disabled: false,
    });
  });

  test("handles global keys before sections", () => {
    const input = `
global_key=global_value

[section]
local_key=local_value
    `;
    assert.deepStrictEqual(parseINI(input), {
      global_key: "global_value",
      section: {
        local_key: "local_value",
      },
    });
  });
});
