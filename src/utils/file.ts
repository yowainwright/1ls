import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import type { FileInfo, ListOptions, GrepOptions, GrepResult } from "./types";
import { DEFAULT_SEARCH_EXTENSIONS } from "./constants";

export async function readFile(path: string): Promise<any> {
  try {
    const file = Bun.file(path);
    const text = await file.text();

    if (path.endsWith(".json")) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return text;
  } catch (error: any) {
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
}

export async function writeFile(path: string, content: any): Promise<void> {
  try {
    const data =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);
    await Bun.write(path, data);
  } catch (error: any) {
    throw new Error(`Failed to write file ${path}: ${error.message}`);
  }
}

export async function getFileInfo(path: string): Promise<FileInfo> {
  const stats = await stat(path);
  return {
    path,
    name: basename(path),
    ext: extname(path),
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    modified: stats.mtime,
    created: stats.birthtime,
  };
}

export async function listFiles(
  dir: string,
  options: ListOptions = {},
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const currentDepth = 0;

  async function walk(currentDir: string, depth: number) {
    if (options.maxDepth !== undefined && depth > options.maxDepth) {
      return;
    }

    const entries = await readdir(currentDir);

    for (const entry of entries) {
      const isHidden = entry.startsWith(".");
      const shouldSkipHidden = !options.includeHidden && isHidden;
      if (shouldSkipHidden) continue;

      const fullPath = join(currentDir, entry);
      const info = await getFileInfo(fullPath);

      if (info.isFile) {
        const hasExtensionFilter = options.extensions !== undefined;
        const matchesExtension =
          !hasExtensionFilter ||
          options.extensions?.includes(info.ext) ||
          false;

        const hasPatternFilter = options.pattern !== undefined;
        const matchesPattern =
          !hasPatternFilter || options.pattern?.test(info.name) || false;

        const shouldIncludeFile = matchesExtension && matchesPattern;
        if (shouldIncludeFile) files.push(info);
      } else if (info.isDirectory) {
        files.push(info);
        const shouldRecurse = options.recursive === true;
        if (shouldRecurse) {
          await walk(fullPath, depth + 1);
        }
      }
    }
  }

  await walk(dir, currentDepth);
  return files;
}

export async function grep(
  pattern: string | RegExp,
  path: string,
  options: GrepOptions = {},
): Promise<GrepResult[]> {
  const results: GrepResult[] = [];
  const regex =
    typeof pattern === "string"
      ? new RegExp(pattern, options.ignoreCase ? "gi" : "g")
      : pattern;

  async function searchFile(filePath: string) {
    try {
      const content = await readFile(filePath);
      if (typeof content !== "string") return;

      const lines = content.split("\n");
      let matchCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = [...line.matchAll(regex)];

        for (const match of matches) {
          if (options.maxMatches && matchCount >= options.maxMatches) {
            return;
          }

          const result: GrepResult = {
            file: filePath,
            line: i + 1,
            column: match.index! + 1,
            match: line,
          };

          if (options.context) {
            const start = Math.max(0, i - options.context);
            const end = Math.min(lines.length, i + options.context + 1);
            result.context = lines.slice(start, end);
          }

          results.push(result);
          matchCount++;
        }
      }
    } catch {}
  }

  const stats = await stat(path);

  if (stats.isFile()) {
    await searchFile(path);
  } else if (stats.isDirectory() && options.recursive) {
    const files = await listFiles(path, {
      recursive: true,
      extensions: [...DEFAULT_SEARCH_EXTENSIONS],
    });

    for (const file of files) {
      if (file.isFile) {
        await searchFile(file.path);
      }
    }
  }

  return results;
}
