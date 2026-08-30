import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, resolveReadFileInvocation } from "../../../src/cli/utils.ts";

describe("cli utils parseArgs", () => {
  test("parses long boolean flags", () => {
    const options = parseArgs([
      "--help",
      "--version",
      "--raw",
      "--pretty",
      "--compact",
      "--type",
      "readFile",
      "--recursive",
      "--ignore-case",
      "--line-numbers",
      "--shortcuts",
      "--detect",
      "--strict",
      "--daemon",
      "--slurp",
      "--null-input",
    ]);

    assert.strictEqual(options.help, true);
    assert.strictEqual(options.version, true);
    assert.strictEqual(options.raw, true);
    assert.strictEqual(options.pretty, true);
    assert.strictEqual(options.compact, true);
    assert.strictEqual(options.type, true);
    assert.strictEqual(options.readFile, true);
    assert.strictEqual(options.recursive, true);
    assert.strictEqual(options.ignoreCase, true);
    assert.strictEqual(options.showLineNumbers, true);
    assert.strictEqual(options.shortcuts, true);
    assert.strictEqual(options.detect, true);
    assert.strictEqual(options.strict, true);
    assert.strictEqual(options.daemon, true);
    assert.strictEqual(options.slurp, true);
    assert.strictEqual(options.nullInput, true);
  });

  test("parses short boolean flags", () => {
    const options = parseArgs(["-h", "-v", "-r", "-p", "-c", "-t", "rf", "-R", "-i", "-n", "-s", "-S", "-N"]);

    assert.strictEqual(options.help, true);
    assert.strictEqual(options.version, true);
    assert.strictEqual(options.raw, true);
    assert.strictEqual(options.pretty, true);
    assert.strictEqual(options.compact, true);
    assert.strictEqual(options.type, true);
    assert.strictEqual(options.readFile, true);
    assert.strictEqual(options.recursive, true);
    assert.strictEqual(options.ignoreCase, true);
    assert.strictEqual(options.showLineNumbers, true);
    assert.strictEqual(options.strict, true);
    assert.strictEqual(options.slurp, true);
    assert.strictEqual(options.nullInput, true);
  });

  test("parses value flags", () => {
    const options = parseArgs([
      "--format",
      "yaml",
      "--input-format",
      "json5",
      "--find",
      "needle",
      "--grep",
      "src",
      "--list",
      "fixtures",
      "--ext",
      "ts,json",
      "--max-depth",
      "3",
      "--shorten",
      ".filter(x => x)",
      "--expand",
      ".flt(x => x)",
    ]);

    assert.strictEqual(options.format, "yaml");
    assert.strictEqual(options.inputFormat, "json5");
    assert.strictEqual(options.find, "needle");
    assert.strictEqual(options.grep, "src");
    assert.strictEqual(options.list, "fixtures");
    assert.deepStrictEqual(options.extensions, [".ts", ".json"]);
    assert.strictEqual(options.maxDepth, 3);
    assert.strictEqual(options.shorten, ".filter(x => x)");
    assert.strictEqual(options.expand, ".flt(x => x)");
  });

  test("parses short value flags", () => {
    const options = parseArgs(["-if", "yaml", "-f", "name", "-g", "test", "-l", "src"]);

    assert.strictEqual(options.inputFormat, "yaml");
    assert.strictEqual(options.find, "name");
    assert.strictEqual(options.grep, "test");
    assert.strictEqual(options.list, "src");
  });

  test("ignores invalid format values", () => {
    const options = parseArgs(["--format", "invalid", "--input-format", "invalid"]);

    assert.strictEqual(options.format, "json");
    assert.strictEqual(options.inputFormat, undefined);
  });

  test("parses expression arguments", () => {
    assert.strictEqual(parseArgs([".users[0]"]).expression, ".users[0]");
    assert.strictEqual(parseArgs(["[0]"]).expression, "[0]");
    assert.strictEqual(parseArgs(["len(.)"]).expression, "len(.)");
    assert.strictEqual(parseArgs(["ks(.)"]).expression, "ks(.)");
  });

  test("ignores unknown arguments", () => {
    const options = parseArgs(["not-an-expression"]);

    assert.strictEqual(options.expression, undefined);
  });
});

describe("cli utils readFile", () => {
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
