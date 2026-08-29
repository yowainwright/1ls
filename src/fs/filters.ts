import type { FileInfo } from "./types.ts";

export const isHiddenFile = (entry: string): boolean => entry.startsWith(".");

export const shouldIncludeHiddenFile = (entry: string, includeHidden: boolean): boolean =>
  includeHidden || !isHiddenFile(entry);

export const matchesExtensionFilter = (ext: string, extensions: string[] | undefined): boolean => {
  const hasFilter = extensions !== undefined;
  if (!hasFilter) return true;

  return extensions.includes(ext);
};

export const matchesPatternFilter = (name: string, pattern: RegExp | undefined): boolean => {
  const hasFilter = pattern !== undefined;
  if (!hasFilter) return true;

  return pattern.test(name);
};

export const shouldIncludeFile = (
  info: FileInfo,
  extensions: string[] | undefined,
  pattern: RegExp | undefined,
): boolean => {
  const extensionMatch = matchesExtensionFilter(info.ext, extensions);
  const patternMatch = matchesPatternFilter(info.name, pattern);
  return extensionMatch && patternMatch;
};

export const isWithinDepthLimit = (depth: number, maxDepth: number | undefined): boolean => {
  const limit = maxDepth ?? Infinity;
  return depth <= limit;
};
