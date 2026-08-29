import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { text } from "node:stream/consumers";

const CLI_PATH = join(import.meta.dirname, "../../dist/index.js");
const FIXTURES_PATH = join(import.meta.dirname, "../fixtures");

async function runCLI(
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn(process.execPath, [CLI_PATH, ...args], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdout = await text(proc.stdout);
  const stderr = await text(proc.stderr);
  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 0));
  });

  return { stdout, stderr, exitCode };
}

describe("1ls Integration - File Reading", () => {
  test("reads JSON files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.json"),
      ".name",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"Test Project"');
  });

  test("reads YAML files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "config.yaml"),
      ".name",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"MyApp"');
  });

  test("reads CSV files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.csv"),
      ".[0].name",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"Alice"');
  });

  test("honors explicit input format for readFile", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.csv"),
      "--input-format",
      "lines",
      ".[0]",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"id,name,age,city,active"');
  });

  test("reads ENV files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, ".env_test"),
      ".PORT",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "8080");
  });

  test("reads TOML files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "config.toml"),
      ".server.host",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"0.0.0.0"');
  });

  test("reads INI files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "config.ini"),
      ".app.name",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"MyApplication"');
  });

  test("reads XML files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.xml"),
      ".catalog.book[0].title",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"The Great Gatsby"');
  });

  test("reads NDJSON files", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "logs.ndjson"),
      ".[0].level",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"info"');
  });

});

describe("1ls Integration - Expression Processing", () => {
  test("filters and maps data", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.json"),
      ".users.filter(u => u.active).map(u => u.name)",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '["Alice","Charlie"]');
  });

  test("processes CSV with expressions", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.csv"),
      ".filter(r => r.active === true).map(r => r.name)",
    ]);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '["Alice","Charlie","Diana"]');
  });

  test("uses shortcuts", async () => {
    const result = await runCLI([
      "--compact",
      "readFile",
      join(FIXTURES_PATH, "data.json"),
      ".users.mp(u => u.name)",
    ]);
    assert.strictEqual(result.exitCode, 0);
    const names = JSON.parse(result.stdout.trim());
    assert.ok(names.includes("Alice"));
    assert.ok(names.includes("Bob"));
    assert.ok(names.includes("Charlie"));
  });
});
