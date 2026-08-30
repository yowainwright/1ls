import { test } from "node:test";
import assert from "node:assert/strict";
import { parseENV } from "../../src/formats/env.ts";

test("parseENV strips comments after closed quotes", () => {
  const input = 'KEY="value" # this is a comment';
  const result = parseENV(input);
  assert.strictEqual(result.KEY, "value");
});

test("parseENV handles mixed quotes", () => {
  const input = `KEY1="value1"
KEY2='value2'
KEY3=value3`;
  const result = parseENV(input);
  assert.strictEqual(result.KEY1, "value1");
  assert.strictEqual(result.KEY2, "value2");
  assert.strictEqual(result.KEY3, "value3");
});

test("parseENV handles export prefix", () => {
  const input = 'export KEY="value"';
  const result = parseENV(input);
  assert.strictEqual(result.KEY, "value");
});

test("parseENV handles empty lines and comments", () => {
  const input = `# comment
KEY1=value1

# another comment
KEY2=value2`;
  const result = parseENV(input);
  assert.strictEqual(result.KEY1, "value1");
  assert.strictEqual(result.KEY2, "value2");
});

test("parseENV handles boolean values", () => {
  const input = `TRUE_VAL=true
FALSE_VAL=false`;
  const result = parseENV(input);
  assert.strictEqual(result.TRUE_VAL, true);
  assert.strictEqual(result.FALSE_VAL, false);
});

test("parseENV handles null values", () => {
  const input = "NULL_VAL=null";
  const result = parseENV(input);
  assert.strictEqual(result.NULL_VAL, null);
});

test("parseENV handles number values", () => {
  const input = `INT_VAL=42
FLOAT_VAL=3.14`;
  const result = parseENV(input);
  assert.strictEqual(result.INT_VAL, 42);
  assert.strictEqual(result.FLOAT_VAL, 3.14);
});

test("parseENV handles line without equals sign", () => {
  const input = `KEY=value
INVALID_LINE
OTHER=other`;
  const result = parseENV(input);
  assert.strictEqual(result.KEY, "value");
  assert.strictEqual(result.OTHER, "other");
  assert.strictEqual(result.INVALID_LINE, undefined);
});
