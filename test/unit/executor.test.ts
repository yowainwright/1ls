import { describe, expect, test } from "bun:test";
import { DEFAULT_OPTIONS } from "../../src/cli/constants";
import {
  evaluateExpression,
  evaluateAndFormatExpression,
  formatResult,
  processData,
} from "../../src/executor";

describe("executor", () => {
  test("evaluates expressions with the shared runtime", () => {
    const result = evaluateExpression(".user.name", {
      user: { name: "Ada" },
    });

    expect(result).toBe("Ada");
  });

  test("formats evaluated strings with raw output", () => {
    const output = evaluateAndFormatExpression(
      ".name",
      { name: "Ada" },
      { ...DEFAULT_OPTIONS, raw: true },
    );

    expect(output).toBe("Ada");
  });

  test("formats evaluated arrays with compact output", () => {
    const output = evaluateAndFormatExpression(
      ".items",
      { items: [1, 2, 3] },
      { ...DEFAULT_OPTIONS, compact: true },
    );

    expect(output).toBe("[1,2,3]");
  });

  test("formats values directly through the shared formatter", () => {
    const output = formatResult({ ok: true }, DEFAULT_OPTIONS);

    expect(output).toContain('"ok"');
  });

  test("processes data without an expression", () => {
    const output = processData({ ok: true }, DEFAULT_OPTIONS);

    expect(output).toContain('"ok"');
  });

  test("processes data with an expression", () => {
    const output = processData(
      { users: [{ name: "Ada" }] },
      { ...DEFAULT_OPTIONS, expression: ".users[0].name", raw: true },
    );

    expect(output).toBe("Ada");
  });
});
