import { parseInput } from "../formats";
import type { DataFormat } from "./types";

export async function processInput(format?: DataFormat): Promise<unknown> {
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
