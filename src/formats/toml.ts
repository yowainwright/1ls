import { TOML } from "./constants";

export function parseTOMLValue(value: string): unknown {
  const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"');
  if (hasDoubleQuotes) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }

  const hasSingleQuotes = value.startsWith("'") && value.endsWith("'");
  if (hasSingleQuotes) {
    return value.slice(1, -1);
  }

  if (value === "true") return true;
  if (value === "false") return false;

  const isInteger = TOML.INTEGER.test(value);
  if (isInteger) return parseInt(value, 10);

  const isFloat = TOML.FLOAT.test(value);
  if (isFloat) return parseFloat(value);

  const isArray = value.startsWith("[") && value.endsWith("]");
  if (isArray) {
    const items = value.slice(1, -1).split(",");
    return items.map((item) => parseTOMLValue(item.trim()));
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

export function parseTOML(input: string): unknown {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;

  lines.forEach((rawLine) => {
    let line = rawLine;

    const commentIdx = line.indexOf("#");
    if (commentIdx >= 0) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      if (quoteCount % 2 === 0) {
        line = beforeComment;
      }
    }

    const trimmed = line.trim();
    if (!trimmed) return;

    const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
    if (isSection) {
      const sectionPath = trimmed.slice(1, -1).split(".");
      currentSection = getTOMLSection(result, sectionPath);
      return;
    }

    const equalsIndex = trimmed.indexOf("=");
    const isKeyValue = equalsIndex > 0;

    if (isKeyValue) {
      const key = trimmed.substring(0, equalsIndex).trim();
      const value = trimmed.substring(equalsIndex + 1).trim();
      currentSection[key] = parseTOMLValue(value);
    }
  });

  return result;
}
