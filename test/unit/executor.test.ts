import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_OPTIONS } from "../../src/cli/constants";
import {
  evaluateExpression,
  evaluateAndFormatExpression,
  formatResult,
  processContent,
  processData,
} from "../../src/executor";

describe("executor", () => {
  test("evaluates expressions with the shared runtime", () => {
    const result = evaluateExpression(".user.name", {
      user: { name: "Ada" },
    });

    assert.strictEqual(result, "Ada");
  });

  test("formats evaluated strings with raw output", () => {
    const output = evaluateAndFormatExpression(
      ".name",
      { name: "Ada" },
      { ...DEFAULT_OPTIONS, raw: true },
    );

    assert.strictEqual(output, "Ada");
  });

  test("formats evaluated arrays with compact output", () => {
    const output = evaluateAndFormatExpression(
      ".items",
      { items: [1, 2, 3] },
      { ...DEFAULT_OPTIONS, compact: true },
    );

    assert.strictEqual(output, "[1,2,3]");
  });

  test("formats values directly through the shared formatter", () => {
    const output = formatResult({ ok: true }, DEFAULT_OPTIONS);

    assert.ok(output.includes('"ok"'));
  });

  test("processes data without an expression", () => {
    const output = processData({ ok: true }, DEFAULT_OPTIONS);

    assert.ok(output.includes('"ok"'));
  });

  test("processes data with an expression", () => {
    const output = processData(
      { users: [{ name: "Ada" }] },
      { ...DEFAULT_OPTIONS, expression: ".users[0].name", raw: true },
    );

    assert.strictEqual(output, "Ada");
  });

  test("processes raw input content", () => {
    const output = processContent("name,age\nAda,30", {
      ...DEFAULT_OPTIONS,
      expression: ".[0].name",
      raw: true,
    });

    assert.strictEqual(output, "Ada");
  });
});
