import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import { join } from "path";

const CLI_PATH = join(import.meta.dir, "../../dist/index.js");
const FIXTURES_PATH = join(import.meta.dir, "../fixtures");

async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn(["bun", CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  const exitCode = proc.exitCode || 0;

  return { stdout, stderr, exitCode };
}

describe("1ls Integration - File Reading", () => {
  test("reads JSON files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "data.json"), ".name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"Test Project"');
  });

  test("reads YAML files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "config.yaml"), ".name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"MyApp"');
  });

  test("reads CSV files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "data.csv"), ".[0].name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"Alice"');
  });

  test("reads ENV files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, ".env_test"), ".PORT"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("8080");
  });

  test("reads TOML files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "config.toml"), ".server.host"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"0.0.0.0"');
  });

  test("reads INI files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "config.ini"), ".app.name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"MyApplication"');
  });

  test("reads XML files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "data.xml"), ".catalog.book[0].title"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"The Great Gatsby"');
  });

  test("reads NDJSON files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "logs.ndjson"), ".[0].level"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"info"');
  });

  test("reads TypeScript files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "export.ts"), ".name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"TypeScript Config"');
  });

  test("reads JavaScript files", async () => {
    const result = await runCLI(["--compact", "readFile", join(FIXTURES_PATH, "export.js"), ".name"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('"JavaScript Config"');
  });
});

describe("1ls Integration - Expression Processing", () => {
  test("filters and maps data", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.json"),
      ".users.filter(u => u.active).map(u => u.name)"
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('["Alice","Charlie"]');
  });

  test("processes CSV with expressions", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.csv"),
      '.filter(r => r.active === true).map(r => r.name)'
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('["Alice","Charlie","Diana"]');
  });

  test("uses shortcuts", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.json"),
      ".users.mp(u => u.name)"
    ]);
    expect(result.exitCode).toBe(0);
    const names = JSON.parse(result.stdout.trim());
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Charlie");
  });
});
