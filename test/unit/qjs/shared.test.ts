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

  test("returns a clear error for unsupported interactive mode", () => {
    const result = runCli(["--interactive", "readFile", "data.json"], createHost());

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Interactive mode");
  });

  test("returns a clear error for unsupported TypeScript input", () => {
    const filePath = join(FIXTURES_PATH, "export.ts");
    const result = runCli(["readFile", filePath, ".name"], createHost("", {
      [filePath]: `const name: string = "TypeScript Config";\nexport default { name };\n`,
    }));

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Input format "typescript" is not supported');
  });
});
