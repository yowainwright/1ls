import { describe, test, expect } from "bun:test";
import { TERMINAL_EXAMPLES, SANDPACK_OPTIONS } from "../constants";

describe("TERMINAL_EXAMPLES", () => {
  test("has at least one entry", () => {
    expect(TERMINAL_EXAMPLES.length).toBeGreaterThan(0);
  });

  test("each example has required properties", () => {
    TERMINAL_EXAMPLES.forEach((example) => {
      expect(typeof example.title).toBe("string");
      expect(typeof example.description).toBe("string");
      expect(typeof example.command).toBe("string");
      expect(typeof example.input).toBe("string");
      expect(typeof example.output).toBe("string");
    });
  });

  test("each example has non-empty strings", () => {
    TERMINAL_EXAMPLES.forEach((example) => {
      expect(example.title.length).toBeGreaterThan(0);
      expect(example.command.length).toBeGreaterThan(0);
      expect(example.input.length).toBeGreaterThan(0);
    });
  });
});

describe("SANDPACK_OPTIONS", () => {
  test("has showNavigator property", () => {
    expect("showNavigator" in SANDPACK_OPTIONS).toBe(true);
  });

  test("has showTabs property", () => {
    expect("showTabs" in SANDPACK_OPTIONS).toBe(true);
  });

  test("has showLineNumbers property", () => {
    expect("showLineNumbers" in SANDPACK_OPTIONS).toBe(true);
  });

  test("has editorHeight as a positive number", () => {
    expect(typeof SANDPACK_OPTIONS.editorHeight).toBe("number");
    expect(SANDPACK_OPTIONS.editorHeight).toBeGreaterThan(0);
  });

  test("readOnly is true", () => {
    expect(SANDPACK_OPTIONS.readOnly).toBe(true);
  });
});
