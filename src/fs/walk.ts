import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { FileInfo, ListOptions } from "./types.ts";
import { getFileInfo } from "./info.ts";
import { shouldIncludeHiddenFile, shouldIncludeFile, isWithinDepthLimit } from "./filters.ts";

export const processDirectoryEntry = (
  currentDir: string,
  entry: string,
  depth: number,
  options: ListOptions,
): FileInfo[] => {
  const shouldInclude = shouldIncludeHiddenFile(entry, options.includeHidden ?? false);
  if (!shouldInclude) return [];

  const fullPath = join(currentDir, entry);
  const info = getFileInfo(fullPath);

  if (info.isFile) {
    const shouldAdd = shouldIncludeFile(info, options.extensions, options.pattern);
    return shouldAdd ? [info] : [];
  }

  if (!info.isDirectory) return [];

  const shouldRecurse = Boolean(options.recursive);
  const childFiles = shouldRecurse ? walkDirectory(fullPath, depth + 1, options) : [];

  return [info, ...childFiles];
};

export const walkDirectory = (
  currentDir: string,
  depth: number,
  options: ListOptions,
): FileInfo[] => {
  const canContinue = isWithinDepthLimit(depth, options.maxDepth);
  if (!canContinue) return [];

  const entries = readdirSync(currentDir);
  const fileArrays = entries.map((entry) => processDirectoryEntry(currentDir, entry, depth, options));

  return fileArrays.flat();
};

export const listFiles = (dir: string, options: ListOptions = {}): FileInfo[] =>
  walkDirectory(dir, 0, options);
