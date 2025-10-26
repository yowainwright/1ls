import { describe, test, expect } from "bun:test";
import { escapeRegExp } from "../../src/utils";

describe("escapeRegExp", () => {
  test("escapes dot character", () => {
    expect(escapeRegExp("file.txt")).toBe("file\\.txt");
  });

  test("escapes asterisk character", () => {
    expect(escapeRegExp("*.js")).toBe("\\*\\.js");
  });

  test("escapes plus character", () => {
    expect(escapeRegExp("a+b")).toBe("a\\+b");
  });

  test("escapes question mark character", () => {
    expect(escapeRegExp("a?b")).toBe("a\\?b");
  });

  test("escapes caret character", () => {
    expect(escapeRegExp("^start")).toBe("\\^start");
  });

  test("escapes dollar sign character", () => {
    expect(escapeRegExp("end$")).toBe("end\\$");
  });

  test("escapes curly braces", () => {
    expect(escapeRegExp("{min,max}")).toBe("\\{min,max\\}");
  });

  test("escapes parentheses", () => {
    expect(escapeRegExp("(group)")).toBe("\\(group\\)");
  });

  test("escapes pipe character", () => {
    expect(escapeRegExp("a|b")).toBe("a\\|b");
  });

  test("escapes square brackets", () => {
    expect(escapeRegExp("[abc]")).toBe("\\[abc\\]");
  });

  test("escapes backslash character", () => {
    expect(escapeRegExp("\\")).toBe("\\\\");
  });

  test("escapes multiple special characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });

  test("does not modify regular characters", () => {
    expect(escapeRegExp("abc123")).toBe("abc123");
  });

  test("handles mixed regular and special characters", () => {
    expect(escapeRegExp("file*.{js,ts}")).toBe("file\\*\\.\\{js,ts\\}");
  });

  test("handles empty string", () => {
    expect(escapeRegExp("")).toBe("");
  });

  test("escaped string works in RegExp", () => {
    const input = "test.file*.txt";
    const escaped = escapeRegExp(input);
    const regex = new RegExp(escaped);

    expect(regex.test("test.file*.txt")).toBe(true);
    expect(regex.test("testXfileXtxt")).toBe(false);
  });

  test("prevents regex injection", () => {
    const maliciousInput = ".*";
    const escaped = escapeRegExp(maliciousInput);
    const regex = new RegExp(escaped);

    expect(regex.test(".*")).toBe(true);
    expect(regex.test("anything")).toBe(false);
  });

  test("handles URL patterns safely", () => {
    const url = "https://example.com/path?query=value";
    const escaped = escapeRegExp(url);
    const regex = new RegExp(escaped);

    expect(regex.test("https://example.com/path?query=value")).toBe(true);
    expect(regex.test("https://example.com/pathXqueryXvalue")).toBe(false);
  });
});
