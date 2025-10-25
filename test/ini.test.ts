import { describe, test, expect } from "bun:test";
import { parseINI, parseINIValue } from "../src/parsers/ini";

describe("INI Value Parser", () => {
  test("parses string values", () => {
    expect(parseINIValue("hello")).toBe("hello");
    expect(parseINIValue("  world  ")).toBe("world");
  });

  test("parses quoted strings", () => {
    expect(parseINIValue('"hello world"')).toBe("hello world");
    expect(parseINIValue("'hello world'")).toBe("hello world");
  });

  test("parses boolean values", () => {
    expect(parseINIValue("true")).toBe(true);
    expect(parseINIValue("false")).toBe(false);
  });

  test("parses numeric values", () => {
    expect(parseINIValue("42")).toBe(42);
    expect(parseINIValue("-10")).toBe(-10);
    expect(parseINIValue("3.14")).toBe(3.14);
    expect(parseINIValue("-2.5")).toBe(-2.5);
  });

  test("preserves non-numeric strings", () => {
    expect(parseINIValue("test123")).toBe("test123");
    expect(parseINIValue("value-with-dash")).toBe("value-with-dash");
  });
});

describe("INI Parser", () => {
  test("parses simple key-value pairs", () => {
    const input = "name=Alice\nage=30\nactive=true";
    expect(parseINI(input)).toEqual({
      name: "Alice",
      age: 30,
      active: true,
    });
  });

  test("parses key-value pairs with spaces", () => {
    const input = "name = Alice\nage = 30\ncity = New York";
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
      "My Section": { key: "value" },
    });
  });

  test("handles values with equals signs", () => {
    const input = "url=https://example.com?param=value";
    expect(parseINI(input)).toEqual({
      url: "https://example.com?param=value",
    });
  });

  test("parses boolean false", () => {
    const input = "enabled=false\ndisabled=false";
    expect(parseINI(input)).toEqual({
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
    expect(parseINI(input)).toEqual({
      global_key: "global_value",
      section: {
        local_key: "local_value",
      },
    });
  });
});
