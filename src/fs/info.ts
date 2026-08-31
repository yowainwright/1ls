import { statSync } from "node:fs";
import type { Stats } from "node:fs";
import { extname, basename } from "node:path";
import type { FileInfo } from "./types";

export const createFileInfo = (
  path: string,
  stats: Stats,
): FileInfo => ({
  path,
  name: basename(path),
  ext: extname(path),
  size: Number(stats.size),
  isDirectory: stats.isDirectory(),
  isFile: stats.isFile(),
  modified: stats.mtime,
  created: stats.birthtime,
});

export const getFileInfo = (path: string): FileInfo => {
  const stats = statSync(path);
  return createFileInfo(path, stats);
};
