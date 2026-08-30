import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile as fsWriteFile, mkdir, readFile as fsReadFile } from "node:fs/promises";
import { join } from "node:path";
import {
  readFile,
  writeFile,
  serializeContent,
  listFiles,
  grep,
  createFileInfo,
  getFileInfo,
  isHiddenFile,
  shouldIncludeHiddenFile,
  matchesExtensionFilter,
  matchesPatternFilter,
  shouldIncludeFile,
  isWithinDepthLimit,
  createRegexFromPattern,
  shouldStopSearching,
  createGrepResult,
  logVerboseError,
  extractMatchesFromLine,
  searchFileContent,
} from "../../src/fs/index.ts";

describe("file utilities", () => {
  let testDir: string;
  const testRoot = join(process.cwd(), ".cache", "tests");

  beforeEach(async () => {
    await mkdir(testRoot, { recursive: true });
    testDir = await mkdtemp(join(testRoot, "1ls-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("serializeContent", () => {
    test("returns string as-is", () => {
      assert.strictEqual(serializeContent("hello"), "hello");
    });

    test("stringifies objects", () => {
      const obj = { foo: "bar" };
      assert.strictEqual(serializeContent(obj), JSON.stringify(obj, null, 2));
    });

    test("stringifies arrays", () => {
      const arr = [1, 2, 3];
      assert.strictEqual(serializeContent(arr), JSON.stringify(arr, null, 2));
    });
  });

  describe("readFile", () => {
    test("reads and parses JSON file by default", async () => {
      const filePath = join(testDir, "test.json");
      const data = { name: "test", value: 42 };
      await fsWriteFile(filePath, JSON.stringify(data));

      const result = await readFile(filePath);
      assert.deepStrictEqual(result, data);
    });

    test("reads file as string when parseJson is false", async () => {
      const filePath = join(testDir, "test.txt");
      const content = "plain text content";
      await fsWriteFile(filePath, content);

      const result = await readFile(filePath, false);
      assert.strictEqual(result, content);
    });

    test("parses YAML file", async () => {
      const filePath = join(testDir, "test.yml");
      const yamlContent = "name: test\nvalue: 42";
      await fsWriteFile(filePath, yamlContent);

      const result = await readFile(filePath);
      assert.deepStrictEqual(result, { name: "test", value: 42 });
    });

    test("uses explicit input format when provided", async () => {
      const filePath = join(testDir, "test.csv");
      const csvContent = "name,age\nAda,30";
      await fsWriteFile(filePath, csvContent);

      const result = await readFile(filePath, "lines");
      assert.deepStrictEqual(result, ["name,age", "Ada,30"]);
    });
  });

  describe("writeFile", () => {
    test("writes string content", async () => {
      const filePath = join(testDir, "output.txt");
      await writeFile(filePath, "test content");

      const content = await fsReadFile(filePath, "utf8");
      assert.strictEqual(content, "test content");
    });

    test("writes object as JSON", async () => {
      const filePath = join(testDir, "output.json");
      const data = { foo: "bar", num: 123 };
      await writeFile(filePath, data);

      const content = await fsReadFile(filePath, "utf8");
      assert.strictEqual(content, JSON.stringify(data, null, 2));
    });

    test("writes to nested directory path", async () => {
      const nestedPath = join(testDir, "nested", "path", "file.txt");
      await writeFile(nestedPath, "content");
      const content = await fsReadFile(nestedPath, "utf8");
      assert.strictEqual(content, "content");
    });

    test("reports a clear error when the target cannot be written", async () => {
      await assert.rejects(writeFile(testDir, "content"), `Failed to write file ${testDir}`,
      );
    });
  });

  describe("getFileInfo", () => {
    test("returns file info for regular file", async () => {
      const filePath = join(testDir, "test.txt");
      await fsWriteFile(filePath, "content");

      const info = await getFileInfo(filePath);
      assert.strictEqual(info.name, "test.txt");
      assert.strictEqual(info.ext, ".txt");
      assert.strictEqual(info.isFile, true);
      assert.strictEqual(info.isDirectory, false);
      assert.ok(info.size > 0);
    });

    test("returns file info for directory", async () => {
      const dirPath = join(testDir, "subdir");
      await mkdir(dirPath);

      const info = await getFileInfo(dirPath);
      assert.strictEqual(info.name, "subdir");
      assert.strictEqual(info.isFile, false);
      assert.strictEqual(info.isDirectory, true);
    });
  });

  describe("isHiddenFile", () => {
    test("returns true for hidden files", () => {
      assert.strictEqual(isHiddenFile(".hidden"), true);
      assert.strictEqual(isHiddenFile(".gitignore"), true);
    });

    test("returns false for regular files", () => {
      assert.strictEqual(isHiddenFile("visible.txt"), false);
      assert.strictEqual(isHiddenFile("README.md"), false);
    });
  });

  describe("shouldIncludeHiddenFile", () => {
    test("includes hidden files when includeHidden is true", () => {
      assert.strictEqual(shouldIncludeHiddenFile(".hidden", true), true);
    });

    test("excludes hidden files when includeHidden is false", () => {
      assert.strictEqual(shouldIncludeHiddenFile(".hidden", false), false);
    });

    test("includes visible files regardless", () => {
      assert.strictEqual(shouldIncludeHiddenFile("visible.txt", true), true);
      assert.strictEqual(shouldIncludeHiddenFile("visible.txt", false), true);
    });
  });

  describe("matchesExtensionFilter", () => {
    test("returns true when no filter", () => {
      assert.strictEqual(matchesExtensionFilter(".js", undefined), true);
    });

    test("returns true when extension matches", () => {
      assert.strictEqual(matchesExtensionFilter(".js", [".js", ".ts"]), true);
    });

    test("returns false when extension doesn't match", () => {
      assert.strictEqual(matchesExtensionFilter(".py", [".js", ".ts"]), false);
    });
  });

  describe("matchesPatternFilter", () => {
    test("returns true when no pattern", () => {
      assert.strictEqual(matchesPatternFilter("test.js", undefined), true);
    });

    test("returns true when pattern matches", () => {
      assert.strictEqual(matchesPatternFilter("test.js", /test/), true);
    });

    test("returns false when pattern doesn't match", () => {
      assert.strictEqual(matchesPatternFilter("foo.js", /test/), false);
    });
  });

  describe("isWithinDepthLimit", () => {
    test("returns true when depth is within limit", () => {
      assert.strictEqual(isWithinDepthLimit(2, 5), true);
    });

    test("returns false when depth exceeds limit", () => {
      assert.strictEqual(isWithinDepthLimit(6, 5), false);
    });

    test("returns true when no limit", () => {
      assert.strictEqual(isWithinDepthLimit(100, undefined), true);
    });
  });

  describe("createRegexFromPattern", () => {
    test("normalizes regex patterns for matchAll", () => {
      const regex = /test/gi;
      const result = createRegexFromPattern(regex, false);

      assert.notStrictEqual(result, regex);
      assert.strictEqual(result.source, "test");
      assert.ok(result.flags.includes("g"));
      assert.ok(result.flags.includes("i"));
    });

    test("creates case-insensitive regex from string", () => {
      const regex = createRegexFromPattern("test", true);
      assert.strictEqual(regex.test("TEST"), true);
      assert.ok(regex.flags.includes("i"));
    });

    test("creates case-sensitive regex from string", () => {
      const regex = createRegexFromPattern("test", false);
      assert.strictEqual(regex.test("TEST"), false);
      assert.ok(!regex.flags.includes("i"));
    });
  });

  describe("shouldStopSearching", () => {
    test("returns false when under limit", () => {
      assert.strictEqual(shouldStopSearching(5, 10), false);
    });

    test("returns true when at or over limit", () => {
      assert.strictEqual(shouldStopSearching(10, 10), true);
      assert.strictEqual(shouldStopSearching(11, 10), true);
    });

    test("returns false when no limit", () => {
      assert.strictEqual(shouldStopSearching(1000, undefined), false);
    });
  });

  describe("listFiles", () => {
    beforeEach(async () => {
      await mkdir(join(testDir, "subdir"));
      await fsWriteFile(join(testDir, "file1.txt"), "content1");
      await fsWriteFile(join(testDir, "file2.js"), "content2");
      await fsWriteFile(join(testDir, ".hidden"), "hidden");
      await fsWriteFile(join(testDir, "subdir", "nested.txt"), "nested");
    });

    test("lists all files non-recursively by default", async () => {
      const files = await listFiles(testDir);
      const fileNames = files.map((f) => f.name).sort();
      assert.ok(fileNames.includes("file1.txt"));
      assert.ok(fileNames.includes("file2.js"));
      assert.ok(!fileNames.includes("nested.txt"));
    });

    test("lists files recursively when recursive option is true", async () => {
      const files = await listFiles(testDir, { recursive: true });
      const fileNames = files.map((f) => f.name);
      assert.ok(fileNames.includes("nested.txt"));
    });

    test("filters by extensions", async () => {
      const files = await listFiles(testDir, { extensions: [".txt"] });
      const fileNames = files.map((f) => f.name);
      assert.ok(fileNames.includes("file1.txt"));
      assert.ok(!fileNames.includes("file2.js"));
    });

    test("respects maxDepth", async () => {
      const files = await listFiles(testDir, { recursive: true, maxDepth: 0 });
      const fileNames = files.map((f) => f.name);
      assert.ok(!fileNames.includes("nested.txt"));
    });

    test("excludes hidden files by default", async () => {
      const files = await listFiles(testDir);
      const fileNames = files.map((f) => f.name);
      assert.ok(!fileNames.includes(".hidden"));
    });

    test("includes hidden files when includeHidden is true", async () => {
      const files = await listFiles(testDir, { includeHidden: true });
      const fileNames = files.map((f) => f.name);
      assert.ok(fileNames.includes(".hidden"));
    });
  });

  describe("grep", () => {
    beforeEach(async () => {
      await mkdir(join(testDir, "src"));
      await fsWriteFile(join(testDir, "test.txt"), "hello world\nfoo bar\nhello again");
      await fsWriteFile(join(testDir, "src", "code.js"), "const foo = 'bar';\nconst test = 123;");
    });

    test("finds matches in single file", async () => {
      const results = await grep("hello", join(testDir, "test.txt"));
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].line, 1);
      assert.strictEqual(results[1].line, 3);
    });

    test("finds matches case-insensitively", async () => {
      const results = await grep("HELLO", join(testDir, "test.txt"), {
        ignoreCase: true,
      });
      assert.strictEqual(results.length, 2);
    });

    test("respects case-sensitive search", async () => {
      const results = await grep("HELLO", join(testDir, "test.txt"), {
        ignoreCase: false,
      });
      assert.strictEqual(results.length, 0);
    });

    test("searches recursively in directory", async () => {
      const results = await grep("foo", testDir, { recursive: true });
      assert.ok(results.length > 0);
    });

    test("accepts regex pattern", async () => {
      const results = await grep(/hello/g, join(testDir, "test.txt"));
      assert.strictEqual(results.length, 2);
    });

    test("accepts non-global regex pattern", async () => {
      const results = await grep(/hello/, join(testDir, "test.txt"));
      assert.strictEqual(results.length, 2);
    });

    test("returns empty array for non-file/non-directory", async () => {
      const results = await grep("test", testDir, { recursive: false });
      assert.deepStrictEqual(results, []);
    });

    test("returns results with context when context option is set", async () => {
      const results = await grep("foo", join(testDir, "test.txt"), { context: 1 });
      assert.ok(results.length > 0);
      const resultWithContext = results.find((r) => r.context !== undefined);
      assert.notStrictEqual(resultWithContext?.context, undefined);
    });

    test("returns no results when a file cannot be read", async () => {
      const results = await searchFileContent(join(testDir, "missing.txt"), /hello/g, {});

      assert.deepStrictEqual(results, []);
    });
  });

  describe("createGrepResult", () => {
    test("creates grep result with context", () => {
      const lines = ["line1", "line2", "line3", "line4", "line5"];
      const result = createGrepResult("/test/file.txt", 2, 0, "line3", lines, 1);

      assert.strictEqual(result.file, "/test/file.txt");
      assert.strictEqual(result.line, 3);
      assert.deepStrictEqual(result.context, ["line2", "line3", "line4"]);
    });

    test("creates grep result without context when contextSize is undefined", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 1, 0, "line2", lines, undefined);

      assert.strictEqual(result.file, "/test/file.txt");
      assert.strictEqual(result.context, undefined);
    });

    test("handles context at start of file", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 0, 0, "line1", lines, 2);

      assert.deepStrictEqual(result.context, ["line1", "line2", "line3"]);
    });

    test("handles context at end of file", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 2, 0, "line3", lines, 2);

      assert.deepStrictEqual(result.context, ["line1", "line2", "line3"]);
    });
  });

  describe("logVerboseError", () => {
    test("logs error when verbose is true", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", new Error("test error"), true);

      assert.strictEqual(logs.length, 1);
      assert.ok(logs[0].includes("Failed to search"));
      assert.ok(logs[0].includes("test error"));

      console.error = originalError;
    });

    test("does not log when verbose is false", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", new Error("test error"), false);

      assert.strictEqual(logs.length, 0);

      console.error = originalError;
    });

    test("handles non-Error objects", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", "string error", true);

      assert.strictEqual(logs.length, 1);
      assert.ok(logs[0].includes("string error"));

      console.error = originalError;
    });
  });

  describe("extractMatchesFromLine", () => {
    test("extracts multiple matches from a line", () => {
      const line = "foo bar foo baz foo";
      const regex = /foo/g;
      const lines = [line];
      const results = extractMatchesFromLine(line, 0, regex, "/test.txt", lines, undefined);

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].column, 1);
      assert.strictEqual(results[1].column, 9);
      assert.strictEqual(results[2].column, 17);
    });

    test("returns empty array when no matches", () => {
      const line = "bar baz qux";
      const regex = /foo/g;
      const lines = [line];
      const results = extractMatchesFromLine(line, 0, regex, "/test.txt", lines, undefined);

      assert.strictEqual(results.length, 0);
    });
  });
});
