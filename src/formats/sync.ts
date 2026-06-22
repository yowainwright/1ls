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

  switch (actualFormat) {
    case "json":
      return parseJsonWithPreview(input);
    case "json5":
      return parseJSON5(input);
    case "yaml":
      return parseYAML(input);
    case "toml":
      return parseTOML(input);
    case "xml":
      return parseXML(input);
    case "ini":
      return parseINI(input);
    case "csv":
      return parseCSV(input);
    case "tsv":
      return parseTSV(input);
    case "protobuf":
      return parseProtobuf(input);
    case "env":
      return parseENV(input);
    case "ndjson":
      return parseNDJSON(input);
    case "lines":
      return parseLines(input);
    case "text":
    default:
      return parseTextInput(input);
  }
}
