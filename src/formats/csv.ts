import { parseBooleanValue, parseNullValue, tryParseNumber } from "./utils";

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  const chars = line.split("");
  chars.forEach((char, i) => {
    const nextChar = chars[i + 1];

    const isQuote = char === '"';
    if (isQuote) {
      const isEscapedQuote = inQuotes && nextChar === '"';
      if (isEscapedQuote) {
        current += '"';
        chars.splice(i + 1, 1);
        return;
      }
      inQuotes = !inQuotes;
      return;
    }

    const isUnquotedDelimiter = char === delimiter && !inQuotes;
    if (isUnquotedDelimiter) {
      result.push(current);
      current = "";
      return;
    }

    current += char;
  });

  result.push(current);
  return result.map((field) => field.trim());
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
