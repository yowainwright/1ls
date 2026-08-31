import { after as afterAll, before as beforeAll, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { text } from "node:stream/consumers";

const SCRIPTC_BIN = join(import.meta.dirname, "../../node_modules/.bin/scriptc");
const SCRIPTC_ENTRY = join(import.meta.dirname, "../../src/scriptc/index.ts");
const BINARY_PATH = join(import.meta.dirname, "../../bin/1ls-scriptc-test");
const FIXTURES_PATH = join(import.meta.dirname, "../fixtures");
const TEST_TMP = join(import.meta.dirname, "../../tmp/scriptc-test");

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const runCommand = async (
  command: string[],
  input?: string,
): Promise<CommandResult> => {
  const proc = spawn(command[0], command.slice(1), {
    env: { ...process.env, TMPDIR: TEST_TMP },
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });

  if (input !== undefined) {
    proc.stdin.write(input);
    proc.stdin.end();
  }

  const stdout = await text(proc.stdout);
  const stderr = await text(proc.stderr);
  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 0));
  });

  return { stdout, stderr, exitCode };
};

const runBinary = (args: string[], input?: string): Promise<CommandResult> =>
  runCommand([BINARY_PATH, ...args], input);

const normalizeScriptcStderr = (stderr: string): string =>
  stderr === "context canceled\n" ? "" : stderr;

describe("scriptc native binary", () => {
  beforeAll(async () => {
    mkdirSync(dirname(BINARY_PATH), { recursive: true });
    mkdirSync(TEST_TMP, { recursive: true });
    const result = await runCommand([
      SCRIPTC_BIN,
      "build",
      SCRIPTC_ENTRY,
      "--dynamic",
      "--no-keep-c",
      "-o",
      BINARY_PATH,
    ]);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(normalizeScriptcStderr(result.stderr), "");
    assert.strictEqual(existsSync(BINARY_PATH), true);
  });

  afterAll(() => {
    if (existsSync(BINARY_PATH)) unlinkSync(BINARY_PATH);
  });

  test("prints version", async () => {
    const result = await runBinary(["--version"]);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "1ls version 0.1.15");
  });

  test("queries stdin JSON", async () => {
    const result = await runBinary([".users[0].name"], '{"users":[{"name":"Ada"}]}');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"Ada"');
  });

  test("maps arrays with implicit property access", async () => {
    const result = await runBinary([".map(.n)"], '[{"n":1},{"n":2}]');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(JSON.stringify(JSON.parse(result.stdout)), "[1,2]");
  });

  test("expands shortcuts", async () => {
    const result = await runBinary([".mp(.n)"], '[{"n":1},{"n":2}]');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(JSON.stringify(JSON.parse(result.stdout)), "[1,2]");
  });

  test("supports raw string output", async () => {
    const result = await runBinary(["--raw", ".name"], '{"name":"Ada"}');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "Ada");
  });

  test("detects stdin format", async () => {
    const result = await runBinary(["--detect"], "name: Ada");

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "yaml");
  });

  test("formats output as csv", async () => {
    const result = await runBinary(["--format", "csv"], '[{"name":"Ada","age":37}]');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "name,age\nAda,37");
  });

  test("queries JSON files", async () => {
    const result = await runBinary(["readFile", join(FIXTURES_PATH, "data.json"), ".settings.host"]);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), '"localhost"');
  });

  test("queries YAML files", async () => {
    const result = await runBinary(["readFile", join(FIXTURES_PATH, "config.yaml"), ".name", "--raw"]);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "MyApp");
  });
});
