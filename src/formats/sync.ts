import type { DataFormat } from "./types";
import { detectFormat, parseLines } from "./detect";
import { parseCSV, parseTSV } from "./csv";
import { parseENV } from "./env";
import { parseINI } from "./ini";
import { parseJSON5 } from "./json5";
import { parseNDJSON } from "./ndjson";
import { parseProtobuf } from "./protobuf";
import { parseTOML } from "./toml";
import { parseXML } from "./xml";
import { parseYAML } from "./yaml";

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

export function parseInputSync(input: string, format?: DataFormat): unknown {
  const actualFormat = format ?? detectFormat(input);

  if (actualFormat === "json") return parseJsonWithPreview(input);
  if (actualFormat === "json5") return parseJSON5(input);
  if (actualFormat === "yaml") return parseYAML(input);
  if (actualFormat === "toml") return parseTOML(input);
  if (actualFormat === "xml") return parseXML(input);
  if (actualFormat === "ini") return parseINI(input);
  if (actualFormat === "csv") return parseCSV(input);
  if (actualFormat === "tsv") return parseTSV(input);
  if (actualFormat === "protobuf") return parseProtobuf(input);
  if (actualFormat === "env") return parseENV(input);
  if (actualFormat === "ndjson") return parseNDJSON(input);
  if (actualFormat === "lines") return parseLines(input);
  return parseTextInput(input);
}
