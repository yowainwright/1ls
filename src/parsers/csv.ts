import { CSV } from "./constants";

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  const chars = line.split("");
  chars.forEach((char, i) => {
    const nextChar = chars[i + 1];

    if (char === '"') {
      const isEscapedQuote = inQuotes && nextChar === '"';
      if (isEscapedQuote) {
        current += '"';
        chars.splice(i + 1, 1);
        return;
      }
      inQuotes = !inQuotes;
      return;
    }

    const isDelimiter = char === delimiter && !inQuotes;
    if (isDelimiter) {
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

  const isNumber = CSV.NUMBER.test(trimmed);
  if (isNumber) {
    return parseFloat(trimmed);
  }

  const lowerValue = trimmed.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  const isEmpty = trimmed === "" || lowerValue === "null";
  if (isEmpty) return null;

  return trimmed;
}

export function parseCSV(input: string, delimiter = ","): unknown[] {
  const lines = input.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0], delimiter);
  if (lines.length === 1) return [];

  return lines.slice(1).reduce((data: unknown[], line) => {
    const values = parseCSVLine(line, delimiter);
    if (values.length === 0) return data;

    const row = Object.fromEntries(
      headers.map((header, j) => [header, parseCSVValue(values[j] || "")])
    );

    return [...data, row];
  }, []);
}

export function parseTSV(input: string): unknown[] {
  return parseCSV(input, "\t");
}
