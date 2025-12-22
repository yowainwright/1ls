import { parseInput } from "../formats";

export async function readFile(path: string): Promise<unknown>;
export async function readFile(path: string, parseJson: true): Promise<unknown>;
export async function readFile(path: string, parseJson: false): Promise<string>;

export async function readFile(
  path: string,
  parseJson = true,
): Promise<unknown> {
  const file = Bun.file(path);
  const content = await file.text();

  if (!parseJson) return content;

  return parseInput(content);
}

export const serializeContent = (content: unknown): string => {
  const isString = typeof content === "string";
  return isString ? content : JSON.stringify(content, null, 2);
};

export const writeFile = async (
  path: string,
  content: unknown,
): Promise<void> => {
  try {
    const data = serializeContent(content);
    await Bun.write(path, data);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${path}: ${errorMessage}`);
  }
};
