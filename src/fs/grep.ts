import { statSync } from "node:fs";
import { DEFAULT_SEARCH_EXTENSIONS } from "./constants";
import { readFile } from "./io";
import { listFiles } from "./walk";
import type { GrepOptions, GrepResult } from "./types";

interface GrepContextInput {
  lines: readonly string[];
  contextSize: number | undefined;
}

interface GrepResultInput {
  filePath: string;
  lineNumber: number;
  matchIndex: number;
  lineContent: string;
}

interface LineMatchesInput {
  line: string;
  lineIndex: number;
  regex: RegExp;
  filePath: string;
}

type CreateGrepResultArgs =
  | [
      filePath: string,
      lineNumber: number,
      matchIndex: number,
      lineContent: string,
      lines: readonly string[],
      contextSize: number | undefined,
    ]
  | [resultInput: GrepResultInput, contextInput: GrepContextInput];

type ExtractMatchesArgs =
  | [
      line: string,
      lineIndex: number,
      regex: RegExp,
      filePath: string,
      allLines: readonly string[],
      contextSize: number | undefined,
    ]
  | [lineInput: LineMatchesInput, contextInput: GrepContextInput];

export const createRegexFromPattern = (pattern: string | RegExp, ignoreCase: boolean): RegExp => {
  const isString = typeof pattern === "string";
  if (!isString) return createRegexFromRegex(pattern, ignoreCase);

  const flags = ignoreCase ? "gi" : "g";
  return new RegExp(pattern, flags);
};

const createRegexFromRegex = (pattern: RegExp, ignoreCase: boolean): RegExp => {
  const flagSet = new Set(pattern.flags);
  flagSet.add("g");
  if (ignoreCase) flagSet.add("i");

  return new RegExp(pattern.source, [...flagSet].join(""));
};

const getContextLines = (
  lineNumber: number,
  { lines, contextSize }: GrepContextInput,
): string[] | undefined => {
  if (contextSize === undefined) return undefined;

  const start = Math.max(0, lineNumber - contextSize);
  const end = Math.min(lines.length, lineNumber + contextSize + 1);
  return lines.slice(start, end) as string[];
};

export const createGrepResult = (...args: CreateGrepResultArgs): GrepResult => {
  const { resultInput, contextInput } = normalizeGrepResultArgs(args);
  const { filePath, lineNumber, matchIndex, lineContent } = resultInput;
  const context = getContextLines(lineNumber, contextInput);
  const baseResult = createBaseGrepResult(filePath, lineNumber, matchIndex, lineContent);
  if (context === undefined) return baseResult;

  return { ...baseResult, context };
};

const createBaseGrepResult = (
  filePath: string,
  lineNumber: number,
  matchIndex: number,
  lineContent: string,
): GrepResult => ({
  file: filePath,
  line: lineNumber + 1,
  column: matchIndex + 1,
  match: lineContent,
});

const normalizeGrepResultArgs = (
  args: CreateGrepResultArgs,
): { resultInput: GrepResultInput; contextInput: GrepContextInput } => {
  if (args.length === 2) return { resultInput: args[0], contextInput: args[1] };

  const [filePath, lineNumber, matchIndex, lineContent, lines, contextSize] = args;
  const resultInput = { filePath, lineNumber, matchIndex, lineContent };
  const contextInput = { lines, contextSize };
  return { resultInput, contextInput };
};

export const logVerboseError = (filePath: string, error: unknown, verbose: boolean): void => {
  if (!verbose) return;

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to search ${filePath}: ${errorMessage}`);
};

export const extractMatchesFromLine = (...args: ExtractMatchesArgs): GrepResult[] => {
  const { lineInput, contextInput } = normalizeExtractMatchesArgs(args);
  const { line, lineIndex, regex, filePath } = lineInput;

  return [...line.matchAll(regex)].map((match) =>
    createGrepResult(
      {
        filePath,
        lineNumber: lineIndex,
        matchIndex: match.index!,
        lineContent: line,
      },
      contextInput,
    ),
  );
};

const normalizeExtractMatchesArgs = (
  args: ExtractMatchesArgs,
): { lineInput: LineMatchesInput; contextInput: GrepContextInput } => {
  if (args.length === 2) return { lineInput: args[0], contextInput: args[1] };

  const [line, lineIndex, regex, filePath, lines, contextSize] = args;
  const lineInput = { line, lineIndex, regex, filePath };
  const contextInput = { lines, contextSize };
  return { lineInput, contextInput };
};

export const shouldStopSearching = (
  currentCount: number,
  maxMatches: number | undefined,
): boolean => {
  const limit = maxMatches ?? Infinity;
  return currentCount >= limit;
};

export const searchFileContent = (
  filePath: string,
  regex: RegExp,
  options: GrepOptions,
): GrepResult[] => {
  try {
    return searchReadableFile(filePath, regex, options);
  } catch (error: unknown) {
    logVerboseError(filePath, error, options.verbose ?? false);
    return [];
  }
};

const searchReadableFile = (
  filePath: string,
  regex: RegExp,
  options: GrepOptions,
): GrepResult[] => {
  const content = readFile(filePath, false);
  const isString = typeof content === "string";
  if (!isString) return [];

  const lines = content.split("\n");
  const contextInput = { lines, contextSize: options.context };
  const allResults = lines.flatMap((line, lineIndex) =>
    extractMatchesFromLine({ line, lineIndex, regex, filePath }, contextInput),
  );

  const maxMatches = options.maxMatches ?? Infinity;
  return allResults.slice(0, maxMatches);
};

export const searchInDirectory = (
  path: string,
  regex: RegExp,
  options: GrepOptions,
): GrepResult[] => {
  const files = listFiles(path, {
    recursive: true,
    extensions: [...DEFAULT_SEARCH_EXTENSIONS],
  });

  return files
    .filter((file) => file.isFile)
    .flatMap((file) => searchFileContent(file.path, regex, options));
};

export function grep(pattern: string, path: string, options?: GrepOptions): GrepResult[];
export function grep(pattern: RegExp, path: string, options?: GrepOptions): GrepResult[];

export function grep(
  pattern: string | RegExp,
  path: string,
  options: GrepOptions = {},
): GrepResult[] {
  const regex = createRegexFromPattern(pattern, options.ignoreCase ?? false);
  const stats = statSync(path);

  if (stats.isFile()) return searchFileContent(path, regex, options);

  const shouldSearchDirectory = stats.isDirectory() && options.recursive;
  if (shouldSearchDirectory) return searchInDirectory(path, regex, options);

  return [];
}
