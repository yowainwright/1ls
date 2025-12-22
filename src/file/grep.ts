import { stat } from "node:fs/promises";
import type { GrepOptions, GrepResult } from "./types";
import { DEFAULT_SEARCH_EXTENSIONS } from "./constants";
import { readFile } from "./io";
import { listFiles } from "./walk";

export const createRegexFromPattern = (
  pattern: string | RegExp,
  ignoreCase: boolean,
): RegExp => {
  const isString = typeof pattern === "string";
  if (!isString) return pattern;

  const flags = ignoreCase ? "gi" : "g";
  return new RegExp(pattern, flags);
};

export const createGrepResult = (
  filePath: string,
  lineNumber: number,
  matchIndex: number,
  lineContent: string,
  lines: readonly string[],
  contextSize: number | undefined,
): GrepResult => {
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
};

export const logVerboseError = (
  filePath: string,
  error: unknown,
  verbose: boolean,
): void => {
  if (!verbose) return;

  const errorMessage =
    error instanceof Error ? error.message : String(error);
  console.error(`Failed to search ${filePath}: ${errorMessage}`);
};

export const extractMatchesFromLine = (
  line: string,
  lineIndex: number,
  regex: RegExp,
  filePath: string,
  allLines: readonly string[],
  contextSize: number | undefined,
): GrepResult[] =>
  [...line.matchAll(regex)].map((match) =>
    createGrepResult(
      filePath,
      lineIndex,
      match.index!,
      line,
      allLines,
      contextSize,
    ),
  );

export const shouldStopSearching = (
  currentCount: number,
  maxMatches: number | undefined,
): boolean => {
  const limit = maxMatches ?? Infinity;
  return currentCount >= limit;
};

export const searchFileContent = async (
  filePath: string,
  regex: RegExp,
  options: GrepOptions,
): Promise<GrepResult[]> => {
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

    const maxMatches = options.maxMatches ?? Infinity;
    return allResults.slice(0, maxMatches);
  } catch (error: unknown) {
    logVerboseError(filePath, error, options.verbose ?? false);
    return [];
  }
};

export const searchInDirectory = async (
  path: string,
  regex: RegExp,
  options: GrepOptions,
): Promise<GrepResult[]> => {
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
};

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
