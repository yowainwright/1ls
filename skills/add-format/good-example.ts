/**
 * GOOD: Format parser examples following 1ls patterns.
 *
 * Format parsers are sync functions: (input: string) => unknown
 * - String in, structured data out
 * - No external dependencies
 * - Build results with reduce/map/Object.fromEntries
 * - Use existing helpers from src/formats/utils.ts
 *
 * Reference: src/formats/csv.ts, src/formats/env.ts
 */

// GOOD: Simple key=value parser — sync, pure, uses reduce
function parseProperties(input: string): Record<string, unknown> {
  const lines = input.trim().split("\n");
  return lines.reduce<Record<string, unknown>>((acc, line) => {
    const trimmed = line.trim();
    const isBlank = trimmed.length === 0;
    const isComment = trimmed.startsWith("#") || trimmed.startsWith("!");
    if (isBlank || isComment) return acc;

    const eqIndex = trimmed.indexOf("=");
    const hasEquals = eqIndex !== -1;
    if (!hasEquals) return acc;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    return { ...acc, [key]: coerceValue(value) };
  }, {});
}

// GOOD: Value coercion — reusable helper, no deps, returns typed value
function coerceValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "") return null;

  const num = Number(value);
  const isValidNumber = !Number.isNaN(num) && value !== "";
  return isValidNumber ? num : value;
}

// GOOD: Tabular parser — returns Array<Record<string, unknown>>
function parsePipeDelimited(input: string): Record<string, unknown>[] {
  const lines = input.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split("|").map((h) => h.trim()).filter((h) => h.length > 0);

  return lines.slice(1).reduce<Record<string, unknown>[]>((rows, line) => {
    const isSeparator = /^[\s|:-]+$/.test(line);
    if (isSeparator) return rows;

    const values = line.split("|").map((v) => v.trim()).filter((v) => v.length > 0);
    const row = Object.fromEntries(
      headers.map((header, i) => [header, coerceValue(values[i] || "")]),
    );
    return [...rows, row];
  }, []);
}

// GOOD: Detection function — fast regex check, returns boolean
function isPipeDelimited(input: string): boolean {
  const firstLine = input.trim().split("\n")[0];
  const pipeCount = (firstLine.match(/\|/g) || []).length;
  return pipeCount >= 2;
}

// GOOD: Line-by-line parser with state tracking via reduce (no mutation)
function parseLogFormat(input: string): Record<string, unknown>[] {
  const LOG_PATTERN = /^\[(\d{4}-\d{2}-\d{2})\]\s+(\w+):\s+(.+)$/;

  return input
    .trim()
    .split("\n")
    .reduce<Record<string, unknown>[]>((entries, line) => {
      const match = LOG_PATTERN.exec(line);
      if (!match) return entries;

      const [, date, level, message] = match;
      return [...entries, { date, level, message }];
    }, []);
}

export { parseProperties, coerceValue, parsePipeDelimited, isPipeDelimited, parseLogFormat };
