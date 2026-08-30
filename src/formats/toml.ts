import { TOML } from "./constants.ts";

const isTOMLQuote = (char: string): boolean => {
  if (char === '"') return true;
  return char === "'";
};

export function parseTOMLValue(value: string): unknown {
  const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"');
  if (hasDoubleQuotes) return value.slice(1, -1).replace(/\\"/g, '"');

  const hasSingleQuotes = value.startsWith("'") && value.endsWith("'");
  if (hasSingleQuotes) return value.slice(1, -1);

  if (value === "true") return true;
  if (value === "false") return false;
  return parseTOMLStructuredValue(value);
}

function parseTOMLStructuredValue(value: string): unknown {
  const isInteger = TOML.INTEGER.test(value);
  if (isInteger) return parseInt(value, 10);

  const isFloat = TOML.FLOAT.test(value);
  if (isFloat) return parseFloat(value);

  const isArray = value.startsWith("[") && value.endsWith("]");
  if (isArray) {
    const items = value.slice(1, -1).split(",");
    const values: unknown[] = [];

    for (let index = 0; index < items.length; index++) {
      values[index] = parseTOMLValue(items[index].trim());
    }

    return values;
  }

  const isInlineTable = value.startsWith("{") && value.endsWith("}");
  if (isInlineTable) {
    return parseTOMLInlineTable(value);
  }

  return value;
}

const parseTOMLPair = (pair: string): [string | undefined, string | undefined] => {
  const [key, value] = pair.split("=");
  return [key?.trim(), value?.trim()];
};

function parseTOMLInlineTable(value: string): Record<string, unknown> {
  const table: Record<string, unknown> = {};
  const pairs = value.slice(1, -1).split(",");

  pairs.forEach((pair) => {
    const [key, parsedValue] = parseTOMLPair(pair);
    if (!key) return;
    if (!parsedValue) return;
    table[key] = parseTOMLValue(parsedValue);
  });

  return table;
}

function getTOMLSection(
  result: Record<string, unknown>,
  sectionPath: string[],
): Record<string, unknown> {
  let section = result;

  sectionPath.forEach((part) => {
    if (!section[part]) section[part] = {};
    section = section[part] as Record<string, unknown>;
  });

  return section;
}

const stripTOMLComment = (line: string): string => {
  const commentIdx = line.indexOf("#");
  if (commentIdx < 0) return line;
  const beforeComment = line.substring(0, commentIdx);
  const quoteCount = countTOMLQuotes(beforeComment);
  const isOutsideQuotes = quoteCount % 2 === 0;
  if (!isOutsideQuotes) return line;
  return beforeComment;
};

const countTOMLQuotes = (line: string): number => {
  let count = 0;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (isTOMLQuote(char)) count++;
  }

  return count;
};

const parseTOMLLine = (
  result: Record<string, unknown>,
  currentSection: Record<string, unknown>,
  rawLine: string,
): Record<string, unknown> => {
  const trimmed = stripTOMLComment(rawLine).trim();
  if (!trimmed) return currentSection;
  const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
  if (isSection) return getTOMLSection(result, trimmed.slice(1, -1).split("."));
  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex <= 0) return currentSection;
  const key = trimmed.substring(0, equalsIndex).trim();
  const value = trimmed.substring(equalsIndex + 1).trim();
  currentSection[key] = parseTOMLValue(value);
  return currentSection;
};

export function parseTOML(input: string): unknown {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;

  lines.forEach((rawLine) => {
    currentSection = parseTOMLLine(result, currentSection, rawLine);
  });

  return result;
}
