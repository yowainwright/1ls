import { parseInput } from "../formats";
import type { DataFormat } from "../formats/types";

export async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

export async function processInput(format?: DataFormat): Promise<unknown> {
  const input = (await readStdin()).trim();

  if (!input) {
    return null;
  }

  return parseInput(input, format);
}
