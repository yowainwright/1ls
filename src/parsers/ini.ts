import { INI } from "./constants";

export function parseINIValue(value: string): unknown {
  const trimmed = value.trim();

  const hasQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  if (hasQuotes) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const isNumber = INI.NUMBER.test(trimmed);
  if (isNumber) return parseFloat(trimmed);

  return trimmed;
}

export function parseINI(input: string): Record<string, unknown> {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  let currentSection = "";

  const processedLines = lines.map((line) => {
    const commentIdx = line.indexOf(";");
    const hashCommentIdx = line.indexOf("#");

    const hasComment = commentIdx >= 0 || hashCommentIdx >= 0;
    if (!hasComment) return line;

    const firstCommentIdx =
      commentIdx >= 0 && hashCommentIdx >= 0
        ? Math.min(commentIdx, hashCommentIdx)
        : Math.max(commentIdx, hashCommentIdx);

    return line.substring(0, firstCommentIdx);
  });

  processedLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
    if (isSection) {
      currentSection = trimmed.slice(1, -1).trim();
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      return;
    }

    const equalsIdx = trimmed.indexOf("=");
    const hasKeyValue = equalsIdx > 0;

    if (hasKeyValue) {
      const key = trimmed.substring(0, equalsIdx).trim();
      const value = trimmed.substring(equalsIdx + 1).trim();

      const hasSection = currentSection.length > 0;
      if (hasSection) {
        const section = result[currentSection] as Record<string, unknown>;
        section[key] = parseINIValue(value);
        return;
      }

      result[key] = parseINIValue(value);
    }
  });

  return result;
}
