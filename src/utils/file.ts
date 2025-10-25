import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import type { FileInfo, ListOptions, GrepOptions, GrepResult } from "./types";
import { DEFAULT_SEARCH_EXTENSIONS } from "./constants";

// Overloaded function signatures for readFile
export async function readFile(path: string): Promise<unknown>;
export async function readFile(
  path: string,
  parseJson: true,
): Promise<unknown>;
export async function readFile(
  path: string,
  parseJson: false,
): Promise<string>;

export async function readFile(
  path: string,
  parseJson = true,
): Promise<unknown> {
  const file = Bun.file(path);

  const shouldParseJson = parseJson && path.endsWith(".json");
  if (shouldParseJson) {
    return file.json();
  }

  return file.text();
}

export function serializeContent(content: unknown): string {
  const isString = typeof content === "string";
  return isString ? content : JSON.stringify(content, null, 2);
}

export async function writeFile(path: string, content: unknown): Promise<void> {
  try {
    const data = serializeContent(content);
    await Bun.write(path, data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${path}: ${errorMessage}`);
  }
}

export function createFileInfo(
  path: string,
  stats: Awaited<ReturnType<typeof stat>>,
): FileInfo {
  return {
    path,
    name: basename(path),
    ext: extname(path),
    size: Number(stats.size),
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    modified: stats.mtime,
    created: stats.birthtime,
  };
}

export async function getFileInfo(path: string): Promise<FileInfo> {
  const stats = await stat(path);
  return createFileInfo(path, stats);
}

export function isHiddenFile(entry: string): boolean {
  return entry.startsWith(".");
}

export function shouldIncludeHiddenFile(
  entry: string,
  includeHidden: boolean,
): boolean {
  return includeHidden || !isHiddenFile(entry);
}

export function matchesExtensionFilter(
  ext: string,
  extensions: string[] | undefined,
): boolean {
  const hasFilter = extensions !== undefined;
  if (!hasFilter) return true;

  return extensions.includes(ext);
}

export function matchesPatternFilter(
  name: string,
  pattern: RegExp | undefined,
): boolean {
  const hasFilter = pattern !== undefined;
  if (!hasFilter) return true;

  return pattern.test(name);
}

export function shouldIncludeFile(
  info: FileInfo,
  extensions: string[] | undefined,
  pattern: RegExp | undefined,
): boolean {
  const extensionMatch = matchesExtensionFilter(info.ext, extensions);
  const patternMatch = matchesPatternFilter(info.name, pattern);
  return extensionMatch && patternMatch;
}

export function isWithinDepthLimit(
  depth: number,
  maxDepth: number | undefined,
): boolean {
  const limit = maxDepth ?? Infinity;
  return depth <= limit;
}

export async function processDirectoryEntry(
  currentDir: string,
  entry: string,
  depth: number,
  options: ListOptions,
): Promise<FileInfo[]> {
  const shouldInclude = shouldIncludeHiddenFile(
    entry,
    options.includeHidden ?? false,
  );
  if (!shouldInclude) return [];

  const fullPath = join(currentDir, entry);
  const info = await getFileInfo(fullPath);

  if (info.isFile) {
    const shouldAdd = shouldIncludeFile(
      info,
      options.extensions,
      options.pattern,
    );
    return shouldAdd ? [info] : [];
  }

  if (!info.isDirectory) return [];

  const shouldRecurse = options.recursive === true;
  const childFiles = shouldRecurse
    ? await walkDirectory(fullPath, depth + 1, options)
    : [];

  return [info, ...childFiles];
}

export async function walkDirectory(
  currentDir: string,
  depth: number,
  options: ListOptions,
): Promise<FileInfo[]> {
  const canContinue = isWithinDepthLimit(depth, options.maxDepth);
  if (!canContinue) return [];

  const entries = await readdir(currentDir);

  // Process all entries in parallel and flatten results
  const fileArrays = await Promise.all(
    entries.map((entry) =>
      processDirectoryEntry(currentDir, entry, depth, options),
    ),
  );

  return fileArrays.flat();
}

export async function listFiles(
  dir: string,
  options: ListOptions = {},
): Promise<FileInfo[]> {
  return walkDirectory(dir, 0, options);
}

export function createRegexFromPattern(
  pattern: string | RegExp,
  ignoreCase: boolean,
): RegExp {
  const isString = typeof pattern === "string";
  if (!isString) return pattern;

  const flags = ignoreCase ? "gi" : "g";
  return new RegExp(pattern, flags);
}

export function createGrepResult(
  filePath: string,
  lineNumber: number,
  matchIndex: number,
  lineContent: string,
  lines: readonly string[],
  contextSize: number | undefined,
): GrepResult {
  const baseResult: GrepResult = {
    file: filePath,
    line: lineNumber + 1,
    column: matchIndex + 1,
    match: lineContent,
  };

  const hasContext = contextSize !== undefined;
  if (!hasContext) return baseResult;

  const start = Math.max(0, lineNumber - contextSize);
  const end = Math.min(lines.length, lineNumber + contextSize + 1);
  return {
    ...baseResult,
    context: lines.slice(start, end) as string[],
  };
}

export function logVerboseError(
  filePath: string,
  error: unknown,
  verbose: boolean,
): void {
  if (!verbose) return;

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to search ${filePath}: ${errorMessage}`);
}

export function extractMatchesFromLine(
  line: string,
  lineIndex: number,
  regex: RegExp,
  filePath: string,
  allLines: readonly string[],
  contextSize: number | undefined,
): GrepResult[] {
  const matches = [...line.matchAll(regex)];

  return matches.map((match) =>
    createGrepResult(
      filePath,
      lineIndex,
      match.index!,
      line,
      allLines,
      contextSize,
    ),
  );
}

export function shouldStopSearching(
  currentCount: number,
  maxMatches: number | undefined,
): boolean {
  const limit = maxMatches ?? Infinity;
  return currentCount >= limit;
}

export async function searchFileContent(
  filePath: string,
  regex: RegExp,
  options: GrepOptions,
): Promise<GrepResult[]> {
  try {
    const content = await readFile(filePath, false);
    const isString = typeof content === "string";
    if (!isString) return [];

    const lines = content.split("\n");
    const allResults = lines.flatMap((line, index) =>
      extractMatchesFromLine(
        line,
        index,
        regex,
        filePath,
        lines,
        options.context,
      ),
    );

    // Apply max matches limit while maintaining immutability
    const maxMatches = options.maxMatches ?? Infinity;
    return allResults.slice(0, maxMatches);
  } catch (error: unknown) {
    logVerboseError(filePath, error, options.verbose ?? false);
    return [];
  }
}

export async function searchInDirectory(
  path: string,
  regex: RegExp,
  options: GrepOptions,
): Promise<GrepResult[]> {
  const files = await listFiles(path, {
    recursive: true,
    extensions: [...DEFAULT_SEARCH_EXTENSIONS],
  });

  const fileResults = await Promise.all(
    files
      .filter((file) => file.isFile)
      .map((file) => searchFileContent(file.path, regex, options)),
  );

  return fileResults.flat();
}

// Overloaded grep signatures
export async function grep(
  pattern: string,
  path: string,
  options?: GrepOptions,
): Promise<GrepResult[]>;
export async function grep(
  pattern: RegExp,
  path: string,
  options?: GrepOptions,
): Promise<GrepResult[]>;

export async function grep(
  pattern: string | RegExp,
  path: string,
  options: GrepOptions = {},
): Promise<GrepResult[]> {
  const regex = createRegexFromPattern(pattern, options.ignoreCase ?? false);
  const stats = await stat(path);

  const isFile = stats.isFile();
  if (isFile) return searchFileContent(path, regex, options);

  const isDirectory = stats.isDirectory();
  const shouldSearchDirectory = isDirectory && options.recursive;
  if (shouldSearchDirectory) return searchInDirectory(path, regex, options);

  return [];
}
