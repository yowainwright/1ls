import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseInputSync } from "../formats/sync";
import type { DataFormat } from "../formats/types";

export function readFile(path: string): unknown;
export function readFile(path: string, parseJson: true): unknown;
export function readFile(path: string, parseJson: false): string;
export function readFile(path: string, format: DataFormat): unknown;

export function readFile(
  path: string,
  parseOption: boolean | DataFormat = true,
): unknown {
  const content = readFileSync(path, "utf8");

  if (!parseOption) return content;

  const format = typeof parseOption === "string" ? parseOption : undefined;
  return parseInputSync(content, format);
}

export const serializeContent = (content: unknown): string => {
  const isString = typeof content === "string";
  return isString ? content : JSON.stringify(content, null, 2);
};

export const writeFile = async (path: string, content: unknown): Promise<void> => {
  try {
    await Promise.resolve();
    mkdirSync(dirname(path), { recursive: true });
    const data = serializeContent(content);
    writeFileSync(path, data, "utf8");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${path}: ${errorMessage}`);
  }
};
