import { mkdir, readFile as readTextFile, writeFile as writeTextFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseInput } from "../formats";
import type { DataFormat } from "../formats/types";

export async function readFile(path: string): Promise<unknown>;
export async function readFile(path: string, parseJson: true): Promise<unknown>;
export async function readFile(path: string, parseJson: false): Promise<string>;
export async function readFile(path: string, format: DataFormat): Promise<unknown>;

export async function readFile(
  path: string,
  parseOption: boolean | DataFormat = true,
): Promise<unknown> {
  const content = await readTextFile(path, "utf8");

  if (parseOption === false) return content;

  const format = typeof parseOption === "string" ? parseOption : undefined;
  return parseInput(content, format);
}

export const serializeContent = (content: unknown): string => {
  const isString = typeof content === "string";
  return isString ? content : JSON.stringify(content, null, 2);
};

export const writeFile = async (path: string, content: unknown): Promise<void> => {
  try {
    await mkdir(dirname(path), { recursive: true });
    const data = serializeContent(content);
    await writeTextFile(path, data, "utf8");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${path}: ${errorMessage}`);
  }
};
