import type { DataFormat } from "./types.ts";
import { detectFormat, parseLines } from "./detect.ts";
import { parseCSV, parseTSV } from "./csv.ts";
import { parseENV } from "./env.ts";
import { parseINI } from "./ini.ts";
import { parseJSON5 } from "./json5.ts";
import { parseNDJSON } from "./ndjson.ts";
import { parseProtobuf } from "./protobuf.ts";
import { parseTOML } from "./toml.ts";
import { parseXML } from "./xml.ts";
import { parseYAML } from "./yaml/index.ts";

type Parser = (input: string) => unknown;

const parseJsonWithPreview = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch (error) {
    const preview = input.length > 50 ? input.slice(0, 50) + "..." : input;
    throw new Error(`Invalid JSON: ${(error as Error).message}\nInput: ${preview}`);
  }
};

const parseTextInput = (input: string): unknown => {
  const looksLikeJSON = /^\s*[{[]/.test(input);
  if (looksLikeJSON) {
    return parseJsonWithPreview(input);
  }

  return input;
};

const INPUT_PARSERS: Partial<Record<DataFormat, Parser>> = {
  json: parseJsonWithPreview,
  json5: parseJSON5,
  yaml: parseYAML,
  toml: parseTOML,
  xml: parseXML,
  ini: parseINI,
  csv: parseCSV,
  tsv: parseTSV,
  protobuf: parseProtobuf,
  env: parseENV,
  ndjson: parseNDJSON,
  lines: parseLines,
};

export function parseInputSync(input: string, format?: DataFormat): unknown {
  const actualFormat = format ?? detectFormat(input);
  const parser = INPUT_PARSERS[actualFormat];
  if (!parser) return parseTextInput(input);
  return parser(input);
}
