import { describe, test, expect } from "bun:test";
import { parseENV, parseENVValue } from "../../src/formats/env";

describe("parseENVValue", () => {
  test("parses quoted strings", () => {
    expect(parseENVValue('"hello"')).toBe("hello");
    expect(parseENVValue("'world'")).toBe("world");
  });

  test("parses boolean values", () => {
    expect(parseENVValue("true")).toBe(true);
    expect(parseENVValue("false")).toBe(false);
  });

  test("parses null", () => {
    expect(parseENVValue("null")).toBe(null);
  });

  test("parses numbers", () => {
    expect(parseENVValue("42")).toBe(42);
    expect(parseENVValue("3.14")).toBe(3.14);
    expect(parseENVValue("-10")).toBe(-10);
  });

  test("parses unquoted strings", () => {
    expect(parseENVValue("production")).toBe("production");
    expect(parseENVValue("localhost:3000")).toBe("localhost:3000");
  });
});

describe("parseENV", () => {
  test("parses basic key-value pairs", () => {
    const input = `
DATABASE_URL=postgres://localhost/mydb
PORT=3000
DEBUG=true
`;
    const result = parseENV(input);
    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: 3000,
      DEBUG: true,
    });
  });

  test("handles comments", () => {
    const input = `
# This is a comment
DATABASE_URL=postgres://localhost/mydb
PORT=3000 # Inline comment
# Another comment
DEBUG=true
`;
    const result = parseENV(input);
    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: 3000,
      DEBUG: true,
    });
  });

  test("handles export prefix", () => {
    const input = `
export DATABASE_URL=postgres://localhost/mydb
export PORT=3000
`;
    const result = parseENV(input);
    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: 3000,
    });
  });

  test("handles quoted values", () => {
    const input = `
APP_NAME="My App"
API_KEY='secret-key-123'
MESSAGE="Hello World"
`;
    const result = parseENV(input);
    expect(result).toEqual({
      APP_NAME: "My App",
      API_KEY: "secret-key-123",
      MESSAGE: "Hello World",
    });
  });

  test("handles empty lines", () => {
    const input = `
DATABASE_URL=postgres://localhost/mydb

PORT=3000

DEBUG=true
`;
    const result = parseENV(input);
    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: 3000,
      DEBUG: true,
    });
  });

  test("handles mixed value types", () => {
    const input = `
STRING_VAL=hello
NUMBER_VAL=42
FLOAT_VAL=3.14
BOOL_TRUE=true
BOOL_FALSE=false
NULL_VAL=null
`;
    const result = parseENV(input);
    expect(result).toEqual({
      STRING_VAL: "hello",
      NUMBER_VAL: 42,
      FLOAT_VAL: 3.14,
      BOOL_TRUE: true,
      BOOL_FALSE: false,
      NULL_VAL: null,
    });
  });

  test("handles URLs and special characters", () => {
    const input = `
DATABASE_URL=postgres://user:pass@localhost:5432/db
REDIS_URL=redis://:password@127.0.0.1:6379/0
API_ENDPOINT=https://api.example.com/v1
`;
    const result = parseENV(input);
    expect(result).toEqual({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      REDIS_URL: "redis://:password@127.0.0.1:6379/0",
      API_ENDPOINT: "https://api.example.com/v1",
    });
  });
});
