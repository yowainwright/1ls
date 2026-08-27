import { describe, expect, test } from "bun:test";
import { join } from "path";
import { runCli } from "../../../src/qjs/shared";

const FIXTURES_PATH = join(import.meta.dir, "../../fixtures");

const createHost = (stdin = "", files: Record<string, string> = {}) => ({
  readFile: (path: string): string | null => files[path] ?? null,
  readStdin: (): string => stdin,
});

describe("qjs/shared", () => {
  test("reads readFile expressions through the shared parser path", () => {
    const filePath = join(FIXTURES_PATH, "config.yaml");
    const result = runCli(["readFile", filePath, "--compact", ".name"], createHost("", {
      [filePath]: "name: MyApp\nversion: 1.0.0\n",
    }));

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('"MyApp"');
  });

  test("supports readFile via rf alias", () => {
    const filePath = join(FIXTURES_PATH, "data.json");
    const result = runCli(["rf", filePath, "--compact", ".users[0].name"], createHost("", {
      [filePath]: '{"users":[{"name":"Alice"},{"name":"Bob"}]}',
    }));

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('"Alice"');
  });

  test("formats type output like the main CLI", () => {
    const result = runCli(["--type", ".items"], createHost('{"items":[1,2,3]}'));

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("[array]");
    expect(result.stdout).toContain("[");
  });

  test("detects stdin format", () => {
    const result = runCli(["--detect"], createHost("name: Ada\nrole: admin\n"));

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("yaml");
  });

  test("handles informational and shortcut commands", () => {
    const help = runCli(["--help"], createHost());
    const version = runCli(["--version"], createHost());
    const shortcuts = runCli(["--shortcuts"], createHost());
    const shortened = runCli(["--shorten", ".map(x => x)"], createHost());
    const expanded = runCli(["--expand", ".mp(x => x)"], createHost());

    expect(help.stdout).toContain("Usage:");
    expect(version.exitCode).toBe(0);
    expect(version.stdout).toMatch(/^\d+\.\d+\.\d+/);
    expect(shortcuts.stdout).toContain("Shorthand Reference:");
    expect(shortened.stdout).toBe(".mp(x => x)");
    expect(expanded.stdout).toBe(".map(x => x)");
  });

  test("rejects unsupported file operations in the terminal build", () => {
    const result = runCli(["--grep", "needle"], createHost());

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("File listing and grep");
  });

  test("reports unsupported daemon mode", () => {
    const result = runCli(["--daemon"], createHost());

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("tooltip daemon");
  });

  test("reports a missing readFile result", () => {
    const result = runCli(["readFile", "missing.json"], createHost());

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Failed to read file: missing.json");
  });

  test("reports missing input for detect and processing", () => {
    const detect = runCli(["--detect"], createHost("  \n"));
    const process = runCli([], createHost("  \n"));

    expect(detect.stderr).toBe("Error: --detect requires input from stdin");
    expect(process.stderr).toBe("Error: No input provided");
  });

  test("turns parser and processing errors into CLI failures", () => {
    const result = runCli(["readFile"], createHost());

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Missing file path for readFile command");
  });

});
