import { parseBooleanValue, parseNullValue, tryParseNumber } from "./utils.ts";

interface CSVLineState {
  fields: string[];
  current: string;
  inQuotes: boolean;
  skipNext: boolean;
}

const appendCSVField = (state: CSVLineState): CSVLineState => ({
  fields: [...state.fields, state.current],
  current: "",
  inQuotes: state.inQuotes,
  skipNext: false,
});

const parseCSVChar = (
  state: CSVLineState,
  char: string,
  nextChar: string | undefined,
  delimiter: string,
): CSVLineState => {
  if (state.skipNext) return { ...state, skipNext: false };
  const isEscapedQuote = state.inQuotes && char === '"' && nextChar === '"';
  if (isEscapedQuote) return { ...state, current: state.current + '"', skipNext: true };
  if (char === '"') return { ...state, inQuotes: !state.inQuotes };
  const isDelimiter = char === delimiter && !state.inQuotes;
  if (isDelimiter) return appendCSVField(state);
  return { ...state, current: state.current + char };
};

export function parseCSVLine(line: string, delimiter: string): string[] {
  const chars = line.split("");
  const initialState: CSVLineState = {
    fields: [],
    current: "",
    inQuotes: false,
    skipNext: false,
  };
  const finalState = chars.reduce(
    (state, char, i) => parseCSVChar(state, char, chars[i + 1], delimiter),
    initialState,
  );
  return [...finalState.fields, finalState.current].map((field) => field.trim());
}

export function parseCSVValue(value: string): unknown {
  const trimmed = value.trim();

  const hasQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  if (hasQuotes) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  const numberValue = tryParseNumber(trimmed);
  if (numberValue !== undefined) return numberValue;

  const lowerValue = trimmed.toLowerCase();
  const boolValue = parseBooleanValue(lowerValue);
  if (boolValue !== undefined) return boolValue;

  const nullValue = parseNullValue(lowerValue);
  if (nullValue !== undefined) return nullValue;

  return trimmed;
}

function createCSVRow(headers: string[], line: string, delimiter: string): Record<string, unknown> | null {
  const values = parseCSVLine(line, delimiter);
  if (values.length === 0) return null;

  return Object.fromEntries(
    headers.map((header, j) => [header, parseCSVValue(values[j] || "")]),
  );
}

export function parseCSV(input: string, delimiter = ","): unknown[] {
  const lines = input.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0], delimiter);
  if (lines.length === 1) return [];

  const rows = lines
    .slice(1)
    .map((line) => createCSVRow(headers, line, delimiter))
    .filter((row): row is Record<string, unknown> => row !== null);

  return rows;
}

export function parseTSV(input: string): unknown[] {
  return parseCSV(input, "\t");
}
