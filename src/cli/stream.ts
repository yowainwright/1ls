import { parseInput } from "../formats/index.ts";
import type { DataFormat } from "../formats/types.ts";

export async function readStdin(): Promise<string> {
  let chunks: Uint8Array[] = [];

  for await (const chunk of process.stdin) {
    chunks = [...chunks, chunk];
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
