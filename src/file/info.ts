import { stat } from "node:fs/promises";
import { extname, basename } from "node:path";
import type { FileInfo } from "./types";

export const createFileInfo = (
  path: string,
  stats: Awaited<ReturnType<typeof stat>>,
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

export const getFileInfo = async (path: string): Promise<FileInfo> => {
  const stats = await stat(path);
  return createFileInfo(path, stats);
};
