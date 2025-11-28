import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import { join } from "path";
import { existsSync } from "fs";

const QJS_BINARY = join(import.meta.dir, "../../bin/1ls-qjs");
const HAS_BINARY = existsSync(QJS_BINARY);

async function runQJS(
  input: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn([QJS_BINARY, ...args], {
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

const describeQJS = HAS_BINARY ? describe : describe.skip;

describeQJS("QuickJS Binary", () => {

  describe("CLI flags", () => {
    test("--help shows usage", async () => {
      const result = await runQJS("", ["--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("1ls - Lightweight JSON CLI");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("--help");
      expect(result.stdout).toContain("--version");
    });

    test("-h shows usage", async () => {
      const result = await runQJS("", ["-h"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    test("--version shows version", async () => {
      const result = await runQJS("", ["--version"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test("-v shows version", async () => {
      const result = await runQJS("", ["-v"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test("--shortcuts lists shortcuts", async () => {
      const result = await runQJS("", ["--shortcuts"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(".mp");
      expect(result.stdout).toContain(".map");
      expect(result.stdout).toContain(".flt");
      expect(result.stdout).toContain(".filter");
    });

    test("--raw outputs raw strings", async () => {
      const result = await runQJS('{"name":"test"}', ["--raw", ".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("test");
    });

    test("-r outputs raw strings", async () => {
      const result = await runQJS('{"name":"hello"}', ["-r", ".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("hello");
    });

    test("--compact outputs compact JSON", async () => {
      const result = await runQJS('{"a":1,"b":2}', ["--compact", ".a"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("1");
    });

    test("-c outputs compact JSON", async () => {
      const result = await runQJS('{"items":[1,2,3]}', ["-c", ".items"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("[1,2,3]");
    });

    test("--type shows result type", async () => {
      const result = await runQJS('{"name":"test"}', ["--type", ".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("string");
    });

    test("-t shows result type for array", async () => {
      const result = await runQJS('{"items":[1,2,3]}', ["-t", ".items"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("array");
    });

    test("-t shows result type for object", async () => {
      const result = await runQJS('{"nested":{"a":1}}', ["-t", ".nested"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("object");
    });

    test("-t shows result type for null", async () => {
      const result = await runQJS('{"value":null}', ["-t", ".value"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("null");
    });
  });

  describe("property access", () => {
    test("accesses top-level property", async () => {
      const result = await runQJS('{"name":"test","value":42}', [".name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"test"');
    });

    test("accesses nested property", async () => {
      const result = await runQJS('{"user":{"profile":{"name":"Alice"}}}', [".user.profile.name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"Alice"');
    });

    test("accesses array element", async () => {
      const result = await runQJS('{"items":["a","b","c"]}', [".items[1]"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"b"');
    });

    test("accesses mixed path", async () => {
      const result = await runQJS('{"users":[{"name":"Alice"},{"name":"Bob"}]}', [".users[0].name"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('"Alice"');
    });
  });

  describe("array methods", () => {
    test("map transforms elements", async () => {
      const result = await runQJS("[1,2,3]", [".map(x => x * 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 4, 6]);
    });

    test("filter selects elements", async () => {
      const result = await runQJS("[1,2,3,4,5]", [".filter(x => x > 3)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([4, 5]);
    });

    test("find returns first match", async () => {
      const result = await runQJS('[{"id":1},{"id":2}]', [".find(x => x.id === 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ id: 2 });
    });

    test("reduce aggregates values", async () => {
      const result = await runQJS("[1,2,3,4]", [".reduce((a, b) => a + b, 0)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(10);
    });

    test("sort orders elements", async () => {
      const result = await runQJS("[3,1,2]", [".sort((a, b) => a - b)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 2, 3]);
    });

    test("reverse reverses order", async () => {
      const result = await runQJS("[1,2,3]", [".reverse()"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([3, 2, 1]);
    });

    test("slice extracts portion", async () => {
      const result = await runQJS("[1,2,3,4,5]", [".slice(1, 3)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 3]);
    });

    test("join creates string", async () => {
      const result = await runQJS('["a","b","c"]', ['.join("-")', "-r"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("a-b-c");
    });
  });

  describe("object methods", () => {
    test("{keys} returns object keys", async () => {
      const result = await runQJS('{"a":1,"b":2,"c":3}', [".{keys}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["a", "b", "c"]);
    });

    test("{values} returns object values", async () => {
      const result = await runQJS('{"a":1,"b":2,"c":3}', [".{values}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 2, 3]);
    });

    test("{entries} returns key-value pairs", async () => {
      const result = await runQJS('{"a":1,"b":2}', [".{entries}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([["a", 1], ["b", 2]]);
    });

    test("{length} returns array length", async () => {
      const result = await runQJS("[1,2,3,4,5]", [".{length}"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(5);
    });
  });

  describe("shortcuts", () => {
    test(".mp expands to .map", async () => {
      const result = await runQJS("[1,2,3]", [".mp(x => x * 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([2, 4, 6]);
    });

    test(".flt expands to .filter", async () => {
      const result = await runQJS("[1,2,3,4]", [".flt(x => x > 2)"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([3, 4]);
    });

    test(".kys expands to .{keys}", async () => {
      const result = await runQJS('{"a":1,"b":2}', [".kys"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["a", "b"]);
    });

    test(".vls expands to .{values}", async () => {
      const result = await runQJS('{"a":1,"b":2}', [".vls"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([1, 2]);
    });

    test(".len expands to .{length}", async () => {
      const result = await runQJS("[1,2,3]", [".len"]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(3);
    });
  });

  describe("chained operations", () => {
    test("chains filter and map", async () => {
      const result = await runQJS(
        '[{"name":"Alice","age":30},{"name":"Bob","age":20}]',
        [".filter(u => u.age > 25).map(u => u.name)"]
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["Alice"]);
    });

    test("chains with shortcuts", async () => {
      const result = await runQJS(
        '[{"name":"Alice","age":30},{"name":"Bob","age":20}]',
        [".flt(u => u.age > 25).mp(u => u.name)"]
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(["Alice"]);
    });
  });

  describe("error handling", () => {
    test("reports invalid JSON", async () => {
      const result = await runQJS("not json", [".foo"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Error");
    });

    test("reports empty input", async () => {
      const result = await runQJS("", [".foo"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Error");
    });
  });
});
