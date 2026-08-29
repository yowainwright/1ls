import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseENV, parseENVValue } from "../../src/formats/env.ts";

describe("parseENVValue", () => {
  test("parses quoted strings", () => {
    assert.strictEqual(parseENVValue('"hello"'), "hello");
    assert.strictEqual(parseENVValue("'world'"), "world");
  });

  test("parses boolean values", () => {
    assert.strictEqual(parseENVValue("true"), true);
    assert.strictEqual(parseENVValue("false"), false);
  });

  test("parses null", () => {
    assert.strictEqual(parseENVValue("null"), null);
  });

  test("parses numbers", () => {
    assert.strictEqual(parseENVValue("42"), 42);
    assert.strictEqual(parseENVValue("3.14"), 3.14);
    assert.strictEqual(parseENVValue("-10"), -10);
  });

  test("parses unquoted strings", () => {
    assert.strictEqual(parseENVValue("production"), "production");
    assert.strictEqual(parseENVValue("localhost:3000"), "localhost:3000");
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
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
    assert.deepStrictEqual(result, {
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      REDIS_URL: "redis://:password@127.0.0.1:6379/0",
      API_ENDPOINT: "https://api.example.com/v1",
    });
  });
});
