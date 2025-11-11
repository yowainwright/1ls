import { describe, test, expect } from "bun:test";
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
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  test("parses falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  test("returns undefined for non-boolean values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("1")).toBeUndefined();
    expect(parseBooleanValue("")).toBeUndefined();
  });
});

describe("parseNullValue", () => {
  test("parses null values", () => {
    expect(parseNullValue("null")).toBeNull();
    expect(parseNullValue("~")).toBeNull();
    expect(parseNullValue("")).toBeNull();
  });

  test("returns undefined for non-null values", () => {
    expect(parseNullValue("false")).toBeUndefined();
    expect(parseNullValue("0")).toBeUndefined();
    expect(parseNullValue("undefined")).toBeUndefined();
  });
});

describe("tryParseNumber", () => {
  test("parses integer numbers", () => {
    expect(tryParseNumber("42")).toBe(42);
    expect(tryParseNumber("-10")).toBe(-10);
    expect(tryParseNumber("0")).toBe(0);
  });

  test("parses floating point numbers", () => {
    expect(tryParseNumber("3.14")).toBe(3.14);
    expect(tryParseNumber("-0.5")).toBe(-0.5);
  });

  test("returns undefined for empty string", () => {
    expect(tryParseNumber("")).toBeUndefined();
  });

  test("returns undefined for non-numeric strings", () => {
    expect(tryParseNumber("abc")).toBeUndefined();
    expect(tryParseNumber("12abc")).toBeUndefined();
  });
});

describe("countQuotes", () => {
  test("counts double quotes in string", () => {
    expect(countQuotes('hello "world"', 13)).toBe(2);
    expect(countQuotes('"test"', 6)).toBe(2);
  });

  test("counts quotes up to endPos", () => {
    expect(countQuotes('hello "world" test', 6)).toBe(0);
    expect(countQuotes('hello "world" test', 13)).toBe(2);
  });

  test("returns 0 for strings without quotes", () => {
    expect(countQuotes("hello world", 11)).toBe(0);
  });
});

describe("isQuoteBalanced", () => {
  test("returns true for even quote counts", () => {
    expect(isQuoteBalanced(0)).toBe(true);
    expect(isQuoteBalanced(2)).toBe(true);
    expect(isQuoteBalanced(4)).toBe(true);
  });

  test("returns false for odd quote counts", () => {
    expect(isQuoteBalanced(1)).toBe(false);
    expect(isQuoteBalanced(3)).toBe(false);
    expect(isQuoteBalanced(5)).toBe(false);
  });
});

describe("type guard functions", () => {
  test("isTruthyValue", () => {
    expect(isTruthyValue("true")).toBe(true);
    expect(isTruthyValue("yes")).toBe(true);
    expect(isTruthyValue("on")).toBe(true);
    expect(isTruthyValue("false")).toBe(false);
    expect(isTruthyValue("maybe")).toBe(false);
  });

  test("isFalsyValue", () => {
    expect(isFalsyValue("false")).toBe(true);
    expect(isFalsyValue("no")).toBe(true);
    expect(isFalsyValue("off")).toBe(true);
    expect(isFalsyValue("true")).toBe(false);
    expect(isFalsyValue("maybe")).toBe(false);
  });

  test("isNullValue", () => {
    expect(isNullValue("null")).toBe(true);
    expect(isNullValue("~")).toBe(true);
    expect(isNullValue("")).toBe(true);
    expect(isNullValue("false")).toBe(false);
    expect(isNullValue("0")).toBe(false);
  });
});
