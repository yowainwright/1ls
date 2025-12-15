import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
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
} from "../../src/utils/file";

describe("file utilities", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "1ls-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("serializeContent", () => {
    test("returns string as-is", () => {
      expect(serializeContent("hello")).toBe("hello");
    });

    test("stringifies objects", () => {
      const obj = { foo: "bar" };
      expect(serializeContent(obj)).toBe(JSON.stringify(obj, null, 2));
    });

    test("stringifies arrays", () => {
      const arr = [1, 2, 3];
      expect(serializeContent(arr)).toBe(JSON.stringify(arr, null, 2));
    });
  });

  describe("readFile", () => {
    test("reads and parses JSON file by default", async () => {
      const filePath = join(testDir, "test.json");
      const data = { name: "test", value: 42 };
      await fsWriteFile(filePath, JSON.stringify(data));

      const result = await readFile(filePath);
      expect(result).toEqual(data);
    });

    test("reads file as string when parseJson is false", async () => {
      const filePath = join(testDir, "test.txt");
      const content = "plain text content";
      await fsWriteFile(filePath, content);

      const result = await readFile(filePath, false);
      expect(result).toBe(content);
    });

    test("parses YAML file", async () => {
      const filePath = join(testDir, "test.yml");
      const yamlContent = "name: test\nvalue: 42";
      await fsWriteFile(filePath, yamlContent);

      const result = await readFile(filePath);
      expect(result).toEqual({ name: "test", value: 42 });
    });
  });

  describe("writeFile", () => {
    test("writes string content", async () => {
      const filePath = join(testDir, "output.txt");
      await writeFile(filePath, "test content");

      const content = await Bun.file(filePath).text();
      expect(content).toBe("test content");
    });

    test("writes object as JSON", async () => {
      const filePath = join(testDir, "output.json");
      const data = { foo: "bar", num: 123 };
      await writeFile(filePath, data);

      const content = await Bun.file(filePath).text();
      expect(content).toBe(JSON.stringify(data, null, 2));
    });

    test("writes to nested directory path", async () => {
      const nestedPath = join(testDir, "nested", "path", "file.txt");
      await writeFile(nestedPath, "content");
      const content = await Bun.file(nestedPath).text();
      expect(content).toBe("content");
    });
  });

  describe("getFileInfo", () => {
    test("returns file info for regular file", async () => {
      const filePath = join(testDir, "test.txt");
      await fsWriteFile(filePath, "content");

      const info = await getFileInfo(filePath);
      expect(info.name).toBe("test.txt");
      expect(info.ext).toBe(".txt");
      expect(info.isFile).toBe(true);
      expect(info.isDirectory).toBe(false);
      expect(info.size).toBeGreaterThan(0);
    });

    test("returns file info for directory", async () => {
      const dirPath = join(testDir, "subdir");
      await mkdir(dirPath);

      const info = await getFileInfo(dirPath);
      expect(info.name).toBe("subdir");
      expect(info.isFile).toBe(false);
      expect(info.isDirectory).toBe(true);
    });
  });

  describe("isHiddenFile", () => {
    test("returns true for hidden files", () => {
      expect(isHiddenFile(".hidden")).toBe(true);
      expect(isHiddenFile(".gitignore")).toBe(true);
    });

    test("returns false for regular files", () => {
      expect(isHiddenFile("visible.txt")).toBe(false);
      expect(isHiddenFile("README.md")).toBe(false);
    });
  });

  describe("shouldIncludeHiddenFile", () => {
    test("includes hidden files when includeHidden is true", () => {
      expect(shouldIncludeHiddenFile(".hidden", true)).toBe(true);
    });

    test("excludes hidden files when includeHidden is false", () => {
      expect(shouldIncludeHiddenFile(".hidden", false)).toBe(false);
    });

    test("includes visible files regardless", () => {
      expect(shouldIncludeHiddenFile("visible.txt", true)).toBe(true);
      expect(shouldIncludeHiddenFile("visible.txt", false)).toBe(true);
    });
  });

  describe("matchesExtensionFilter", () => {
    test("returns true when no filter", () => {
      expect(matchesExtensionFilter(".js", undefined)).toBe(true);
    });

    test("returns true when extension matches", () => {
      expect(matchesExtensionFilter(".js", [".js", ".ts"])).toBe(true);
    });

    test("returns false when extension doesn't match", () => {
      expect(matchesExtensionFilter(".py", [".js", ".ts"])).toBe(false);
    });
  });

  describe("matchesPatternFilter", () => {
    test("returns true when no pattern", () => {
      expect(matchesPatternFilter("test.js", undefined)).toBe(true);
    });

    test("returns true when pattern matches", () => {
      expect(matchesPatternFilter("test.js", /test/)).toBe(true);
    });

    test("returns false when pattern doesn't match", () => {
      expect(matchesPatternFilter("foo.js", /test/)).toBe(false);
    });
  });

  describe("isWithinDepthLimit", () => {
    test("returns true when depth is within limit", () => {
      expect(isWithinDepthLimit(2, 5)).toBe(true);
    });

    test("returns false when depth exceeds limit", () => {
      expect(isWithinDepthLimit(6, 5)).toBe(false);
    });

    test("returns true when no limit", () => {
      expect(isWithinDepthLimit(100, undefined)).toBe(true);
    });
  });

  describe("createRegexFromPattern", () => {
    test("returns regex as-is when pattern is regex", () => {
      const regex = /test/gi;
      expect(createRegexFromPattern(regex, false)).toBe(regex);
    });

    test("creates case-insensitive regex from string", () => {
      const regex = createRegexFromPattern("test", true);
      expect(regex.test("TEST")).toBe(true);
      expect(regex.flags).toContain("i");
    });

    test("creates case-sensitive regex from string", () => {
      const regex = createRegexFromPattern("test", false);
      expect(regex.test("TEST")).toBe(false);
      expect(regex.flags).not.toContain("i");
    });
  });

  describe("shouldStopSearching", () => {
    test("returns false when under limit", () => {
      expect(shouldStopSearching(5, 10)).toBe(false);
    });

    test("returns true when at or over limit", () => {
      expect(shouldStopSearching(10, 10)).toBe(true);
      expect(shouldStopSearching(11, 10)).toBe(true);
    });

    test("returns false when no limit", () => {
      expect(shouldStopSearching(1000, undefined)).toBe(false);
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
      expect(fileNames).toContain("file1.txt");
      expect(fileNames).toContain("file2.js");
      expect(fileNames).not.toContain("nested.txt");
    });

    test("lists files recursively when recursive option is true", async () => {
      const files = await listFiles(testDir, { recursive: true });
      const fileNames = files.map((f) => f.name);
      expect(fileNames).toContain("nested.txt");
    });

    test("filters by extensions", async () => {
      const files = await listFiles(testDir, { extensions: [".txt"] });
      const fileNames = files.map((f) => f.name);
      expect(fileNames).toContain("file1.txt");
      expect(fileNames).not.toContain("file2.js");
    });

    test("respects maxDepth", async () => {
      const files = await listFiles(testDir, { recursive: true, maxDepth: 0 });
      const fileNames = files.map((f) => f.name);
      expect(fileNames).not.toContain("nested.txt");
    });

    test("excludes hidden files by default", async () => {
      const files = await listFiles(testDir);
      const fileNames = files.map((f) => f.name);
      expect(fileNames).not.toContain(".hidden");
    });

    test("includes hidden files when includeHidden is true", async () => {
      const files = await listFiles(testDir, { includeHidden: true });
      const fileNames = files.map((f) => f.name);
      expect(fileNames).toContain(".hidden");
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
      expect(results.length).toBe(2);
      expect(results[0].line).toBe(1);
      expect(results[1].line).toBe(3);
    });

    test("finds matches case-insensitively", async () => {
      const results = await grep("HELLO", join(testDir, "test.txt"), {
        ignoreCase: true,
      });
      expect(results.length).toBe(2);
    });

    test("respects case-sensitive search", async () => {
      const results = await grep("HELLO", join(testDir, "test.txt"), {
        ignoreCase: false,
      });
      expect(results.length).toBe(0);
    });

    test("searches recursively in directory", async () => {
      const results = await grep("foo", testDir, { recursive: true });
      expect(results.length).toBeGreaterThan(0);
    });

    test("accepts regex pattern", async () => {
      const results = await grep(/hello/g, join(testDir, "test.txt"));
      expect(results.length).toBe(2);
    });

    test("returns empty array for non-file/non-directory", async () => {
      const results = await grep("test", testDir, { recursive: false });
      expect(results).toEqual([]);
    });

    test("returns results with context when context option is set", async () => {
      const results = await grep("foo", join(testDir, "test.txt"), { context: 1 });
      expect(results.length).toBeGreaterThan(0);
      const resultWithContext = results.find(r => r.context !== undefined);
      expect(resultWithContext?.context).toBeDefined();
    });
  });

  describe("createGrepResult", () => {
    test("creates grep result with context", () => {
      const lines = ["line1", "line2", "line3", "line4", "line5"];
      const result = createGrepResult("/test/file.txt", 2, 0, "line3", lines, 1);

      expect(result.file).toBe("/test/file.txt");
      expect(result.line).toBe(3);
      expect(result.context).toEqual(["line2", "line3", "line4"]);
    });

    test("creates grep result without context when contextSize is undefined", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 1, 0, "line2", lines, undefined);

      expect(result.file).toBe("/test/file.txt");
      expect(result.context).toBeUndefined();
    });

    test("handles context at start of file", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 0, 0, "line1", lines, 2);

      expect(result.context).toEqual(["line1", "line2", "line3"]);
    });

    test("handles context at end of file", () => {
      const lines = ["line1", "line2", "line3"];
      const result = createGrepResult("/test/file.txt", 2, 0, "line3", lines, 2);

      expect(result.context).toEqual(["line1", "line2", "line3"]);
    });
  });

  describe("logVerboseError", () => {
    test("logs error when verbose is true", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", new Error("test error"), true);

      expect(logs.length).toBe(1);
      expect(logs[0]).toContain("Failed to search");
      expect(logs[0]).toContain("test error");

      console.error = originalError;
    });

    test("does not log when verbose is false", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", new Error("test error"), false);

      expect(logs.length).toBe(0);

      console.error = originalError;
    });

    test("handles non-Error objects", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (msg: string) => logs.push(msg);

      logVerboseError("/test/file.txt", "string error", true);

      expect(logs.length).toBe(1);
      expect(logs[0]).toContain("string error");

      console.error = originalError;
    });
  });

  describe("extractMatchesFromLine", () => {
    test("extracts multiple matches from a line", () => {
      const line = "foo bar foo baz foo";
      const regex = /foo/g;
      const lines = [line];
      const results = extractMatchesFromLine(line, 0, regex, "/test.txt", lines, undefined);

      expect(results.length).toBe(3);
      expect(results[0].column).toBe(1);
      expect(results[1].column).toBe(9);
      expect(results[2].column).toBe(17);
    });

    test("returns empty array when no matches", () => {
      const line = "bar baz qux";
      const regex = /foo/g;
      const lines = [line];
      const results = extractMatchesFromLine(line, 0, regex, "/test.txt", lines, undefined);

      expect(results.length).toBe(0);
    });
  });
});
