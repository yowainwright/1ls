import type { DataFormat } from "./types.ts";
import { parseInputSync } from "./sync.ts";

export { detectFormat, parseLines } from "./detect.ts";
export { parseInputSync } from "./sync.ts";

export async function parseInput(input: string, format?: DataFormat): Promise<unknown> {
  await Promise.resolve();
  return parseInputSync(input, format);
}
