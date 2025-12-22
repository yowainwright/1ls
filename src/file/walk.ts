import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { FileInfo, ListOptions } from "./types";
import { getFileInfo } from "./info";
import {
  shouldIncludeHiddenFile,
  shouldIncludeFile,
  isWithinDepthLimit,
} from "./filters";

export const processDirectoryEntry = async (
  currentDir: string,
  entry: string,
  depth: number,
  options: ListOptions,
): Promise<FileInfo[]> => {
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
};

export const walkDirectory = async (
  currentDir: string,
  depth: number,
  options: ListOptions,
): Promise<FileInfo[]> => {
  const canContinue = isWithinDepthLimit(depth, options.maxDepth);
  if (!canContinue) return [];

  const entries = await readdir(currentDir);

  const fileArrays = await Promise.all(
    entries.map((entry) =>
      processDirectoryEntry(currentDir, entry, depth, options),
    ),
  );

  return fileArrays.flat();
};

export const listFiles = async (
  dir: string,
  options: ListOptions = {},
): Promise<FileInfo[]> => walkDirectory(dir, 0, options);
