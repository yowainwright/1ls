import type { DataFormat } from "./types";
import { parseInputSync } from "./sync";

export { detectFormat, parseLines } from "./detect";
export { parseInputSync } from "./sync";

export async function parseInput(input: string, format?: DataFormat): Promise<unknown> {
  await Promise.resolve();
  return parseInputSync(input, format);
}
