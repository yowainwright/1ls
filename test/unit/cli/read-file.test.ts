import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolveReadFileInvocation } from "../../../src/cli/read-file.ts";

describe("cli/read-file", () => {
  test("resolves readFile command with explicit expression", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json", ".name"]), {
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });
  });

  test("resolves rf alias with explicit expression", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["rf", "data.json", ".items[0]"]), {
      filePath: "data.json",
      expression: ".items[0]",
      hasExplicitExpression: true,
    });
  });

  test("treats missing expression as implicit identity", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json"]), {
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: false,
    });
  });

  test("preserves explicit root expression", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json", "."]), {
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: true,
    });
  });

  test("skips flags when expression is omitted", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json", "--compact"]), {
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: false,
    });
  });

  test("preserves explicit expression after flags", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json", "--compact", ".name"]), {
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });
  });

  test("skips flag values before explicit expression", () => {
    assert.deepStrictEqual(
      resolveReadFileInvocation(["readFile", "data.json", "--format", "yaml", "-if", "json", ".name"]),
      {
        filePath: "data.json",
        expression: ".name",
        hasExplicitExpression: true,
      },
    );
  });

  test("skips list targets before explicit expression", () => {
    assert.deepStrictEqual(resolveReadFileInvocation(["readFile", "data.json", "--list", "src", ".name"]), {
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });

    assert.deepStrictEqual(resolveReadFileInvocation(["rf", "data.json", "-l", "src", ".items"]), {
      filePath: "data.json",
      expression: ".items",
      hasExplicitExpression: true,
    });
  });
});
