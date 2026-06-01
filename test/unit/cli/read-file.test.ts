import { describe, expect, test } from "bun:test";
import { resolveReadFileInvocation } from "../../../src/cli/read-file";

describe("cli/read-file", () => {
  test("resolves readFile command with explicit expression", () => {
    expect(resolveReadFileInvocation(["readFile", "data.json", ".name"])).toEqual({
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });
  });

  test("resolves rf alias with explicit expression", () => {
    expect(resolveReadFileInvocation(["rf", "data.json", ".items[0]"])).toEqual({
      filePath: "data.json",
      expression: ".items[0]",
      hasExplicitExpression: true,
    });
  });

  test("treats missing expression as implicit identity", () => {
    expect(resolveReadFileInvocation(["readFile", "data.json"])).toEqual({
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: false,
    });
  });

  test("preserves explicit root expression", () => {
    expect(resolveReadFileInvocation(["readFile", "data.json", "."])).toEqual({
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: true,
    });
  });

  test("skips flags when expression is omitted", () => {
    expect(resolveReadFileInvocation(["readFile", "data.json", "--compact"])).toEqual({
      filePath: "data.json",
      expression: ".",
      hasExplicitExpression: false,
    });
  });

  test("preserves explicit expression after flags", () => {
    expect(resolveReadFileInvocation(["readFile", "data.json", "--compact", ".name"])).toEqual({
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });
  });

  test("skips flag values before explicit expression", () => {
    expect(
      resolveReadFileInvocation(["readFile", "data.json", "--format", "yaml", "-if", "json", ".name"]),
    ).toEqual({
      filePath: "data.json",
      expression: ".name",
      hasExplicitExpression: true,
    });
  });
});
