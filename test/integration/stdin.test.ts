import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import { join } from "path";
import { existsSync } from "fs";

const CLI_PATH = join(import.meta.dir, "../../dist/index.js");
const HAS_CLI = existsSync(CLI_PATH);

async function runWithStdin(
  input: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn(["bun", CLI_PATH, ...args], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  proc.stdin.write(input);
  proc.stdin.end();

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  const exitCode = proc.exitCode || 0;

  return { stdout, stderr, exitCode };
}

const describeStdin = HAS_CLI ? describe : describe.skip;

describeStdin("CLI Stdin Pipe Integration", () => {
  describe("JSON input", () => {
    test("processes simple JSON object", async () => {
      const result = await runWithStdin('{"name":"test","value":42}', [".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"test"');
    });

    test("processes JSON array", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".map(x => x * 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 4, 6, 8, 10]);
    });

    test("processes nested JSON", async () => {
      const input = JSON.stringify({
        users: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
        ],
      });
      const result = await runWithStdin(input, [".users[0].name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"Alice"');
    });
  });

  describe("output flags", () => {
    test("--raw removes quotes from strings", async () => {
      const result = await runWithStdin('{"name":"hello world"}', ["--raw", ".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("hello world");
    });

    test("-r removes quotes from strings", async () => {
      const result = await runWithStdin('{"greeting":"hi"}', ["-r", ".greeting"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("hi");
    });

    test("--compact outputs minified JSON", async () => {
      const result = await runWithStdin('{"items":[1,2,3]}', ["--compact", ".items"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("[1,2,3]");
    });

    test("-c outputs minified JSON", async () => {
      const result = await runWithStdin('{"a":1,"b":2}', ["-c"]);
      expect(result.exitCode).toBe(0);
    });

    test("--type shows value type", async () => {
      const result = await runWithStdin('{"items":[1,2,3]}', ["--type", ".items"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[array]");
    });

    test("-t shows value type for object", async () => {
      const result = await runWithStdin('{"nested":{"a":1}}', ["-t", ".nested"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[object]");
    });

    test("-t shows value type for string", async () => {
      const result = await runWithStdin('{"name":"test"}', ["-t", ".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[string]");
    });

    test("-t shows value type for number", async () => {
      const result = await runWithStdin('{"count":42}', ["-t", ".count"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[number]");
    });

    test("-t shows value type for boolean", async () => {
      const result = await runWithStdin('{"active":true}', ["-t", ".active"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[boolean]");
    });

    test("-t shows value type for null", async () => {
      const result = await runWithStdin('{"value":null}', ["-t", ".value"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[object]");
    });
  });

  describe("array operations", () => {
    test("map transforms elements", async () => {
      const result = await runWithStdin("[1,2,3]", [".map(x => x * x)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 4, 9]);
    });

    test("filter selects elements", async () => {
      const result = await runWithStdin("[1,2,3,4,5,6]", [".filter(x => x % 2 === 0)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 4, 6]);
    });

    test("reduce aggregates values", async () => {
      const result = await runWithStdin("[1,2,3,4]", [".reduce((a,b) => a + b, 0)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(10);
    });

    test("find returns first match", async () => {
      const input = JSON.stringify([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
      const result = await runWithStdin(input, [".find(x => x.id === 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ id: 2, name: "Bob" });
    });

    test("some checks for any match", async () => {
      const result = await runWithStdin("[1,2,3]", [".some(x => x > 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(true);
    });

    test("every checks all match", async () => {
      const result = await runWithStdin("[2,4,6]", [".every(x => x % 2 === 0)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(true);
    });

    test("sort orders elements", async () => {
      const result = await runWithStdin("[3,1,4,1,5]", [".sort((a,b) => a - b)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 1, 3, 4, 5]);
    });

    test("reverse reverses array", async () => {
      const result = await runWithStdin("[1,2,3]", [".reverse()"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([3, 2, 1]);
    });

    test("slice extracts portion", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".slice(1,4)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 3, 4]);
    });

    test("join creates string", async () => {
      const result = await runWithStdin('["a","b","c"]', ['.join("-")', "-r"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("a-b-c");
    });
  });

  describe("object operations", () => {
    test("{keys} returns keys", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{keys}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["a", "b", "c"]);
    });

    test("{values} returns values", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{values}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 2, 3]);
    });

    test("{entries} returns entries", async () => {
      const result = await runWithStdin('{"a":1,"b":2}', [".{entries}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([["a", 1], ["b", 2]]);
    });

    test("{length} returns array length", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".{length}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(5);
    });

    test("{length} returns object key count", async () => {
      const result = await runWithStdin('{"a":1,"b":2,"c":3}', [".{length}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(3);
    });
  });

  describe("shortcuts", () => {
    test(".mp expands to .map", async () => {
      const result = await runWithStdin("[1,2,3]", [".mp(x => x * 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 4, 6]);
    });

    test(".flt expands to .filter", async () => {
      const result = await runWithStdin("[1,2,3,4,5]", [".flt(x => x > 3)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([4, 5]);
    });

    test(".kys expands to .{keys}", async () => {
      const result = await runWithStdin('{"x":1,"y":2}', [".kys"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["x", "y"]);
    });

    test(".vls expands to .{values}", async () => {
      const result = await runWithStdin('{"x":1,"y":2}', [".vls"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 2]);
    });

    test(".len expands to .{length}", async () => {
      const result = await runWithStdin("[1,2,3,4]", [".len"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(4);
    });

    test("chained shortcuts work", async () => {
      const input = JSON.stringify([
        { name: "Alice", active: true },
        { name: "Bob", active: false },
        { name: "Carol", active: true },
      ]);
      const result = await runWithStdin(input, [".flt(x => x.active).mp(x => x.name)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["Alice", "Carol"]);
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
      const result = await runWithStdin(
        input,
        [".products.filter(p => p.inStock).map(p => p.name)"]
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["Apple", "Cherry"]);
    });

    test("map then filter then sort", async () => {
      const input = JSON.stringify([5, 2, 8, 1, 9, 3]);
      const result = await runWithStdin(
        input,
        [".map(x => x * 2).filter(x => x > 5).sort((a,b) => b - a)"]
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([18, 16, 10, 6]);
    });
  });

  describe("error handling", () => {
    test("handles invalid JSON gracefully", async () => {
      const result = await runWithStdin("not valid json", [".foo"]);
      expect(result.exitCode).toBe(0);
    });

    test("handles missing expression gracefully", async () => {
      const result = await runWithStdin('{"a":1}', []);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("--detect flag", () => {
    test("detects JSON format", async () => {
      const result = await runWithStdin('{"name":"test"}', ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("json");
    });

    test("detects YAML format", async () => {
      const result = await runWithStdin("name: test\nvalue: 42", ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("yaml");
    });

    test("detects CSV format", async () => {
      const result = await runWithStdin("a,b,c\n1,2,3", ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("csv");
    });

    test("detects TSV format", async () => {
      const result = await runWithStdin("a\tb\tc\n1\t2\t3", ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("tsv");
    });

    test("detects JSON array", async () => {
      const result = await runWithStdin("[1,2,3]", ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("json");
    });

    test("detects plain text", async () => {
      const result = await runWithStdin("hello world", ["--detect"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("text");
    });
  });
});
