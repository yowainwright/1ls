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
import { parseYAML } from "./yaml/index";

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

const parseStructuredInput = (input: string, format: DataFormat): unknown => {
  if (format === "json") return parseJsonWithPreview(input);
  if (format === "json5") return parseJSON5(input);
  if (format === "yaml") return parseYAML(input);
  if (format === "toml") return parseTOML(input);
  if (format === "xml") return parseXML(input);
  if (format === "ini") return parseINI(input);
  return undefined;
};

const parseDelimitedInput = (input: string, format: DataFormat): unknown => {
  if (format === "csv") return parseCSV(input);
  if (format === "tsv") return parseTSV(input);
  return undefined;
};

const parseLineInput = (input: string, format: DataFormat): unknown => {
  if (format === "protobuf") return parseProtobuf(input);
  if (format === "env") return parseENV(input);
  if (format === "ndjson") return parseNDJSON(input);
  if (format === "lines") return parseLines(input);
  return undefined;
};

const parseFormattedInput = (input: string, format: DataFormat): unknown => {
  const structuredValue = parseStructuredInput(input, format);
  if (structuredValue !== undefined) return structuredValue;

  const delimitedValue = parseDelimitedInput(input, format);
  if (delimitedValue !== undefined) return delimitedValue;

  const lineValue = parseLineInput(input, format);
  if (lineValue !== undefined) return lineValue;

  return parseTextInput(input);
};

export function parseInputSync(input: string, format?: DataFormat): unknown {
  const actualFormat = format ?? detectFormat(input);
  return parseFormattedInput(input, actualFormat);
}
