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
    const table: Record<string, unknown> = {};
    const pairs = value.slice(1, -1).split(",");

    pairs.forEach((pair) => {
      const [k, v] = pair.split("=").map((s) => s.trim());
      if (k && v) {
        table[k] = parseTOMLValue(v);
      }
    });

    return table;
  }

  return value;
}

export function parseTOML(input: string): unknown {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;
  let currentSectionPath: string[] = [];

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
      currentSection = result;
      currentSectionPath = [];

      sectionPath.forEach((part) => {
        if (!currentSection[part]) {
          currentSection[part] = {};
        }
        currentSection = currentSection[part] as Record<string, unknown>;
        currentSectionPath.push(part);
      });
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
