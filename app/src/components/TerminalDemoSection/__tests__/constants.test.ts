import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TERMINAL_EXAMPLES, SANDPACK_OPTIONS } from "../constants";

describe("TERMINAL_EXAMPLES", () => {
  test("has at least one entry", () => {
    assert.ok(TERMINAL_EXAMPLES.length > 0);
  });

  test("each example has required properties", () => {
    TERMINAL_EXAMPLES.forEach((example) => {
      assert.strictEqual(typeof example.title, "string");
      assert.strictEqual(typeof example.description, "string");
      assert.strictEqual(typeof example.command, "string");
      assert.strictEqual(typeof example.input, "string");
      assert.strictEqual(typeof example.output, "string");
    });
  });

  test("each example has non-empty strings", () => {
    TERMINAL_EXAMPLES.forEach((example) => {
      assert.ok(example.title.length > 0);
      assert.ok(example.command.length > 0);
      assert.ok(example.input.length > 0);
    });
  });
});

describe("SANDPACK_OPTIONS", () => {
  test("has showNavigator property", () => {
    assert.strictEqual("showNavigator" in SANDPACK_OPTIONS, true);
  });

  test("has showTabs property", () => {
    assert.strictEqual("showTabs" in SANDPACK_OPTIONS, true);
  });

  test("has showLineNumbers property", () => {
    assert.strictEqual("showLineNumbers" in SANDPACK_OPTIONS, true);
  });

  test("has editorHeight as a positive number", () => {
    assert.strictEqual(typeof SANDPACK_OPTIONS.editorHeight, "number");
    assert.ok(SANDPACK_OPTIONS.editorHeight > 0);
  });

  test("readOnly is true", () => {
    assert.strictEqual(SANDPACK_OPTIONS.readOnly, true);
  });
});
