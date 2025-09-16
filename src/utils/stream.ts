import { parseInput } from "./parsers";
import type { DataFormat } from "./types";

export async function processInput(format?: DataFormat): Promise<any> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const input = Buffer.concat(chunks).toString("utf-8").trim();

  if (!input) {
    return null;
  }

  return parseInput(input, format);
}
