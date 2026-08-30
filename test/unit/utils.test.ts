import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { escapeRegExp } from "../../src/shortcuts/index.ts";

describe("escapeRegExp", () => {
  test("escapes dot character", () => {
    assert.strictEqual(escapeRegExp("file.txt"), "file\\.txt");
  });

  test("escapes asterisk character", () => {
    assert.strictEqual(escapeRegExp("*.js"), "\\*\\.js");
  });

  test("escapes plus character", () => {
    assert.strictEqual(escapeRegExp("a+b"), "a\\+b");
  });

  test("escapes question mark character", () => {
    assert.strictEqual(escapeRegExp("a?b"), "a\\?b");
  });

  test("escapes caret character", () => {
    assert.strictEqual(escapeRegExp("^start"), "\\^start");
  });

  test("escapes dollar sign character", () => {
    assert.strictEqual(escapeRegExp("end$"), "end\\$");
  });

  test("escapes curly braces", () => {
    assert.strictEqual(escapeRegExp("{min,max}"), "\\{min,max\\}");
  });

  test("escapes parentheses", () => {
    assert.strictEqual(escapeRegExp("(group)"), "\\(group\\)");
  });

  test("escapes pipe character", () => {
    assert.strictEqual(escapeRegExp("a|b"), "a\\|b");
  });

  test("escapes square brackets", () => {
    assert.strictEqual(escapeRegExp("[abc]"), "\\[abc\\]");
  });

  test("escapes backslash character", () => {
    assert.strictEqual(escapeRegExp("\\"), "\\\\");
  });

  test("escapes multiple special characters", () => {
    assert.strictEqual(escapeRegExp(".*+?^${}()|[]\\"), "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });

  test("does not modify regular characters", () => {
    assert.strictEqual(escapeRegExp("abc123"), "abc123");
  });

  test("handles mixed regular and special characters", () => {
    assert.strictEqual(escapeRegExp("file*.{js,ts}"), "file\\*\\.\\{js,ts\\}");
  });

  test("handles empty string", () => {
    assert.strictEqual(escapeRegExp(""), "");
  });

  test("escaped string works in RegExp", () => {
    const input = "test.file*.txt";
    const escaped = escapeRegExp(input);
    const regex = new RegExp(escaped);

    assert.strictEqual(regex.test("test.file*.txt"), true);
    assert.strictEqual(regex.test("testXfileXtxt"), false);
  });

  test("prevents regex injection", () => {
    const maliciousInput = ".*";
    const escaped = escapeRegExp(maliciousInput);
    const regex = new RegExp(escaped);

    assert.strictEqual(regex.test(".*"), true);
    assert.strictEqual(regex.test("anything"), false);
  });

  test("handles URL patterns safely", () => {
    const url = "https://example.com/path?query=value";
    const escaped = escapeRegExp(url);
    const regex = new RegExp(escaped);

    assert.strictEqual(regex.test("https://example.com/path?query=value"), true);
    assert.strictEqual(regex.test("https://example.com/pathXqueryXvalue"), false);
  });
});
