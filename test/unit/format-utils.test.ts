import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  parseBooleanValue,
  parseNullValue,
  tryParseNumber,
  countQuotes,
  isQuoteBalanced,
  isTruthyValue,
  isFalsyValue,
  isNullValue,
} from "../../src/formats/utils";

describe("parseBooleanValue", () => {
  test("parses truthy values", () => {
    assert.strictEqual(parseBooleanValue("true"), true);
    assert.strictEqual(parseBooleanValue("yes"), true);
    assert.strictEqual(parseBooleanValue("on"), true);
  });

  test("parses falsy values", () => {
    assert.strictEqual(parseBooleanValue("false"), false);
    assert.strictEqual(parseBooleanValue("no"), false);
    assert.strictEqual(parseBooleanValue("off"), false);
  });

  test("returns undefined for non-boolean values", () => {
    assert.strictEqual(parseBooleanValue("maybe"), undefined);
    assert.strictEqual(parseBooleanValue("1"), undefined);
    assert.strictEqual(parseBooleanValue(""), undefined);
  });
});

describe("parseNullValue", () => {
  test("parses null values", () => {
    assert.strictEqual(parseNullValue("null"), null);
    assert.strictEqual(parseNullValue("~"), null);
    assert.strictEqual(parseNullValue(""), null);
  });

  test("returns undefined for non-null values", () => {
    assert.strictEqual(parseNullValue("false"), undefined);
    assert.strictEqual(parseNullValue("0"), undefined);
    assert.strictEqual(parseNullValue("undefined"), undefined);
  });
});

describe("tryParseNumber", () => {
  test("parses integer numbers", () => {
    assert.strictEqual(tryParseNumber("42"), 42);
    assert.strictEqual(tryParseNumber("-10"), -10);
    assert.strictEqual(tryParseNumber("0"), 0);
  });

  test("parses floating point numbers", () => {
    assert.strictEqual(tryParseNumber("3.14"), 3.14);
    assert.strictEqual(tryParseNumber("-0.5"), -0.5);
  });

  test("returns undefined for empty string", () => {
    assert.strictEqual(tryParseNumber(""), undefined);
  });

  test("returns undefined for non-numeric strings", () => {
    assert.strictEqual(tryParseNumber("abc"), undefined);
    assert.strictEqual(tryParseNumber("12abc"), undefined);
  });
});

describe("countQuotes", () => {
  test("counts double quotes in string", () => {
    assert.strictEqual(countQuotes('hello "world"', 13), 2);
    assert.strictEqual(countQuotes('"test"', 6), 2);
  });

  test("counts quotes up to endPos", () => {
    assert.strictEqual(countQuotes('hello "world" test', 6), 0);
    assert.strictEqual(countQuotes('hello "world" test', 13), 2);
  });

  test("returns 0 for strings without quotes", () => {
    assert.strictEqual(countQuotes("hello world", 11), 0);
  });
});

describe("isQuoteBalanced", () => {
  test("returns true for even quote counts", () => {
    assert.strictEqual(isQuoteBalanced(0), true);
    assert.strictEqual(isQuoteBalanced(2), true);
    assert.strictEqual(isQuoteBalanced(4), true);
  });

  test("returns false for odd quote counts", () => {
    assert.strictEqual(isQuoteBalanced(1), false);
    assert.strictEqual(isQuoteBalanced(3), false);
    assert.strictEqual(isQuoteBalanced(5), false);
  });
});

describe("type guard functions", () => {
  test("isTruthyValue", () => {
    assert.strictEqual(isTruthyValue("true"), true);
    assert.strictEqual(isTruthyValue("yes"), true);
    assert.strictEqual(isTruthyValue("on"), true);
    assert.strictEqual(isTruthyValue("false"), false);
    assert.strictEqual(isTruthyValue("maybe"), false);
  });

  test("isFalsyValue", () => {
    assert.strictEqual(isFalsyValue("false"), true);
    assert.strictEqual(isFalsyValue("no"), true);
    assert.strictEqual(isFalsyValue("off"), true);
    assert.strictEqual(isFalsyValue("true"), false);
    assert.strictEqual(isFalsyValue("maybe"), false);
  });

  test("isNullValue", () => {
    assert.strictEqual(isNullValue("null"), true);
    assert.strictEqual(isNullValue("~"), true);
    assert.strictEqual(isNullValue(""), true);
    assert.strictEqual(isNullValue("false"), false);
    assert.strictEqual(isNullValue("0"), false);
  });
});
