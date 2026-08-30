import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { text } from "node:stream/consumers";

const CLI_PATH = join(import.meta.dirname, "../../dist/index.js");
const HAS_CLI = existsSync(CLI_PATH);

async function runWithStdin(
  input: string,
  args: string[] = [],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn(process.execPath, [CLI_PATH, ...args], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdin.write(input);
  proc.stdin.end();

  const stdout = await text(proc.stdout);
  const stderr = await text(proc.stderr);
  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 0));
  });

  return { stdout, stderr, exitCode };
}

const describeStdin = HAS_CLI ? describe : describe.skip;

describeStdin("CLI Stdin Pipe Integration", () => {
  describe("JSON input", () => {
    test("processes simple JSON object", async () => {
      const result = await runWithStdin('{"name":"test","value":42}', [".name"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), '"test"');
    });

    test("processes JSON array", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".map(x => x * 2)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [2, 4, 6, 8, 10]);
    });

    test("processes nested JSON", async () => {
      const input = JSON.stringify({
        users: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
        ],
      });
      const result = await runWithStdin(input, [".users[0].name"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), '"Alice"');
    });
  });

  describe("output flags", () => {
    test("--raw removes quotes from strings", async () => {
      const result = await runWithStdin('{"name":"hello world"}', ["--raw", ".name"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "hello world");
    });

    test("-r removes quotes from strings", async () => {
      const result = await runWithStdin('{"greeting":"hi"}', ["-r", ".greeting"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "hi");
    });

    test("--compact outputs minified JSON", async () => {
      const result = await runWithStdin('{"items":[1,2,3]}', ["--compact", ".items"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "[1,2,3]");
    });

    test("-c outputs minified JSON", async () => {
      const result = await runWithStdin('{"a":1,"b":2}', ["-c"]);
      assert.strictEqual(result.exitCode, 0);
    });

    test("--type shows value type", async () => {
      const result = await runWithStdin('{"items":[1,2,3]}', ["--type", ".items"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[array]"));
    });

    test("-t shows value type for object", async () => {
      const result = await runWithStdin('{"nested":{"a":1}}', ["-t", ".nested"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[object]"));
    });

    test("-t shows value type for string", async () => {
      const result = await runWithStdin('{"name":"test"}', ["-t", ".name"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[string]"));
    });

    test("-t shows value type for number", async () => {
      const result = await runWithStdin('{"count":42}', ["-t", ".count"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[number]"));
    });

    test("-t shows value type for boolean", async () => {
      const result = await runWithStdin('{"active":true}', ["-t", ".active"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[boolean]"));
    });

    test("-t shows value type for null", async () => {
      const result = await runWithStdin('{"value":null}', ["-t", ".value"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("[object]"));
    });
  });

  describe("array operations", () => {
    test("map transforms elements", async () => {
      const result = await runWithStdin("[1,2,3]", [".map(x => x * x)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [1, 4, 9]);
    });

    test("filter selects elements", async () => {
      const result = await runWithStdin("[1,2,3,4,5,6]", [".filter(x => x % 2 === 0)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [2, 4, 6]);
    });

    test("reduce aggregates values", async () => {
      const result = await runWithStdin("[1,2,3,4]", [".reduce((a,b) => a + b, 0)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), 10);
    });

    test("find returns first match", async () => {
      const input = JSON.stringify([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
      const result = await runWithStdin(input, [".find(x => x.id === 2)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), { id: 2, name: "Bob" });
    });

    test("some checks for any match", async () => {
      const result = await runWithStdin("[1,2,3]", [".some(x => x > 2)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), true);
    });

    test("every checks all match", async () => {
      const result = await runWithStdin("[2,4,6]", [".every(x => x % 2 === 0)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), true);
    });

    test("sort orders elements", async () => {
      const result = await runWithStdin("[3,1,4,1,5]", [".sort((a,b) => a - b)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [1, 1, 3, 4, 5]);
    });

    test("reverse reverses array", async () => {
      const result = await runWithStdin("[1,2,3]", [".reverse()"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [3, 2, 1]);
    });

    test("slice extracts portion", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".slice(1,4)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [2, 3, 4]);
    });

    test("join creates string", async () => {
      const result = await runWithStdin('["a","b","c"]', ['.join("-")', "-r"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "a-b-c");
    });
  });

  describe("object operations", () => {
    test("{keys} returns keys", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{keys}"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), ["a", "b", "c"]);
    });

    test("{values} returns values", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{values}"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [1, 2, 3]);
    });

    test("{entries} returns entries", async () => {
      const result = await runWithStdin('{"a":1,"b":2}', [".{entries}"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [
        ["a", 1],
        ["b", 2],
      ]);
    });

    test("{length} returns array length", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".{length}"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), 5);
    });

    test("{length} returns object key count", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{length}"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), 3);
    });
  });

  describe("shortcuts", () => {
    test(".mp expands to .map", async () => {
      const result = await runWithStdin("[1,2,3]", [".mp(x => x * 2)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [2, 4, 6]);
    });

    test(".flt expands to .filter", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".flt(x => x > 3)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [4, 5]);
    });

    test(".kys expands to .{keys}", async () => {
      const result = await runWithStdin('{"x":1,"y":2}', [".kys"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), ["x", "y"]);
    });

    test(".vls expands to .{values}", async () => {
      const result = await runWithStdin('{"x":1,"y":2}', [".vls"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [1, 2]);
    });

    test(".len expands to .{length}", async () => {
      const result = await runWithStdin("[1,2,3,4]", [".len"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout), 4);
    });

    test("chained shortcuts work", async () => {
      const input = JSON.stringify([
        { name: "Alice", active: true },
        { name: "Bob", active: false },
        { name: "Carol", active: true },
      ]);
      const result = await runWithStdin(input, [".flt(x => x.active).mp(x => x.name)"]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), ["Alice", "Carol"]);
    });
  });

  describe("chained operations", () => {
    test("filter then map", async () => {
      const input = JSON.stringify({
        products: [
          { name: "Apple", price: 1.5, inStock: true },
          { name: "Banana", price: 0.5, inStock: false },
          { name: "Cherry", price: 3.0, inStock: true },
        ],
      });
      const result = await runWithStdin(input, [
        ".products.filter(p => p.inStock).map(p => p.name)",
      ]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), ["Apple", "Cherry"]);
    });

    test("map then filter then sort", async () => {
      const input = JSON.stringify([5, 2, 8, 1, 9, 3]);
      const result = await runWithStdin(input, [
        ".map(x => x * 2).filter(x => x > 5).sort((a,b) => b - a)",
      ]);
      assert.strictEqual(result.exitCode, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), [18, 16, 10, 6]);
    });
  });

  describe("error handling", () => {
    test("handles invalid JSON gracefully", async () => {
      const result = await runWithStdin("not valid json", [".foo"]);
      assert.strictEqual(result.exitCode, 0);
    });

    test("handles missing expression gracefully", async () => {
      const result = await runWithStdin('{"a":1}', []);
      assert.strictEqual(result.exitCode, 0);
    });
  });

  describe("--detect flag", () => {
    test("detects JSON format", async () => {
      const result = await runWithStdin('{"name":"test"}', ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "json");
    });

    test("detects YAML format", async () => {
      const result = await runWithStdin("name: test\nvalue: 42", ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "yaml");
    });

    test("detects CSV format", async () => {
      const result = await runWithStdin("a,b,c\n1,2,3", ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "csv");
    });

    test("detects TSV format", async () => {
      const result = await runWithStdin("a\tb\tc\n1\t2\t3", ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "tsv");
    });

    test("detects JSON array", async () => {
      const result = await runWithStdin("[1,2,3]", ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "json");
    });

    test("detects plain text", async () => {
      const result = await runWithStdin("hello world", ["--detect"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), "text");
    });
  });
});
