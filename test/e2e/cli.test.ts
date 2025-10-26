import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import { join } from "path";

const CLI_PATH = join(import.meta.dir, "../../dist/index.js");

async function runCLI(input: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number }> {
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

describe("1ls CLI - Basic JSON Operations", () => {
  test("should access simple property", async () => {
    const result = await runCLI('{"name": "John", "age": 30}', [".name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });

  test("should access nested property", async () => {
    const result = await runCLI('{"user": {"name": "Alice"}}', [".user.name"]);
    expect(result.stdout.trim()).toBe('"Alice"');
    expect(result.exitCode).toBe(0);
  });

  test("should handle array indexing", async () => {
    const result = await runCLI('["first", "second", "third"]', [".[0]"]);
    expect(result.stdout.trim()).toBe('"first"');
    expect(result.exitCode).toBe(0);
  });

  test("should handle negative array indexing", async () => {
    const result = await runCLI('["first", "second", "third"]', [".[-1]"]);
    expect(result.stdout.trim()).toBe('"third"');
    expect(result.exitCode).toBe(0);
  });

  test("should handle array slicing", async () => {
    const result = await runCLI('[1, 2, 3, 4, 5]', ["--compact", ".[1:3]"]);
    expect(result.stdout.trim()).toBe("[2,3]");
    expect(result.exitCode).toBe(0);
  });

  test("should get object keys", async () => {
    const result = await runCLI('{"a": 1, "b": 2, "c": 3}', ["--compact", ".{keys}"]);
    expect(result.stdout.trim()).toBe('["a","b","c"]');
    expect(result.exitCode).toBe(0);
  });

  test("should get object values", async () => {
    const result = await runCLI('{"a": 1, "b": 2, "c": 3}', ["--compact", ".{values}"]);
    expect(result.stdout.trim()).toBe("[1,2,3]");
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Array Methods", () => {
  test("should filter array", async () => {
    const result = await runCLI('[1, 2, 3, 4, 5]', ["--compact", ".filter(x => x > 2)"]);
    expect(result.stdout.trim()).toBe("[3,4,5]");
    expect(result.exitCode).toBe(0);
  });

  test("should map array", async () => {
    const result = await runCLI('[1, 2, 3]', ["--compact", ".map(x => x * 2)"]);
    expect(result.stdout.trim()).toBe("[2,4,6]");
    expect(result.exitCode).toBe(0);
  });

  test("should reduce array", async () => {
    const result = await runCLI('[1, 2, 3, 4]', ["--compact", ".reduce((sum, x) => sum + x, 0)"]);
    expect(result.stdout.trim()).toBe("10");
    expect(result.exitCode).toBe(0);
  });

  test("should find in array", async () => {
    const result = await runCLI('[{"id": 1}, {"id": 2}, {"id": 3}]', ["--compact", ".find(x => x.id === 2)"]);
    expect(result.stdout.trim()).toBe('{"id":2}');
    expect(result.exitCode).toBe(0);
  });

  test("should chain array methods", async () => {
    const result = await runCLI('[1, 2, 3, 4, 5]', ["--compact", ".filter(x => x > 2).map(x => x * 2)"]);
    expect(result.stdout.trim()).toBe("[6,8,10]");
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Output Formatting", () => {
  test("should output raw strings with --raw", async () => {
    const result = await runCLI('{"name": "John"}', ["--raw", ".name"]);
    expect(result.stdout.trim()).toBe("John");
    expect(result.exitCode).toBe(0);
  });

  test("should show type with --type", async () => {
    const result = await runCLI('{"name": "John"}', ["--type", ".name"]);
    expect(result.stdout).toContain("string");
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Multi-format Input", () => {
  test("should parse YAML", async () => {
    const yaml = `name: John
age: 30
city: NYC`;
    const result = await runCLI(yaml, [".name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });

  test("should parse CSV", async () => {
    const csv = `name,age
John,30
Jane,25`;
    const result = await runCLI(csv, ["--compact", ".map(x => x.name)"]);
    expect(result.stdout.trim()).toBe('["John","Jane"]');
    expect(result.exitCode).toBe(0);
  });

  test("should parse ENV", async () => {
    const env = `DATABASE_URL=postgres://localhost/db
PORT=3000
DEBUG=true`;
    const result = await runCLI(env, [".PORT"]);
    expect(result.stdout.trim()).toBe("3000");
    expect(result.exitCode).toBe(0);
  });

  test("should parse NDJSON", async () => {
    const ndjson = `{"level":"error","msg":"Failed"}
{"level":"info","msg":"Started"}
{"level":"error","msg":"Timeout"}`;
    const result = await runCLI(ndjson, ['.filter(x => x.level === "error")']);
    const parsed = JSON.parse(result.stdout.trim());
    expect(parsed.length).toBe(2);
    expect(parsed[0].level).toBe("error");
    expect(parsed[1].level).toBe("error");
    expect(result.exitCode).toBe(0);
  });

  test("should parse JSON5", async () => {
    const json5 = `{
  // Comment
  name: "John",
  age: 30,
}`;
    const result = await runCLI(json5, [".name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });

  test("should parse TOML", async () => {
    const toml = `name = "John"
age = 30
city = "NYC"`;
    const result = await runCLI(toml, [".name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });

  test("should parse INI", async () => {
    const ini = `[section]
name = John
age = 30`;
    const result = await runCLI(ini, [".section.name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });

  test("should parse XML", async () => {
    const xml = `<person>
  <name>John</name>
  <age>30</age>
</person>`;
    const result = await runCLI(xml, [".person.name"]);
    expect(result.stdout.trim()).toBe('"John"');
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Shortcuts", () => {
  test("should use .mp shortcut for .map", async () => {
    const result = await runCLI('[1, 2, 3]', ["--compact", ".mp(x => x * 2)"]);
    expect(result.stdout.trim()).toBe("[2,4,6]");
    expect(result.exitCode).toBe(0);
  });

  test("should use .flt shortcut for .filter", async () => {
    const result = await runCLI('[1, 2, 3, 4, 5]', ["--compact", ".flt(x => x > 2)"]);
    expect(result.stdout.trim()).toBe("[3,4,5]");
    expect(result.exitCode).toBe(0);
  });

  test("should use .jn shortcut for .join", async () => {
    const result = await runCLI('["a", "b", "c"]', ['--raw', '.jn(",")']);
    expect(result.stdout.trim()).toBe("a,b,c");
    expect(result.exitCode).toBe(0);
  });

  test("should expand shortcuts with --expand", async () => {
    const result = await runCLI("", ["--expand", ".mp(x => x * 2)"]);
    expect(result.stdout.trim()).toBe(".map(x => x * 2)");
    expect(result.exitCode).toBe(0);
  });

  test("should shorten expressions with --shorten", async () => {
    const result = await runCLI("", ["--shorten", ".map(x => x * 2)"]);
    expect(result.stdout.trim()).toBe(".mp(x => x * 2)");
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Complex Operations", () => {
  test("should handle complex nested operations", async () => {
    const data = JSON.stringify({
      users: [
        { name: "Alice", age: 30, active: true },
        { name: "Bob", age: 25, active: false },
        { name: "Charlie", age: 35, active: true },
      ],
    });
    const result = await runCLI(data, ["--compact", ".users.filter(u => u.active).map(u => u.name)"]);
    expect(result.stdout.trim()).toBe('["Alice","Charlie"]');
    expect(result.exitCode).toBe(0);
  });

  test("should handle flatMap operations", async () => {
    const data = JSON.stringify({
      users: [
        { name: "Alice", tags: ["admin", "user"] },
        { name: "Bob", tags: ["user"] },
      ],
    });
    const result = await runCLI(data, ["--compact", ".users.flatMap(u => u.tags)"]);
    expect(result.stdout.trim()).toBe('["admin","user","user"]');
    expect(result.exitCode).toBe(0);
  });

  test("should handle sorting", async () => {
    const result = await runCLI('[3, 1, 4, 1, 5, 9, 2, 6]', ["--compact", ".sort((a, b) => a - b)"]);
    expect(result.stdout.trim()).toBe("[1,1,2,3,4,5,6,9]");
    expect(result.exitCode).toBe(0);
  });
});

describe("1ls CLI - Error Handling", () => {
  test("should handle invalid JSON gracefully", async () => {
    const result = await runCLI("{invalid json}", ["."]);
    expect(result.exitCode).not.toBe(0);
  });

  test("should handle invalid expression", async () => {
    const result = await runCLI('{"name": "John"}', [".invalid..syntax"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("should handle missing property", async () => {
    const result = await runCLI('{"name": "John"}', [".nonexistent"]);
    expect(result.stdout.trim()).toBe("undefined");
    expect(result.exitCode).toBe(0);
  });
});
